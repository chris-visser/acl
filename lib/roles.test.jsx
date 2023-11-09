const ACL = require('./privileges.js');
const mockStorage = require('../test/mocks.js');

const Privileges = ACL(mockStorage);

describe('Roles', () => {
  describe('# registerRole(name, [privileges])', () => {
    it('Should call the validate method with the right parameters', () => {
      Privileges.registerRole('admin', { name: 'read', component: '*', group: '*' });
      expect(mockStorage.registerRole).toHaveBeenLastCalledWith('admin', { name: 'read', component: '*', group: '*' });
    });
    it('Should call the storage "registerRole method" with the right parameters', () => {
      const MockP = new ACL(mockStorage);
      MockP.validate = jest.fn();
      MockP.registerRole('chris', { name: 'read' });
      expect(MockP.validate).toHaveBeenLastCalledWith({ name: 'read' });
    });
    it('Should call the storage "registerRole method" twice if an array with 2 privileges is given', () => {
      mockStorage.registerRole = jest.fn();
      Privileges.registerRole('admin', [{ name: 'read' }, { name: 'write' }]);
      expect(mockStorage.registerRole).toHaveBeenCalledTimes(2);
    });
    it('Should call the last validate method with the right parameters', () => {
      Privileges.registerRole('admin', [{ name: 'read' }, { name: 'write' }]);
      expect(mockStorage.registerRole).toHaveBeenLastCalledWith('admin', { name: 'write' });
    });
  });
  describe('# assign(userId, role)', () => {
    it('Should call the storage with the right parameters', () => {

    });
  });

  describe('# is(userId, role, group)', () => {
    it('Should throw when userId is not a string', () => {

    });

    it('Should throw when role is not a string', () => {

    });

    it('Should throw when group is not undefined nor a string', () => {

    });
  });


});