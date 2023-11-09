const _ = require('lodash');
const Group = require('./group.js');

/**
 * An object representing a privilege
 * A privilege always has a name and can act on 3 levels: Component, Group and Role
 | Field    | Description                                                                                       |
 |-----------|--------------------------------------------------------------------------------------------------|
 | Component | Either a feature in the system or a name of an API endpoint accepting calls on behalf of a user  |
 | Group     | The ID of a usergroup to which this privilege belongs                                            |
 | Role      | The role to which this privilege belongs                                                         |

 * Each value can also be replaced by a wildcard ('*'). This means that any check will always return true for that field<br />
 * @example
 * Privilege.grant('chris', {name: '*', component: '*', group: '*'}); // All wildcards
 * Privileges.hasPrivilege('chris', {name; 'read', component: 'matches', group: 'a-team'}); // Returns true
 *
 * // {name: '*', component: '*', group: null, role: null}
 * Privilege.grant('chris', {name: '*', component: '*'});
 * Privileges.hasPrivilege('chris', {name; 'read', component: 'matches'}); // Returns true
 * Privileges.hasPrivilege('chris', {name; 'write'}); // Returns true
 * Privileges.hasPrivilege('chris', {name; 'write', group: 'zcfc'}); // Returns false (no group privilege)
 *
 * // {name: '*', component: null, group: null, role: null}
 * Privilege.grant('chris', {name: '*'});
 * Privileges.hasPrivilege('chris', {name; 'read'}); // Returns true
 * Privileges.hasPrivilege('chris', {name; 'read', component: 'matches'}); // Returns false
 *
 * @typedef {Object} privilege
 * @property {String|'*'} name - Name of the privilege
 * @property {String|'*'|null} [component=null] - Name of the component
 * @property {String|'*'|null} [group=null] - ID of the group
 * @property {String|null} [role=null] - Name of the role on which this privilege applies
 */

/**
 * An ACL library based on user privileges for permissions
 * Although the library uses the notion of 'privileges', they are often used interchangeably with 'permissions' or even 'roles'.
 * Though its highly recommended to use it with the below semantics, for simple scenarios it doesn't really matter that much
 *
 * ### Recommended semantics (read carefully)
 * Privileges are granted to users. Permissions are being demanded by an entity or action to determine if the user is allowed. This means that:
 * - Each component responsible for 'granting' or 'assigning' something to users talks about 'privileges'
 * - Each code responsible for checking access, checks against a 'permission' like "read" or "register"
 * - Permissions in this library are implicitly or explicitly part of a privilege that has been granted to a user
 * - Privileges can infer 1 or multiple permissions by assigning a wildcard (*) permission (meaning the user will be granted all permissions)
 * - Privileges can explicitly disallow a user by putting an "!" before the permission name. (Ex: '!read')
 *
 * @todo support NOT in privileges
 * @example
 * const Privileges = require('privileges')(Storage);
 * @type {module.Privileges}
 */
class Privileges {

  /**
   * @param {Object} storage - A storage adapter with the right methods
   */
  constructor(storage) {
    this.storage = storage;
  }

  /**
   * Sanitizes the privilege values to ensure reliability and consistency
   * @param {privilege} privilege
   * @returns {privilege} privilege - Sanitized privilege
   */
  sanitize(privilege) {
    const { name, component = null, group = null, role = null } = privilege;

    return { name, component, group, role };
  }

  /**
   * Validates a privilege
   * @param {privilege} privilege
   * @returns {boolean}
   */
  validate(privilege) {
    if (typeof privilege !== 'object') {
      throw new TypeError(`Expected privilege to be an object. ${typeof privilege} with value "${privilege}" given`);
    }
    const { name, component, group, role } = privilege;

    this._validateNonEmptyString('name', name);
    this._validateNonEmptyString('component', component, true);
    this._validateNonEmptyString('group', group, true);
    this._validateNonEmptyString('role', role, true);
  }

  /**
   * Throws an error if the value is NOT a non-empty string
   * @param {String} field - Name of the value (used in thrown error)
   * @param {String} value - The expected non-empty string
   * @param {Boolean} optional - Skips validation if the value is null or undefined
   * @private
   */
  _validateNonEmptyString(field, value, optional = false) {
    const errorMessage = `Expected "${field}" to be a non-empty string, null or undefined. ${typeof value} with value "${value}" given`;
    if (!optional && !this.isNonEmptyString(value)) {
      throw new TypeError(errorMessage);
    }
    if (optional && value !== undefined && value !== null && !this.isNonEmptyString(value)) {
      throw new TypeError(errorMessage);
    }
  }

