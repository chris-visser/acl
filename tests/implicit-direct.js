import { InMemoryPrivilegeStorage as storage } from "../lib/adapters/memory";
import { Privileges as PrivilegesInference } from "../lib/privileges";
import { Toolbox } from "../toolbox";

export const implicitDirect = function() {

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

        const admin = { service: "wm", name: "admin", group: "acme" };
        const create = { service: "wm", name: "create-job", group: "acme" };

        Privileges._addValidationRule(Toolbox.simple(admin, create));
    });

    it("Should return \"true\", because the given permission implies the parent role", function () {

        assert.equal(Privileges.hasPrivilege("fabian", {
            service: "wm",
            name: "create-job",
            group: "acme"
        }), true);
    });

    it("Should return \"false\", because the given permission does NOT imply the parent role", function () {
        assert.equal(Privileges.hasPrivilege("fabian", {
            service: "lsa",
            name: "report",
            group: "acme"
        }), false);
    });

    it("Should return \"false\", because the given permission does NOT imply the parent role (different user)", function () {
        assert.equal(Privileges.hasPrivilege("someone else", {
            service: "wm",
            name: "create-job",
            group: "acme"
        }), false);
    });

    it("Should return \"false\", because the given permission does NOT imply the parent role (different service)", function () {
        assert.equal(Privileges.hasPrivilege("fabian", {
            service: "lsa",
            name: "create-job",
            group: "acme"
        }), false);
    });

    it("Should return \"false\", because the given permission does NOT imply the parent role (different group/tenant)", function () {
        assert.equal(Privileges.hasPrivilege("fabian", {
            service: "wm",
            name: "create-job",
            group: "fox"
        }), false);
    });

};