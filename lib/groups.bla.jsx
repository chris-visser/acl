const GroupsInference = require('./group.js');
const mockStorage = require('../test/mocks.js');

const Groups = new GroupsInference(mockStorage);

describe('Groups', () => {

  describe('# register(props, parentId=null)', () => {
    const group = new Group(mockStorage);
    expect()
  });

  describe('# group(groupId).umbrellas(subGroupId)', () => {

  });

  describe('# group(subGroupId).isPartOf(groupId)', () => {

  });


  // describe('# register(props)', () => {
  //   it('Should call the storage with the right parameters', () => {
  //     const group = { title: 'Awesome team', identifier: 'awesome-team', type: 'team' };
  //     Groups.register(group);
  //     expect(mockStorage.registerGroup).toHaveBeenLastCalledWith(group);
  //   });
  //   it('Should return the result of the storage registerGroup function', () => {
  //     const group = { title: 'Awesome team', identifier: 'awesome-team', type: 'team' };
  //     mockStorage.registerGroup.mockReturnValueOnce('test');
  //     expect(Groups.register(group)).toBe('test');
  //   });
  // });
  // describe('# umbrella(mainGroup, [subgroupA, subgroupB])', () => {
  //   it('Should call the storage with the right parameters', () => {
  //     Groups.get('').umbrella('main', 'sub');
  //     expect(mockStorage.setGroupParent).toHaveBeenLastCalledWith('sub', 'main');
  //   });
  //   it('Should accept an array of subgroups', () => {
  //     mockStorage.setGroupParent = jest.fn();
  //     Privileges.umbrella('main', ['sub', 'anotherSub']);
  //     expect(mockStorage.setGroupParent).toHaveBeenCalledTimes(2);
  //     expect(mockStorage.setGroupParent).toHaveBeenLastCalledWith('anotherSub', 'main');
  //   });
  // });
  //
  // describe('# grant(userId, privilege, propagate=true)', () => {
  //   it('Should grant privileges to each subgroup when propagate is true', () => {
  //     mockStorage.getSubgroups.mockReturnValueOnce(['zcfc-selectie']);
  //     Privileges.grant('chris', { name: 'read', component: 'matches', group: 'zcfc' }, true);
  //
  //     expect(mockStorage.setUserPrivilege)
  //       .toHaveBeenLastCalledWith('chris', { name: 'read', component: 'matches', group: 'zcfc-selectie' });
  //   });
  //   it('Should grant privileges to only the given group when propagate = false', () => {
  //     mockStorage.getSubgroups.mockReturnValueOnce(['zcfc-selectie']);
  //     Privileges.grant('chris', { name: 'read', component: 'matches', group: 'zcfc' }, false);
  //
  //     expect(mockStorage.setUserPrivilege)
  //       .toHaveBeenLastCalledWith('chris', { name: 'read', component: 'matches', group: 'zcfc' });
  //   });
  //   it('Should throw when propagate is true and a group is NOT given', () => {
  //     expect(() => Privileges.grant('chris', { name: 'read', component: 'matches' }, true))
  //       .toThrowError(/Cannot set propagate to true/);
  //   });
  // });
});