  /**
   * Checks if a value is a non-empty string
   * @example
   * Privileges.isNonEmptyString(''); // Returns false
   * Privileges.isNonEmptyString(' '); // Returns false
   * Privileges.isNonEmptyString(null); // Returns false
   * Privileges.isNonEmptyString('test'); // Returns true
   * @param {*} value
   * @returns {boolean}
   */
  isNonEmptyString(value) {
    return typeof value === 'string' && _.trim(value).length > 0;
  }

  /**
   * Register a privilege without attaching it to a user
   * Allows for example an UI to make a privilege selection
   * @param {privilege} privilege
   * @returns {String} id - ID of the registered privilege
   */
  register(privilege) {
    const sanitizedPrivilege = this.sanitize(privilege);
    return this.storage.register(sanitizedPrivilege);
  }

  /**
   * Does an exact match on name, group and component
   * @example
   * Privileges.register({name: 'test', component: 'matches', group: 'ajax'});
   * Privileges.exists({name: 'test', component: 'matches', group: 'ajax'}); // Returns true
   * // Example 2 wildcards do NOT match exactly
   * Privileges.register({name: 'test', component: 'matches', group: '*'});
   * Privileges.exists({name: 'test', component: 'matches', group: 'ajax'}); // Returns false
   *
   * @param {Object} selector - A filter containing the wanted privilege fields
   * @param {String} selector.name - Name of the privilege
   * @param {String} [selector.group] - Identifier of the group | team | customer
   * @param {String} [selector.component] - Identifier of the component
   * @returns {Boolean}
   */
  exists(selector) {
    if (!Object.keys(selector).every(key => ['name', 'component', 'group', 'role'].includes(key))) {
      throw new TypeError(`Invalid selector. Only "name", "group", "component" and "role" are allowed`);
    }
    return this.storage.exists(selector);
  }

  /**
   * Returns a flat array of unique properties extracted from
   * all privileges
   * @example
   * // Returns all groups that are attached to a privilege on component 'A'
   * Privileges.pluck('group', {component: 'A'});
   * @param {'name'|'component'|'group'} property - Name of the property
   * @param {Object} filter
   * @param {String} [filter.name] - Filter based on name
   * @param {String} [filter.component] Filter based on component
   * @param {String} [filter.group] Filter based on group
   * @returns {Array.<String>} - List of the requested property
   */
  pluck(property, filter) {
    return _.uniq(this.storage.filter(filter).map(privilege => privilege[property]));
  }


  /**
   * Grants one or multiple privileges to a user
   * @param {String} userId - ID of the user that will be granted the privilege
   * @param {(String|Array.<String>)} name - Name of the privilege that will be granted
   * @param {String} [component] - Component to which this privilege applies
   * @param {String} [group] - Group to which this privilege applies
   * @param {String|undefined} [role] - The role within the group to which this privilege applies
   * @example
   * // Below method results in a stored privilege: {name: 'read', component: 'userList', group: 'ajax', role: null}
   * Privileges.grant('chris', 'read', 'userList', 'ajax');
   * // Below method results in a stored privilege: {name: 'read', component: null, group: null, role: null}
   * Privileges.grant('chris', 'read');
   * @returns {String|Array<String>} id - ID of the registered privilege
   */
  grant(userId, name, component = null, group = null, role = null) {

    if (!userId || typeof userId !== 'string') {
      throw new Error(`Expected "userId" to be a string, ${typeof userId} given`);
    }

    if (name.constructor === Array) {
      if (name.length === 0) {
        throw new Error(`Expected "privilege" to be an object or an array of objects, empty array given`);
      }
      return name.map((name) => {
        return this.grant(userId, name, component, group, role);
      });
    }

    this.validate({ name, component, group, role });


    // TODO Fetch the subgroups if propagate is true
    // If subgroups -> Copy the given privilege and change the group of each privilege
    // then store each privilege copy on the given user

    return this.storage.setUserPrivilege(userId, this.sanitize({ name, component, group, role }));
  }

