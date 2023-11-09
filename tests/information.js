import { InMemoryPrivilegeStorage as storage} from "../lib/adapters/memory";
import { Privileges as PrivilegeInference } from "../lib/privileges";

export const fetchPrivilegeInfo = function () {
    var db;
    var Privileges;

    beforeEach(function () {
        db = new storage();
        Privileges = new PrivilegeInference(db);

        db.setUserPrivilege("chris", {
            service: "cdb",
            name: "notify-user",
            group: null
        });
        db.setUserPrivilege("chris", {
            service: "lsa",
            name: "enforce-stream",
            group: "fox-sports"
        });
    });

    it("Should return \"cdb\" and \"lsa\", because the user lib in both services", function () {
        const services = Privileges.getServicesForUser("chris");

        assert.deepEqual(services, ["cdb", "lsa"]);
    });

    it("Should return a empty list, because the user has no lib", function () {
        const groups = Privileges.getGroupsForUser("acme");

        assert.deepEqual(groups, []);
    });

    it("Should return fox-sports, because the user has a group privilege for service lsa", function () {
        const ServicePrivilege = Privileges.service("lsa");
        const groups = ServicePrivilege.getGroupsForUser("chris");

        assert.deepEqual(groups, ["fox-sports"]);
    });
};