import { InMemoryPrivilegeStorage as storage } from "../lib/adapters/memory";
import { Privileges as PrivilegesInference } from "../lib/privileges";
import { Toolbox } from "../toolbox";


export const implicitIndirect = function() {
    var db;
    var Privileges;

    beforeEach(function () {
        db = new storage();
        Privileges = new PrivilegesInference(db);

        db.setUserPrivilege("fabian", {
            service: "wm",
            name: "admin",
            group: "acme"
        });

        Privileges._addValidationRule(Toolbox.simple(
            { service: "wm", name: "admin", group: "acme" },
            { service: "wm", name: "user", group: "acme" }));
        Privileges._addValidationRule(Toolbox.simple(
            { service: "wm", name: "user", group: "acme" },
            { service: "wm", name: "create-job", group: "acme" }));
    });


    it("Should return \"true\", because the given permission implies the ancestor's role", function () {
        assert.equal(Privileges.hasPrivilege("fabian", {
            service: "wm",
            name: "create-job",
            group: "acme"
        }), true);
    });

    it("Should return \"false\", because the given permission does NOT imply the ancestor's role", function () {
        assert.equal(Privileges.hasPrivilege("fabian", {
            service: "wm",
            name: "report",
            group: "acme"
        }), false);
    });

    it("Should return \"false\", because the given permission does NOT imply the ancestor's role (different user)", function () {
        assert.equal(Privileges.hasPrivilege("chris", {
            service: "wm",
            name: "create-job",
            group: "acme"
        }), false);
    });

    it("Should return \"false\", because the given permission does NOT imply the ancestor's role (different service)", function () {
        assert.equal(Privileges.hasPrivilege("fabian", {
            service: "lsa",
            name: "create-job",
            group: "acme"
        }), false);
    });

    it("Should return \"false\", because the given permission does NOT imply the ancestor's role (different group/tenant)", function () {
        assert.equal(Privileges.hasPrivilege("fabian", {
            service: "wm",
            name: "create-job",
            group: "fox"
        }), false);
    });

};