  /**
   * Revokes a user's privilege
   * @param {String} userId - ID of the user that w ill be granted the privilege
   * @param {String} privilegeId - ID of the privilege that needs to be revoked
   */
  revoke(userId, privilegeId) {

    if (!userId || typeof userId !== 'string') {
      throw new Error(`Expected "userId" to be a string, ${typeof userId} given`);
    }

    if (privilegeId.constructor === Array) {
      if (privilegeId.length === 0) {
        throw new Error(`Expected "privilegeId" to be a string or an array of strings, empty array given`);
      }
      return privilegeId.forEach((doc) => {
        this.revoke(userId, doc);
      });
    }

    if (!this.isNonEmptyString(privilegeId)) {
      throw new Error(`Expected "privilegeId" to be a non-empty string, ${typeof privilegeId} with value ${privilegeId} given`);
    }

    return this.storage.removeUserPrivilege(userId, privilegeId);
  }

  /**
   * Checks if a user has a privilege (alias of Privileges.has)
   * @param {String} userId - ID of the user from which the privilege has to be checked
   * @param {(String|Array.<String>)} name - Name of the privilege
   * @param {String} [component] - Identifier of the component
   * @param {String} [group] - Identifier of the group | team | customer
   * @returns {Boolean} - True if the user 'can' do it
   */
  can(userId, name, component, group) {
    return this.has(userId, name, component, group);
  }

  /**
   * Checks if a user has a privilege
   * @param {String} userId - ID of the user from which the privilege has to be checked
   * @param {(Object|Array.<String>)} name - Name of the privilege
   * @param {String} [component] - name of the component
   * @param {String} [group] - Name of the group
   * @returns {Boolean} - True if the user 'has' permission
   */
  has(userId, name, component, group) {
    if (name.constructor === Array) {
      if (name.length === 0) {
        throw new Error(`Expected "name" to be a non-empty string or an array of none-empty strings, empty array given`);
      }
      // Only one of the privileges has to result in true
      return name.some(name => {
        return this.has(userId, name, component, group);
      });
    }

    this.validate({ name, component, group });

    return this.hasPrivilege(userId, { name, component, group });
  }


  /**
   * Low level method that checks whether a user is granted a privilege
   * Also takes into account wildcards for name, component and group
   * Below is a matrix that represents possible combinations:
   * @example
   *
   * // { name: '*', component: '*', group: '*' } Globally all privileges
   * // { name,      component: '*', group: '*' } Global privilege
   * // { name: '*', component,      group: '*' } All privileges for the specified component in each group
   * // { name: '*', component: '*', group      } Globally all privileges in specified group
   * // { name,      component,      group: '*' } Specified privilege for specified component in each group
   * // { name,      component: '*', group      } Specified privilege for each components in specified group
   * // { name: '*', component,      group      } All privileges for specified component in specified group
   * // { name,      component,      group      } Specified privilege for specified component in specified group
   *
   * Privileges.grant('chris', {name: 'read', component: 'matches', group: '*'}); // All groups
   * Privileges.hasPrivilege('chris', {name: 'read', component: 'matches', group: 'zcfc'}); // Returns true
   *
   * @param {String} userId - ID of the user from which the privilege has to be checked
   * @param {(privilege|Array.<privilege>)} privilege - Privilege to check against
   * @returns Boolean - True if the user has the privilege
   */
  hasPrivilege(userId, privilege) {
    if (!this.isNonEmptyString(userId)) {
      return false;
    }

    if (privilege.constructor === Array) {
      return privilege.some((priv) => {
        return this.hasPrivilege(userId, priv);
      });
    }

    this.validate(privilege);

    const match = (requiredValue, value) => {
      return (value === requiredValue) || (value === '*');
    };

    // TODO create a cache that stores user privileges in memory
    // It should refresh when a privilege changes and when the user logs in and out
    const userPrivileges = this.storage.getAllUserPrivileges(userId);

    // Just one user privilege should match and the user is good to go
    return userPrivileges.some((userPrivilege) => {
      // Check if all fields match
      return ['name', 'component', 'group'].every(field => {
        return match(privilege[field], userPrivilege[field]);
      });
    });
  }

