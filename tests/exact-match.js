import { InMemoryPrivilegeStorage as storage} from "../lib/adapters/memory";
import { Privileges as PrivilegeInference } from "../lib/privileges";

export const exactMatchTests = function () {
    var db;
    var Privileges;

    beforeEach(function () {
        db = new storage();
        Privileges = new PrivilegeInference(db);

        const privilege = {
            service: "lsa",
            name: "enforce-stream",
            group: "fox-sports"
        };

        db.set(privilege);
        db.setUserPrivilege("chris", privilege);
    });

    it("Should return \"true\", because the user has permission", function () {
        const isAllowed = Privileges.hasPrivilege("chris", {
            service: "lsa",
            name: "enforce-stream",
            group: "fox-sports"
        });

        assert.equal(isAllowed, true);
    });

    it("Should return \"false\" , because the user does NOT have the permission", function () {
        const isAllowed = Privileges.hasPrivilege("chris", {
            service: "lsa",
            name: "change-channel",
            group: "fox-sports"
        });

        assert.equal(isAllowed, false);
    });

    it("Should return \"false\" , because the user does NOT have the permission (different user)", function () {
        const isAllowed = Privileges.hasPrivilege("fabian", {
            service: "lsa",
            name: "enforce-stream",
            group: "fox-sports"
        });

        assert.equal(isAllowed, false);
    });

    it("Should return \"false\" , because the user does NOT have the permission (different service)", function () {
        const isAllowed = Privileges.hasPrivilege("fabian", {
            service: "wm",
            name: "enforce-stream",
            group: "fox-sports"
        });

        assert.equal(isAllowed, false);
    });

    it("Should return \"false\" , because the user does NOT have the permission (different group/tenant)", function () {
        const isAllowed = Privileges.hasPrivilege("fabian", {
            service: "wm",
            name: "enforce-stream",
            group: "foo-bar"
        });

        assert.equal(isAllowed, false);
    });
};