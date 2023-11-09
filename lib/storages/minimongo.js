const _ = require('lodash');

/**
 * Minimongo storage for privileges
 *
 * Useful for testing the Privileges rule engine or for caching inferences
 * privileges
 */

module.exports = class MinimongoStorage {
  constructor(PrivilegesCollection, UserPrivilegesCollection) {
    this.Privileges = PrivilegesCollection;
    this.UserPrivileges = UserPrivilegesCollection;
  }

  sanitize(privilege) {

    const { name, component = null, group = null } = privilege;

    return { name, component, group };
  }

  /**
   * Registers a privilege
   * @param privilege
   */
  register(privilege) {
    const sanitizedPrivilege = this.sanitize(privilege);
    this.Privileges.upsert(sanitizedPrivilege, { $set: sanitizedPrivilege });
  }

  /**
   * Returns a privilege object using exact matching
   * @param privilege
   * @returns {Object}
   */
  get({ name, component = null, group = null }) {
    return this.Privileges.findOne({ name, component, group });
  }

  /**
   * Checks if a privilege was registered
   * @param privilege
   * @returns {boolean}
   */
  exists(privilege) {
    return !!this.get(privilege);
  }


  /**
   * Returns a list of privileges based on a given filter
   * @param filter
   * @returns {Array}
   */
  filter(filter) {
    return this.Privileges.find(filter).fetch();
  }

  /**
   * Fetches the user's privileges from the storage
   * @param userId
   * @returns {[Object]}
   */
  getAllUserPrivileges(userId) {
    if (!userId) {
      throw new Error(`Invalid userId. Expected non-empty string, ${typeof userId} given`);
    }
    return this.UserPrivileges.find({ userId }).fetch();
  }

  /**
   * Fetches a user's privilege from the storage using a exact match
   * @param userId
   * @param privilege
   * @returns {Object}
   */
  getUserPrivilege(userId, {name, component, group}) {
    if (!userId) {
      throw new Error(`Invalid userId. Expected non-empty string, ${typeof userId} given`);
    }
    if (!this.UserPrivileges.findOne({ userId, name, component, group })) {
      return undefined;
    }

    return this.UserPrivileges.findOne({ userId, name, component, group }, { name: 1, component: 1, group: 1 });
  }

  /**
   * Tests if a user has a specific privilege
   * @param userId
   * @param privilege
   * @returns {Boolean}
   */
  userHasPrivilege(userId, privilege) {
    if (!userId) {
      throw new Error(`Invalid userId. Expected non-empty string, ${typeof userId} given`);
    }
    return !!this.getUserPrivilege(userId, privilege);
  }

  /**
   * Sets a privilege on a user
   * @param userId
   * @param privilege
   */
  setUserPrivilege(userId, privilege) {

    if (this.userHasPrivilege(userId, privilege)) {
      return;
    }

    const { name, component, group } = this.sanitize(privilege);

    const userPrivilege = { userId, name, component, group };
    return this.UserPrivileges.upsert(userPrivilege, { $set: userPrivilege });
  }

  removeUserPrivilege(userId, privilege) {
    if (!this.userHasPrivilege(userId, privilege)) {
      return;
    }
    this.UserPrivileges.remove({ userId, name, component, group });
  }
};