/**
 * An object representing a group
 * Each group has at least a 'parent' field to allow the group to be part of a hierarchy
 * For convenience some meta fields have been added like 'createdAt', 'updatedAt' and 'createdBy'
 * The group hierarchy allows a developer a convenient API to automatically propagate granted privileges to subgroups
 * @typedef {Object} group
 */

/**
 * A small extension on top of the Privileges library to manage group based privileges
 * @example
 * const Group = require('privileges').Group;
 * const Club = new Group(MongoStorage, 'ajax');
 */
class Group {

  constructor(storage, id) {
    this.storage = storage;
    this.id = id;
  }

  /**
   * Registers an object representing a group. The object can contain any fields.
   * This should make it relatively simple to hook it up to any group system out there
   * @example
   * const group = new Group(MongoStorage);
   * const groupId = group.register({name: 'ajax', title: 'Ajax', country: 'Netherlands', city: 'Amsterdam', shirtColors: ['#ffffff', '#d00532']});
   * @param {Object} props - Anything, a group is simply a reference
   * @returns {Group} Group - An instance of the Group library for the registered group
   */
  register(props) {
    if(this.id && this.details()) {
      throw new Error('Cannot register a group that already exists');
    }
    // Simply persist any props, even if this.id was set by the user
    this.id = this.storage.registerGroup(props);
    return this.id;
  }

  /**
   * Returns group details
   * @example
   * const group = new Group(MongoStorage, groupId);
   * const details = group.details();
   * @returns {Object} - The object with the group details
   */
  details() {
    return this.storage.fetchGroup(this.id);
  }

  /**
   * Puts 1 or more groups under the umbrella of another group (opposite of makeParentOf)
   * For example a club that registers multiple subgroups representing teams
   * @example
   * const group = new Group(MongoStorage, 'ajax');
   * group.makeParentOf('ajax-selection); // Make ajax a parent group of ajax-selection
   * @param {String|Array<String>} subgroupIds - An ID or a list of ID's of the child group(s)
   */
  makeParentOf(subgroupIds) {
    if (subgroupIds.constructor === Array) {
      return subgroupIds.forEach(subgroupId => this.storage.setGroupParent(subgroupId, this.id));
    }

    this.storage.setGroupParent(subgroupIds, this.id);
  }

  /**
   * Makes the group a subgroup of the given groupId (opposite of makeParentOf)
   * For example a team being put under the flag of a club
   * @example
   * const group = new Group(MongoStorage, 'ajax-selection');
   * group.makeChildOf('ajax'); // Make ajax-selection a child group of ajax
   * @param {String} groupId - ID of the group from which the current group is going to be part of
   */
  makeChildOf(groupId) {
    this.storage.setGroupParent(this.id, groupId);
  }

  // grant(userId, privilege, propagate = false) {
  //   if (propagate === true) {
  //     const subgroups = this.storage.getSubgroups(group);
  //     // store each privilege copy on the given user
  //     return subgroups.map(subgroup => {
  //       return this.storage.setUserPrivilege(userId, this.sanitize({ name, component, group: subgroup, role }));
  //     });
  //   }
  // }
}

module.exports = Group;