  /**
   * Registers a role with zero or more privileges globally or specifically for a group.
   * Use this method to group privileges which can then be assigned to a user
   * @param {String} name - Name of the role
   * @param {String} group - Name of the group
   * @param {(Object|Array.<Object>)} [privilege] - Privilege(s) to granted automatically to users assigned to this role
   * @param {String} privilege.name - Name of the privilege
   * @param {String} [privilege.component] - Identifier of the component
   * @param {String} [privilege.group] - Identifier of a group | team | customer
   * @todo Does the group parameter need to be part of this method or part of the privilege param?
   * @example
   * // Global roles without privileges
   * const roleId = Privileges.registerRole('player');
   *
   * // Global roles with privileges
   * const roleId = Privileges.registerRole('player', null, {name: 'read', component: 'matches'});
   * // If the above role is assigned to a user, it will result in a privilege with the below properties:
   * // {name: 'read', component: 'matches', group: null, role: 'player'}
   *
   * // Global roles that apply a privilege in each group using a wildcard
   * const roleId = Privileges.registerRole('player', '*', {name: 'read', component: 'matches'});
   * // If the above role is assigned to a user, it will result in a privilege with the below properties:
   * // {name: 'read', component: 'matches', group: '*', role: 'player'}
   * // Below results in exactly the same as above?
   * const roleId = Privileges.registerRole('player', null, {name: 'read', component: 'matches', group: '*'});
   *
   * // Group roles without privileges
   * const roleId = Privileges.registerRole('player', 'ajax-selection');
   *
   * // Group Roles with privileges
   * const roleIds = Privileges.registerRole('player', 'ajax-selection', {name: 'read', component: 'matches'});
   * // If the above role is assigned to a user, it will result in a privilege with the below properties:
   * // {name: 'read', component: 'matches', group: 'ajax-selection', role: 'player'}
   * @returns {(Object|Array.<Object>)} id - The ID or a list of ids of the registered role
   */
  registerRole(name, group, privilege) {
    this._validateNonEmptyString('name', name);
    this._validateNonEmptyString('group', group, true);

    if (privilege && privilege.constructor === Array) {
      return privilege.map(privilege => {
        return this.registerRole(name, group, privilege)
      });
    }

    if (privilege) {
      this.validate(privilege);
    }

    return this.storage.registerRole(name, group, privilege);
  }

  /**
   * Assigns a role to the given user
   * @param {String} userId - ID of the user to assign the role to
   * @param {(String|Array.<String>)} role - Name or a list of role names
   * @param {String} [group] - Identifier of the group | team | customer
   * @todo finish this
   * @example
   * // Assigning a role
   * Privileges.assign('chris', 'player'); // Assigns the player role to chris
   *
   * // Assigning multiple roles
   * Privileges.assign('chris', ['author', 'content-manager']);
   *
   * // Assigning group scoped roles
   * Privileges.assign('chris', 'admin', 'a-team');
   * @returns {(String|Array.<String>)} id - The id or a list of ids of the given roles
   */
  assignRole(userId, role, group = null) {

    if (role && role.constructor === Array) {
      return role.map(role => {
        return this.assignRole(userId, role, group)
      });
    }

    this._validateNonEmptyString('userId', userId);
    this._validateNonEmptyString('role', role);

    return this.storage.assignRole(userId, role, group);
  }

  /**
   * Checks if a user was assigned specific role
   * @param {String} userId - ID of the user from which the role has to be checked
   * @param {(String|Array.<String>)} role - Name of the role
   * @param {String} [group] - Identifier of the group | team | customer
   * @todo finish this
   * @example
   * // Simple role check
   * Privileges.assign('chris', 'developer');
   * Privileges.is('chris', 'developer'); // Returns true
   *
   * // Working with multiple roles
   * Privileges.assign('chris', ['author', 'content-manager']);
   * Privileges.is('chris', ['author', 'content-manager']); // Returns true
   * Privileges.is('chris', ['author', 'admin']); // Returns true (only one has to match)
   * Privileges.is('chris', ['moderator', 'admin']); // Returns false (none match)
   *
   * // Group scoped roles
   * Privileges.assign('chris', 'admin', 'a-team');
   * Privileges.is('chris', 'admin'); // Returns false, because chris is not a global admin
   * Privileges.is('chris', 'admin', 'a-team'); // Returns true, because chris is an admin for the a-team
   * @returns {Boolean}
   */
  is(userId, role, group = null) {
    this._validateNonEmptyString('userId', userId);
    this._validateNonEmptyString('role', role);
    this._validateNonEmptyString('group', group, true);

    return !!this.storage.getRole(userId, role, group);
  }
}

module.exports = function (storage) {
  return new Privileges(storage);
};
