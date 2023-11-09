const _ = require('lodash');

/**
 * In-memory storage for privileges
 *
 * Useful for testing the Privileges rule engine or for caching inferences
 * const Storage = require('privileges').InMemoryStorage;
 */

class InMemoryStorage {
  constructor() {
    this.userPrivileges = {}; // In memory map of user specific privileges
    this.privileges = []; // In memory list of privileges
    this.groups = [];
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
    if (_.findIndex(this.privileges, sanitizedPrivilege) === -1) {
      this.privileges.push(sanitizedPrivilege);
    }
  }

  /**
   * Returns a privilege object using exact matching
   * @param privilege
   * @returns {Object}
   */
  get(privilege) {
    return _.find(this.privileges, privilege);
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
    return _.filter(this.privileges, filter);
  }

  /**
   * Fetches the user's privileges from the storage
   * @param {String} userId
   */
  getAllUserPrivileges(userId) {
    if(!userId) {
      throw new Error(`Invalid userId. Expected non-empty string, ${typeof userId} given`);
    }
    return this.userPrivileges[userId] || [];
  }

  /**
   * Fetches a user's privilege from the storage using a exact match
   * @param userId
   * @param privilege
   * @returns {Object}
   */
  getUserPrivilege(userId, privilege) {
    if(!userId) {
      throw new Error(`Invalid userId. Expected non-empty string, ${typeof userId} given`);
    }
    if(!this.userPrivileges[userId]) {
      return undefined;
    }

    return _.find(this.userPrivileges[userId], privilege);
  }

  /**
   * Tests if a user has a specific privilege
   * @param userId
   * @param privilege
   * @returns {Boolean}
   */
  userHasPrivilege(userId, privilege) {
    if(!userId) {
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

    const sanitizedPrivilege = this.sanitize(privilege);

    if (!this.userPrivileges[userId]) { // Create a new user reference if needed
      this.userPrivileges[userId] = [];
    }

    this.userPrivileges[userId].push(sanitizedPrivilege);
  }

  removeUserPrivilege(userId, privilege) {
    if (!this.userHasPrivilege(userId, privilege)) {
      return;
    }
    this.userPrivileges[userId] = _.reject(this.userPrivileges[userId], storedPrivilege => {
      return _.isEqual(storedPrivilege, privilege);
    });
  }

  registerGroup(props) {
    this.groups.push(props);
    return this.groups.length -1; // return index of the item to represent a 'primary key'
  }

  setGroupParent(subId, mainId) {
    this.groups[subId].parentId = mainId;
  }
}

module.exports = InMemoryStorage;