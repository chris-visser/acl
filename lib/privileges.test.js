const ACL = require('./privileges.js');
const mockStorage = require('../test/mocks.js');

const Privileges = ACL(mockStorage);

describe('Privileges', () => {
  describe('# sanitize()', () => {
    it('Should add the "group" field with value NULL if not given', () => {
      expect(Privileges.sanitize({ name: 'kickMember', component: 'matches' }))
        .toMatchSnapshot();
    });
    it('Should add the "component" with value NULL if not given', () => {
      expect(Privileges.sanitize({ name: 'kickMember', group: 'zcfc' }))
        .toMatchSnapshot();
    });
    it('Should add the "group" and "component" fields. Both with value NULL if not given', () => {
      expect(Privileges.sanitize({ name: 'kickMember' }))
        .toMatchSnapshot();
    });
    it('Should not change any valid field', () => {
      expect(Privileges.sanitize({ name: 'kickMember', component: 'matches', group: 'zcfc' }))
        .toMatchSnapshot();
    });
    it('Should ignore the extra field', () => {
      expect(Privileges.sanitize({
        name: "kickMember",
        component: "matches",
        group: "zcfc",
        extra: 'invalid'
      })).toMatchSnapshot();
    });
  });

  describe('# isNonEmptyString(value)', () => {
    it('Should return false if the value is an empty string', () => {
      expect(Privileges.isNonEmptyString('')).toBe(false);
    });
    it('Should return false if the value is a string with only spaces', () => {
      expect(Privileges.isNonEmptyString(' ')).toBe(false);
    });
    it('Should return false if the value is an array', () => {
      expect(Privileges.isNonEmptyString([])).toBe(false);
    });
    it('Should return false if the value is a number', () => {
      expect(Privileges.isNonEmptyString(1)).toBe(false);
    });
    it('Should return false if the value is an object', () => {
      expect(Privileges.isNonEmptyString({})).toBe(false);
    });
    it('Should return false if the value is a boolean', () => {
      expect(Privileges.isNonEmptyString(false)).toBe(false);
    });
  });

  describe('# validate({name, component, group})', () => {
    it('Should return true when a valid privilege object is given', () => {
      expect(Privileges.validate({ name: 'read', component: 'test', group: 'hello' })).toBe(undefined);
    });
    it('Should return undefined when a privilege with only a name is given', () => {
      expect(Privileges.validate({ name: 'read' })).toBe(undefined);
    });
    it('Should throw if "name" is not given', () => {
      expect(() => Privileges.validate({})).toThrow();
    });

    it('Should always call the "isNonEmptyString" function to check the name', () => {
      const MockP = new ACL(mockStorage);
      MockP.isNonEmptyString = jest.fn();
      MockP.isNonEmptyString.mockReturnValue(true);
      MockP.validate({ name: 'nameValue' });
      expect(MockP.isNonEmptyString).toHaveBeenLastCalledWith('nameValue');
    });
    it('Should throw when "component" is an empty string', () => {
      expect(() => Privileges.validate({ name: 'test', component: '' })).toThrow();
    });
    it('Should throw when "group" is an empty string', () => {
      expect(() => Privileges.validate({ name: 'test', group: '' })).toThrow();
    });
    it('Should throw when "role" is an empty string', () => {
      expect(() => Privileges.validate({ name: 'test', role: '' })).toThrow();
    });
  });

  describe('# register()', () => {
    it('Should return the sanitized privilege object when successfully registered', () => {
      expect(Privileges.register({ name: 'test' })).toMatchSnapshot();
    });
    it('Should call the storage "register" function with a sanitized privilege', () => {
      Privileges.register({ name: 'test' });
      expect(mockStorage.register).toHaveBeenLastCalledWith({ name: 'test', component: null, group: null, role: null });
    });
  });

  describe('# exists()', () => {
    it('Should call the storage "exists" function with the given selector', () => {
      mockStorage.exists.mockReturnValueOnce(true);
      Privileges.exists({ component: 'A' });
      expect(mockStorage.exists).toHaveBeenLastCalledWith({ component: 'A' });
    });
    it('Should throw if the selector contains invalid fields', () => {
      mockStorage.exists.mockReturnValueOnce(true);
      expect(() => Privileges.exists({ test: 'A' })).toThrowError(/invalid selector/i);
    });
  });

  describe('# pluck(property, filter)', () => {
    it('Should call the storage filter function with the given filter object', () => {
      mockStorage.filter.mockReturnValueOnce([
        { name: 'create', component: 'A', group: 'a-team' }
      ]);
      Privileges.pluck('group', { component: 'A' });
      expect(mockStorage.filter).toHaveBeenLastCalledWith({ component: 'A' });
    });

    it('Should return a list of all groups having access to component A', () => {
      mockStorage.filter.mockReturnValueOnce([
        { name: 'create', component: 'A', group: 'a-team' },
        { name: 'create', component: 'A', group: 'b-team' },
        { name: 'read', component: 'A', group: null },
      ]);
      expect(Privileges.pluck('group', { component: 'A' })).toMatchSnapshot();
    });
    it('Should return a list of all groups having the "create" privilege', () => {
      mockStorage.filter.mockReturnValueOnce([
        { name: 'create', component: 'A', group: 'a-team' },
        { name: 'create', component: 'A', group: 'b-team' },
        { name: 'create', component: 'A', group: null }
      ]);
      expect(Privileges.pluck('group', { name: 'create' })).toMatchSnapshot();
    });
    it('Should return a list of all privilege names attached to component A', () => {
      mockStorage.filter.mockReturnValueOnce([
        { name: 'create', component: 'A', group: 'a-team' },
        { name: 'read', component: 'A', group: 'b-team' },
        { name: 'update', component: 'A', group: null }
      ]);
      expect(Privileges.pluck('name', { component: 'A' })).toMatchSnapshot();
    });
    it('Should return a list of all privilege names attached to group a-team', () => {
      mockStorage.filter.mockReturnValueOnce([
        { name: 'create', component: 'A', group: 'a-team' },
        { name: 'read', component: 'A', group: 'a-team' },
        { name: 'update', component: 'A', group: 'a-team' }
      ]);
      expect(Privileges.pluck('name', { group: 'a-team' })).toMatchSnapshot();
    });
    it('Should return an array of strings of all components attached to group "a-team"', () => {
      mockStorage.filter.mockReturnValueOnce([
        { name: 'create', component: 'A', group: 'a-team' },
        { name: 'create', component: 'B', group: 'a-team' },
        { name: 'create', component: 'C', group: 'a-team' }
      ]);
      expect(Privileges.pluck('component', { group: 'a-team' })).toMatchSnapshot();
    });
    it('Should return an array of strings of all components that are attached to the "create" privilege', () => {
      mockStorage.filter.mockReturnValueOnce([
        { name: 'create', component: 'A', group: 'a-team' },
        { name: 'create', component: 'B', group: 'b-team' },
        { name: 'create', component: 'C', group: null }
      ]);
      expect(Privileges.pluck('component', { name: 'create' })).toMatchSnapshot();
    });
  });

  describe('# grant(userId, {name, group, component, role}', () => {
    it('Should accept a privilege name as value', () => {
      mockStorage.setUserPrivilege.mockReturnValueOnce('1');
      expect(Privileges.grant('chris', 'read')).toBe('1');
    });

    it('Should call the storage "setUserPrivilege"', () => {
      Privileges.grant('chris', 'test');
      expect(mockStorage.setUserPrivilege).toHaveBeenLastCalledWith('chris', {
        name: 'test',
        component: null,
        group: null,
        role: null
      });
    });

    it('Should accept an array of privileges as the value', () => {
      mockStorage.setUserPrivilege.mockReturnValueOnce('1');
      expect(Privileges.grant('chris', ['read'])).toMatchObject(['1']);
    });
    it('Should throw an error when userId is undefined', () => {
      expect(() => Privileges.grant(undefined, 'read')).toThrow();
    });
    it('Should throw an error when privileges is an empty array', () => {
      expect(() => Privileges.grant('chris', [])).toThrowError(/empty array given/);
    });
  });

  describe('# revoke(userId, {name, group, component}', () => {
    it('Should accept a string as privilegeId', () => {
      expect(Privileges.revoke('chris', 'test')).toBe(undefined);
    });

    it('Should accept an array with strings as privilegeId', () => {
      expect(Privileges.revoke('chris', ['test'])).toBe(undefined);
    });

    it('Should call the storage "removeUserPrivilege"', () => {
      Privileges.revoke('chris', 'test');
      expect(mockStorage.removeUserPrivilege).toHaveBeenLastCalledWith('chris', 'test');
    });

    it('Should throw an error when userId is undefined', () => {
      expect(() => Privileges.revoke(undefined, 'test')).toThrow();
    });
    it('Should throw an error when privilegeId is an empty array', () => {
      expect(() => Privileges.revoke('chris', [])).toThrowError(/empty array given/);
    });
  });


  describe('# has(userId, name, group, component)', () => {
    it('Should throw if "name" is an empty array', () => {
      expect(() => Privileges.has('chris', [])).toThrow();
    });

    it('Should call the hasPrivilege method with the userId and a privilege with only a "name" field', () => {
      const MockP = new ACL(mockStorage);
      MockP.hasPrivilege = jest.fn();
      MockP.hasPrivilege.mockReturnValue(true);
      MockP.has('chris', 'read');
      expect(MockP.hasPrivilege).toHaveBeenLastCalledWith('chris', { name: 'read' });
    });

    it('Should call the hasPrivilege method with the userId and a privilege with a "name" and "component" field', () => {
      const MockP = new ACL(mockStorage);
      MockP.hasPrivilege = jest.fn();
      MockP.hasPrivilege.mockReturnValue(true);
      MockP.has('chris', 'read', 'login');
      expect(MockP.hasPrivilege).toHaveBeenLastCalledWith('chris', { name: 'read', component: 'login' });
    });

    it('Should call the hasPrivilege method with the userId and a privilege with a "name" and "group" field', () => {
      const MockP = new ACL(mockStorage);
      MockP.hasPrivilege = jest.fn();
      MockP.hasPrivilege.mockReturnValue(true);
      MockP.has('chris', 'read', undefined, 'a-team');
      expect(MockP.hasPrivilege).toHaveBeenLastCalledWith('chris', { name: 'read', group: 'a-team' });
    });

    it('Should call the hasPrivilege method with the userId and a privilege with a "name", "component" and "group" field', () => {
      const MockP = new ACL(mockStorage);
      MockP.hasPrivilege = jest.fn();
      MockP.hasPrivilege.mockReturnValue(true);
      MockP.has('chris', 'read', 'login', 'a-team');
      expect(MockP.hasPrivilege).toHaveBeenLastCalledWith('chris', {
        name: 'read',
        component: 'login',
        group: 'a-team'
      });
    });


    it('Should support an array of names', () => {
      expect(() => Privileges.has('chris', [])).toThrow();
    });

    it('Should call the hasPrivilege method exactly once if the first check returns true', () => {
      const MockP = new ACL(mockStorage);
      MockP.hasPrivilege = jest.fn();
      MockP.hasPrivilege.mockReturnValue(true);
      MockP.has('chris', ['yawn', 'bite']);
      expect(MockP.hasPrivilege).toHaveBeenCalledTimes(1);
    });
    it('Should call the hasPrivilege method exactly twice if the first check returns false', () => {
      const MockP = new ACL(mockStorage);
      MockP.hasPrivilege = jest.fn();
      MockP.hasPrivilege.mockReturnValue(false);
      MockP.has('chris', ['yawn', 'bite']);
      expect(MockP.hasPrivilege).toHaveBeenCalledTimes(2);
    });

    it('Should return true if at least one check succeeds', () => {
      const MockP = new ACL(mockStorage);
      MockP.hasPrivilege = jest.fn();
      MockP.hasPrivilege.mockReturnValue(true);
      MockP.hasPrivilege.mockReturnValueOnce(false);
      MockP.has('chris', ['run', 'yawn', 'bite']);
      expect(MockP.has('chris', ['yawn', 'bite'])).toBe(true);
    });
    it('Should return false all checks fail', () => {
      const MockP = new ACL(mockStorage);
      MockP.hasPrivilege = jest.fn();
      MockP.hasPrivilege.mockReturnValue(false);
      expect(MockP.has('chris', ['yawn', 'bite'])).toBe(false);
    });
  });

  describe('# hasPrivilege(userId, {name, component, group}', () => {
    it('Should return false if the userId is falsey', () => {
      expect(Privileges.hasPrivilege()).toBe(false);
    });

    it('Should have called the validate function', () => {
      const MockP = new ACL(mockStorage);
      MockP.validate = jest.fn();
      mockStorage.getAllUserPrivileges.mockReturnValue([]);
      MockP.hasPrivilege('chris', { name: 'read' });
      expect(MockP.validate).toHaveBeenCalled();
    });

    it('Should support { name: *, component: *, group: * }', () => {
      mockStorage.getAllUserPrivileges.mockReturnValueOnce([{ name: '*', component: '*', group: '*' }]);
      expect(Privileges.hasPrivilege('chris', { name: 'read' })).toBe(true);
    });

    it('Should support { name,    component: *, group: * }', () => {
      mockStorage.getAllUserPrivileges.mockReturnValueOnce([{ name: 'read', component: '*', group: '*' }]);
      expect(Privileges.hasPrivilege('chris', { name: 'read' })).toBe(true);
    });

    it('Should support { name: *, component,    group: * }', () => {
      mockStorage.getAllUserPrivileges.mockReturnValueOnce([{ name: '*', component: 'matches', group: '*' }]);
      expect(Privileges.hasPrivilege('chris', { name: 'read', component: 'matches' })).toBe(true);
    });

    it('Should support { name: *, component: *, group    }', () => {
      mockStorage.getAllUserPrivileges.mockReturnValueOnce([{ name: '*', component: '*', group: 'a-team' }]);
      expect(Privileges.hasPrivilege('chris', { name: 'read', component: 'matches', group: 'a-team' })).toBe(true);
    });

    it('Should support { name,    component,    group: * }', () => {
      mockStorage.getAllUserPrivileges.mockReturnValueOnce([{ name: 'read', component: 'matches', group: '*' }]);
      expect(Privileges.hasPrivilege('chris', { name: 'read', component: 'matches', group: 'a-team' })).toBe(true);
    });

    it('Should support { name,    component: *, group    }', () => {
      mockStorage.getAllUserPrivileges.mockReturnValueOnce([{ name: 'read', component: '*', group: 'a-team' }]);
      expect(Privileges.hasPrivilege('chris', { name: 'read', component: 'matches', group: 'a-team' })).toBe(true);
    });
    it('Should support { name: *, component,    group    }', () => {
      mockStorage.getAllUserPrivileges.mockReturnValueOnce([{ name: '*', component: 'matches', group: 'a-team' }]);
      expect(Privileges.hasPrivilege('chris', { name: 'read', component: 'matches', group: 'a-team' })).toBe(true);
    });

    it('Should support { name,    component,    group    }', () => {
      mockStorage.getAllUserPrivileges.mockReturnValueOnce([{ name: 'read', component: 'matches', group: 'a-team' }]);
      expect(Privileges.hasPrivilege('chris', { name: 'read', component: 'matches', group: 'a-team' })).toBe(true);
    });
  });

  describe('# registerRole(name, group, privileges)', () => {
    it('Should check if the name is a non-empty string', () => {
      expect(() => Privileges.registerRole()).toThrow();
    });
    it('Should check if the optional group (when given) is a non-empty string', () => {
      expect(() => Privileges.registerRole('admin', '')).toThrow();
    });
    it('Should allow roles without privileges and groups', () => {
      mockStorage.registerRole.mockReturnValueOnce('1');
      expect(Privileges.registerRole('test')).toBe('1');
    });
    it('Should validate any given privilege', () => {
      const MockP = new ACL(mockStorage);
      MockP.validate = jest.fn();
      MockP.registerRole('test', null, { name: 'test' });
      expect(MockP.validate).toHaveBeenLastCalledWith({ name: 'test' });
    });
    it('Should return all privilege ids when an array is given', () => {
      mockStorage.registerRole.mockReturnValueOnce('1');
      mockStorage.registerRole.mockReturnValueOnce('2');
      expect(Privileges.registerRole('test', null, [{ name: 'test' }, { name: 'test-2' }])).toMatchObject(['1', '2'])
    });
  });

  describe('# assignRole(userId, role, group', () => {
    it('Should call the storage assignRole method with the right parameters', () => {
      Privileges.assignRole('chris', 'admin', 'a-team');
      expect(mockStorage.assignRole).toHaveBeenLastCalledWith('chris', 'admin', 'a-team');
    });

    it('Should default the group to be null if not given', () => {
      Privileges.assignRole('chris', 'admin');
      expect(mockStorage.assignRole).toHaveBeenLastCalledWith('chris', 'admin', null);
    });

    it('Should call the _validateNonEmptyString method for userId', () => {
      const MockP = new ACL(mockStorage);
      MockP._validateNonEmptyString = jest.fn();
      MockP.assignRole('chris', 'admin');
      expect(MockP._validateNonEmptyString).toHaveBeenCalledWith('userId', 'chris');
    });

    it('Should call the _validateNonEmptyString method for role', () => {
      const MockP = new ACL(mockStorage);
      MockP._validateNonEmptyString = jest.fn();
      MockP.assignRole('chris', 'admin');
      expect(MockP._validateNonEmptyString).toHaveBeenCalledWith('role', 'admin');
    });


    it('Should throw an error if userId is NOT a non-empty string', () => {
      expect(() => Privileges.assignRole(undefined, 'admin')).toThrow();
    });
    it('Should throw an error if the role is NOT a non-empty string', () => {
      expect(() => Privileges.assignRole('chris', undefined)).toThrow();
    });

    it('Should return the ID of the assigned role', () => {
      mockStorage.assignRole.mockReturnValueOnce('1');
      expect(Privileges.assignRole('chris', 'admin')).toBe('1');
    });

    it('Should support an array of roles and return all assigned ids', () => {
      mockStorage.assignRole.mockReturnValueOnce('1');
      mockStorage.assignRole.mockReturnValueOnce('2');
      expect(Privileges.assignRole('chris', ['reader', 'writer'])).toMatchObject(['1', '2']);
    });
  });


  describe('# is(userId, role, group)', () => {

    it('Should throw an error if the userId is NOT a non-empty string', () => {
      expect(() => Privileges.is(null)).toThrow();
    });

    it('Should throw an error if the role is NOT a non-empty string', () => {
      expect(() => Privileges.is('chris', null)).toThrow();
    });

    it('Should throw an error if the group is given, but NOT a non-empty string', () => {
      expect(() => Privileges.is('chris', 'admin', '')).toThrow();
    });

    it('Should call the _validateNonEmptyString method for userId', () => {
      const MockP = new ACL(mockStorage);
      MockP._validateNonEmptyString = jest.fn();
      MockP.is('chris', 'admin');
      expect(MockP._validateNonEmptyString).toHaveBeenCalledWith('userId', 'chris');
    });

    it('Should call the _validateNonEmptyString method for role', () => {
      const MockP = new ACL(mockStorage);
      MockP._validateNonEmptyString = jest.fn();
      MockP.is('chris', 'admin');
      expect(MockP._validateNonEmptyString).toHaveBeenCalledWith('role', 'admin');
    });

    it('Should call the _validateNonEmptyString method for group if given', () => {
      const MockP = new ACL(mockStorage);
      MockP._validateNonEmptyString = jest.fn();
      MockP.is('chris', 'admin', 'a-team');
      expect(MockP._validateNonEmptyString).toHaveBeenCalledWith('group', 'a-team', true);
    });

    it('Should treat the group parameter as optional', () => {
      expect(Privileges.is('chris', 'admin', null)).toBe(false);
    });

    it('Should default the group parameter to be null if not given', () => {
      Privileges.is('chris', 'admin');
      expect(mockStorage.getRole).toHaveBeenCalledWith('chris', 'admin', null);
    });

    it('Should return false if the role cannot be found in the storage', () => {
      mockStorage.getRole.mockReturnValueOnce(null);
      expect(Privileges.is('chris', 'writer')).toBe(false);
    });

    it('Should return true if the role was found in the storage', () => {
      mockStorage.getRole.mockReturnValueOnce({ userId: 'chris', role: 'admin', group: null });
      expect(Privileges.is('chris', 'admin')).toBe(true);
    });
  });
});