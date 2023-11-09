const storage = require('../lib/storages/memory.js');
const Storage = new storage();

const Privileges = require('../lib/privileges.js')(Storage);


describe('Privileges using the InMemory storage', () => {

  afterEach(() => {
    Storage.userPrivileges = {};
    Storage.privileges = [];
    Storage.roles = [];
  });

  describe('Managing privileges', () => {
    it('Should register and tell that the privilege exists upon request', () => {
      Privileges.register({ name: 'read', component: 'matches', group: 'zcfc' });
      expect(Privileges.exists({ name: 'read', component: 'matches', group: 'zcfc' })).toBe(true);
    });

    it('Should return false, because the registered privilege is different from the requested', () => {
      Privileges.register({ name: 'read', component: 'matches', group: 'zcfc' });
      expect(Privileges.exists({ name: 'read', component: 'members', group: 'zcfc' })).toBe(false);
    });

    it('Should return false, because the registered privilege is different from the requested', () => {
      Privileges.register({ name: 'read', component: 'matches', group: 'zcfc' });
      expect(Privileges.exists({ name: 'read', component: 'members', group: 'zcfc' })).toBe(false);
    });
  });

  describe('Granting and checking user privileges', () => {
    it('Should support granting an explicit privilege', () => {
      Privileges.grant('chris', { name: 'read', component: 'matches', group: 'zcfc' });
      expect(Privileges.hasPrivilege('chris', { name: 'read', component: 'matches', group: 'zcfc' })).toBe(true);
    });

    it('Should support granting a privilege for a component within a specified group', () => {
      Privileges.grant('chris', { name: 'read', component: 'matches', group: '*' });
      expect(Privileges.hasPrivilege('chris', { name: 'read', component: 'matches', group: 'zcfc' })).toBe(true);
    });

    it('Should support granting a privilege for all components within a specified group', () => {
      Privileges.grant('chris', { name: 'read', component: '*', group: 'zcfc' });
      expect(Privileges.hasPrivilege('chris', { name: 'read', component: 'matches', group: 'zcfc' })).toBe(true);
    });

    it('Should support granting all privileges for a component within a specified group', () => {
      Privileges.grant('chris', { name: '*', component: 'matches', group: 'zcfc' });
      expect(Privileges.hasPrivilege('chris', { name: 'read', component: 'matches', group: 'zcfc' })).toBe(true);
    });

    it('Should support granting all privileges for all components within a specified group', () => {
      Privileges.grant('chris', { name: '*', component: '*', group: 'zcfc' });
      expect(Privileges.hasPrivilege('chris', { name: 'read', component: 'matches', group: 'zcfc' })).toBe(true);
    });

    it('Should support granting all privileges for all components within all groups', () => {
      Privileges.grant('chris', { name: '*', component: '*', group: '*' });
      expect(Privileges.hasPrivilege('chris', { name: 'read', component: 'matches', group: 'zcfc' })).toBe(true);
    });
  });

  describe('Permission checks without role', () => {
    it('Should return true when a global admin role is granted and the user is a global admin', () => {
      Privileges.grant('chris', { name: 'view', component: '*', group: '*' });
      expect(Privileges.can('chris', 'view', 'matches', 'zcfc')).toBe(true);
    });

    it('Should return false when a group admin role is granted, but the check requires a global admin', () => {
      Privileges.grant('chris', { name: 'view', component: '*', group: 'zcfc' });
      expect(Privileges.can('chris', 'view')).toBe(false);
    });

    it('Should return false when an admin role is granted without component and group', () => {
      Privileges.grant('chris', { name: 'view' });
      expect(Privileges.can('chris', 'view')).toBe(false);
    });

    it('Should default "component" to be a wildcard if not checked against', () => {
      Privileges.grant('chris', { name: 'view', component: '*', group: '*' });
      expect(Privileges.can('chris', 'view')).toBe(true);
    });

    it('Should default "group" to be a wildcard if not checked against', () => {
      Privileges.grant('chris', { name: 'view', component: '*', group: '*' });
      expect(Privileges.can('chris', 'view', 'matches')).toBe(true);
    });
  });




});