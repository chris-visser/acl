const storage = require('./memory.js');
const Storage = new storage();

describe('InMemoryStorage', () => {
  afterEach(() => {
    Storage.privileges = [];
    Storage.userPrivileges = {};
  });


  it('Should have a "setUserPrivilege" function', () => {
    expect(typeof Storage.setUserPrivilege).toBe('function');
  });
  it('Should have a "userHasPrivilege" function', () => {
    expect(typeof Storage.userHasPrivilege).toBe('function');
  });

  describe('# register({name, component, group})', () => {
    it('Should have a "register" function', () => {
      expect(typeof Storage.register).toBe('function');
    });

    it('Should store the given privilege', () => {
      Storage.register({ name: 'test', component: null, group: null });
      expect(Storage.privileges[0]).toMatchObject({ name: 'test', component: null, group: null });
    });
  });

  describe('# get({name, component, group})', () => {
    it('Should have a "get" function', () => {
      expect(typeof Storage.register).toBe('function');
    });

    it('Should return a privilege based on an exact match', () => {
      const privilege = { name: 'test', component: null, group: null };
      Storage.register(privilege);
      expect(Storage.get(privilege)).toMatchObject(privilege);
    });

    it('Should NOT return a privilege, because it doesnt match exactly', () => {
      const privilege = { name: 'test', component: 'test', group: null };
      Storage.register(privilege);
      expect(Storage.get({ name: 'test', component: null, group: null })).toBe(undefined);
    });

    it('Should NOT return a privilege when trying to match null against an undefined value ', () => {
      const privilege = { name: 'test', component: 'test', group: null };
      Storage.register(privilege);
      expect(Storage.get({ name: 'test', component: 'test', group: undefined })).toBe(undefined);
    });
  });

  describe('# exists(privilege)', () => {
    it('Should have an "exists" function', () => {
      expect(typeof Storage.exists).toBe('function');
    });

    it('Should return true when on an exact privilege match', () => {
      const privilege = { name: 'test', component: 'test', group: null };
      Storage.register(privilege);
      expect(Storage.exists(privilege)).toBe(true);
    });

    it('Should return false when the group doesnt match', () => {
      const privilege = { name: 'test', component: 'test', group: null };
      Storage.register(privilege);
      expect(Storage.exists({ name: 'test', component: 'test', group: undefined })).toBe(false);
    });
  });

  describe('# filter(selector)', () => {
    beforeEach(() => {
      [
        { name: 'kick', component: 'members', group: 'ofc' },
        { name: 'read', component: 'matches', group: 'zcfc' },
        { name: 'plan', component: 'matches', group: null },
        { name: 'view', component: 'groupsAdmin', group: null }
      ].forEach(privilege => {
        Storage.register(privilege);
      });
    });

    it('Should have an "exists" function', () => {
      expect(typeof Storage.filter).toBe('function');
    });

    it('Should select privileges based on name', () => {
      expect(Storage.filter({ name: 'kick' })).toMatchObject([{ name: 'kick', component: 'members', group: 'ofc' }]);
    });

    it('Should select privileges based on component', () => {
      expect(Storage.filter({ component: 'matches' })).toMatchObject([
        { name: 'read', component: 'matches', group: 'zcfc' },
        { name: 'plan', component: 'matches', group: null }
      ]);
    });

    it('Should select privileges based on group', () => {
      expect(Storage.filter({ group: 'zcfc' })).toMatchObject([
        { name: 'read', component: 'matches', group: 'zcfc' }
      ]);
    });

    it('Should select privileges based on name and component', () => {
      expect(Storage.filter({ name: 'read', component: 'matches' })).toMatchObject([
        { name: 'read', component: 'matches', group: 'zcfc' }
      ]);
    });

    it('Should select privileges based on name, group and component', () => {
      expect(Storage.filter({ name: 'read', component: 'matches', group: 'zcfc' })).toMatchObject([
        { name: 'read', component: 'matches', group: 'zcfc' }
      ]);
    });

    it('Should select privileges based on values that are NULL', () => {
      expect(Storage.filter({ name: 'plan', component: 'matches', group: null })).toMatchObject([
        { name: 'plan', component: 'matches', group: null }
      ]);
    });

    it('Should select nothing when a value is of an invalid format', () => {
      expect(Storage.filter({ group: undefined })).toMatchObject([]);
    });

    it('Should return false when there is no match', () => {
      const privilege = { name: 'test', component: 'test', group: null };
      Storage.register(privilege);
      expect(Storage.exists({ name: 'test', component: 'test', group: undefined })).toBe(false);
    });
  });

  describe('# getAllUserPrivileges(privilege)', () => {
    beforeEach(() => {
      Storage.userPrivileges = {
        chris: [
          { name: 'read', component: 'matches', group: 'zcfc' },
          { name: 'kick', component: 'members', group: 'zcfc' },
        ],
        johan: [
          { name: 'plan', component: 'matches', group: 'zcfc' }
        ],
      }
    });
    it('Should have a "getAllUserPrivileges" function', () => {
      expect(typeof Storage.getAllUserPrivileges).toBe('function');
    });

    it('Should throw an error when no userId was given', () => {
      expect(() => Storage.getAllUserPrivileges()).toThrowError(/invalid userId/i);
    });

    it('Should return an empty array when no privileges were set for the user', () => {
      expect(Storage.getAllUserPrivileges('ralph')).toMatchObject([]);
    });

    it('Should return an array with 2 privileges for the given user', () => {
      expect(Storage.getAllUserPrivileges('chris')).toMatchSnapshot();
    });
  });

  describe('# getUserPrivilege(privilege)', () => {
    beforeEach(() => {
      Storage.userPrivileges = {
        chris: [
          { name: 'read', component: 'matches', group: 'zcfc' },
          { name: 'kick', component: 'members', group: 'zcfc' },
        ],
        johan: [
          { name: 'plan', component: 'matches', group: 'zcfc' }
        ],
      }
    });
    it('Should have a "getAllUserPrivileges" function', () => {
      expect(typeof Storage.getUserPrivilege).toBe('function');
    });

    it('Should throw an error when no userId was given', () => {
      expect(() => Storage.getUserPrivilege()).toThrowError(/invalid userId/i);
    });

    it('Should return undefined when none of the privileges match for the user', () => {
      expect(Storage.getUserPrivilege('ralph', { name: 'read', component: 'matches', group: null })).toBe(undefined);
    });

    it('Should return the privilege for the given user, because it matches exactly', () => {
      expect(Storage.getUserPrivilege('chris', { name: 'read', component: 'matches', group: 'zcfc' })).toMatchSnapshot();
    });
  });

  describe('# userHasPrivilege(privilege)', () => {
    beforeEach(() => {
      Storage.userPrivileges = {
        chris: [
          { name: 'read', component: 'matches', group: 'zcfc' },
          { name: 'kick', component: 'members', group: 'zcfc' },
        ],
        johan: [
          { name: 'plan', component: 'matches', group: 'zcfc' }
        ],
      }
    });
    it('Should have a "getAllUserPrivileges" function', () => {
      expect(typeof Storage.userHasPrivilege).toBe('function');
    });

    it('Should throw an error when no userId was given', () => {
      expect(() => Storage.userHasPrivilege()).toThrowError(/invalid userId/i);
    });

    it('Should return false when none of the privileges match for the user', () => {
      expect(Storage.userHasPrivilege('ralph', { name: 'read', component: 'matches', group: null })).toBe(false);
    });

    it('Should return true, because the privilege matches exactly', () => {
      expect(Storage.userHasPrivilege('chris', { name: 'read', component: 'matches', group: 'zcfc' })).toBe(true);
    });
  });

  describe('# setUserPrivilege(privilege)', () => {
    it('Should have a "setUserPrivilege" function', () => {
      expect(typeof Storage.setUserPrivilege).toBe('function');
    });

    it('Should throw an error when no userId was given', () => {
      expect(() => Storage.setUserPrivilege()).toThrowError(/invalid userId/i);
    });

    it('Should set the privilege for the user', () => {
      Storage.setUserPrivilege('chris', { name: 'read', component: 'matches', group: 'zcfc' });
      expect(Storage.userPrivileges['chris'][0]).toMatchObject({ name: 'read', component: 'matches', group: 'zcfc' });
    });
    it('Should set 2 privileges for the user', () => {
      Storage.setUserPrivilege('chris', { name: 'read', component: 'matches', group: 'zcfc' });
      Storage.setUserPrivilege('chris', { name: 'read', component: 'members', group: 'zcfc' });
      expect(Storage.userPrivileges['chris']).toMatchSnapshot();
    });
  });

  describe('# removeUserPrivilege(privilege)', () => {
    beforeEach(() => {
      beforeEach(() => {
        Storage.userPrivileges = {
          chris: [
            { name: 'read', component: 'matches', group: 'zcfc' },
            { name: 'kick', component: 'members', group: 'zcfc' },
          ],
          johan: [
            { name: 'plan', component: 'matches', group: 'zcfc' }
          ],
        }
      });
    });
    it('Should have a "removeUserPrivilege" function', () => {
      expect(typeof Storage.removeUserPrivilege).toBe('function');
    });

    it('Should throw an error when no userId was given', () => {
      expect(() => Storage.removeUserPrivilege()).toThrowError(/invalid userId/i);
    });

    it('Should remove the privilege for the user', () => {
      Storage.removeUserPrivilege('chris', { name: 'read', component: 'matches', group: 'zcfc' });
      expect(Storage.userPrivileges['chris']).toMatchObject([{ name: 'kick', component: 'members', group: 'zcfc' }]);
    });
  });

});