
module.exports = {
  register: jest.fn(),
  exists: jest.fn(),
  filter: jest.fn(),
  getUserPrivilege: jest.fn(),
  setUserPrivilege: jest.fn(),
  getAllUserPrivileges: jest.fn(),
  removeUserPrivilege: jest.fn(),
  userHasPrivilege: jest.fn(),

  assignRole: jest.fn(),
  registerRole: jest.fn(),
  getRole: jest.fn(),

  // registerGroup: jest.fn(),
  // setGroupParent: jest.fn(),
  // getSubgroups: jest.fn(),
};