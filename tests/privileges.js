import { InMemoryPrivilegeStorage as storage } from "../lib/adapters/memory";
import { Privileges as PrivilegesInference } from "../lib/privileges";


import { Meteor } from "meteor/meteor";

export const globalPrivileges = function () {
    var Privileges;
    var DB;

    beforeEach(function () {
        DB = new storage();
        Privileges = new PrivilegesInference(DB);
    });
    //
    // it("# sanitize()", function () {
    //     assert.deepEqual(Privileges.sanitize({ service: "wm", name: "admin" }), { service: "wm", name: "admin", group: null });
    //     assert.deepEqual(Privileges.sanitize({ name: "admin" }), { service: null, name: "admin", group: null });
    //     assert.deepEqual(Privileges.sanitize({ name: "admin", group: "uefa" }), { service: null, name: "admin", group: "uefa" });
    //     assert.deepEqual(Privileges.sanitize({ service: "wm", name: "admin", group: "uefa" }), { service: "wm", name: "admin", group: "uefa" });
    // });
    //
    // it("# toPrivilege()", function () {
    //     assert.deepEqual(Privileges.toPrivilege("admin"), { service: null, name: "admin", group: null });
    //     assert.deepEqual(Privileges.toPrivilege("admin", "uefa"), { service: null, name: "admin", group: "uefa" });
    // });


    it("# set() Should set a global admin privilege in the storage", function () {
        Privileges.set("admin");
        assert.equal(Privileges.exists("admin"), true);
    });

    it("# set() Should return \"true\", because the storage contains all lib from the given array", function () {
        Privileges.set(["create-job", "view-users", "remove-job"]);

        assert.equal(Privileges.exists("create-job"), true);
        assert.equal(Privileges.exists("view-users"), true);
        assert.equal(Privileges.exists("remove-job"), true);
    });

    it("# exists(name) Should return \"false\", because the storage does NOT contain a \"create\" privilege", function () {
        assert.equal(Privileges.exists("create"), false);
    });

    it("# hasPrivilege(user, name) Should return \"true\", because the global \"create-job\" privilege was granted to chris", function () {
        DB.setUserPrivilege("chris", { service: "lsa", name: "enforce-stream", group: null });

        assert.equal(Privileges.hasPrivilege("chris", { service: "lsa", name: "enforce-stream", group: null }), true);
    });

    it("# hasPrivilege(user, name) Should return \"true\", because the user is in a group and the check has a wildcard group", function () {
        DB.setUserPrivilege("chris", { service: "lsa", name: "enforce-stream", group: "foo"});

        assert.equal(Privileges.hasPrivilege("chris", { service: "lsa", name: "enforce-stream", group: "*" }), true);
    });


    it("# hasPrivilege(user, [name]) Should return \"true\", because chris has both lib", function () {
        DB.setUserPrivilege("chris", { service: "lsa", name: "create-job", group: null });
        DB.setUserPrivilege("chris", { service: "lsa", name: "enforce-stream", group: null });

        assert.equal(Privileges.hasPrivilege("chris", [
            { service: "lsa", name: "create-job", group: null },
            { service: "lsa", name: "enforce-stream", group: null }
        ]), true);
    });

    it("# hasPrivilege(user, [name]) Should return \"true\", because chris has one of the lib", function () {
        DB.setUserPrivilege("chris", { service: "lsa", name: "enforce-stream", group: null });

        assert.equal(Privileges.hasPrivilege("chris", [
            { service: "lsa", name: "create-job", group: null },
            { service: "lsa", name: "enforce-stream", group: null }
        ]), true);
    });

    it("# hasPrivilege(user, [name]) Should return \"false\", because chris has none of the lib", function () {
        DB.setUserPrivilege("chris", { service: "lsa", name: "create-job", group: null });
        DB.setUserPrivilege("chris", { service: "lsa", name: "enforce-stream", group: null });

        assert.equal(Privileges.hasPrivilege("chris", [
            { service: "cdb", name: "create-job", group: null },
            { service: "lsa", name: "bar", group: null }
        ]), false);
    });

    it("# grant(user, name) Should return \"true\", because the global \"create-job\" privilege was granted to chris", function () {
        Privileges.grant("chris", "create-job");
        assert.equal(Privileges.hasPrivilege("chris", { service: null, name: "create-job", group: null }), true);
    });

    it("# grant(name, privilege) Should return \"false\", because the global \"upload-file\" privilege was NOT granted to chris", function () {
        Privileges.grant("chris", "enforce-stream");
        assert.equal(Privileges.hasPrivilege("chris", { service: null, name: "upload-file", group: null }), false);
    });

    it("# can(name) Should return \"true\", because chris was granted the \"create-job\" privilege", function () {
        Privileges.grant("chris", "create-job");
        assert.equal(Privileges.can("chris", "create-job"), true);
    });

    it("# can(name) Should return \"false\", because chris was NOT granted the \"upload-file\" privilege", function () {
        assert.equal(Privileges.can("chris", "upload-file"), false);
    });

    it("# can(name, group) Should return \"true\", because chris was granted \"enforce\" in group acme", function () {
        Privileges.grant("chris", "enforce", "acme");
        assert.equal(Privileges.can("chris", "enforce", "acme"), true);
    });

    it("# can(name, group) Should return \"false\", because chris was granted \"enforce\" in a different group", function () {
        Privileges.grant("chris", "enforce", "acme");
        assert.equal(Privileges.can("chris", "enforce", "acme2"), false);
    });
};

export const serviceScopedPrivileges = function () {
    var Privileges;

    beforeEach(function () {
        Privileges = new PrivilegesInference(new storage());
    });

    it("# toPrivilege(name) Should create a privilege object containing the given service and name", function () {
        const ServicePrivileges = Privileges.service("wm");
        assert.deepEqual(ServicePrivileges.toPrivilege("admin"), { service: "wm", name: "admin", group: null });
    });

    it("# toPrivilege(name, group) Should create a privilege object containing the given service, name and group", function () {
        const ServicePrivileges = Privileges.service("wm");
        assert.deepEqual(ServicePrivileges.toPrivilege("admin", "uefa"), { service: "wm", name: "admin", group: "uefa" });
    });


    it("# service(service) Should by default create a privilege with \"wm\" as service", function () {
        const ServicePrivileges = Privileges.service("wm");

        assert.deepEqual(ServicePrivileges.toPrivilege("admin"), { service: "wm", name: "admin", group: null });
        assert.deepEqual(ServicePrivileges.toPrivilege("admin", "uefa"), { service: "wm", name: "admin", group: "uefa" });
    });

    it("# exists(name). Should return \"true\", because the storage contains a \"create-job\" privilege for wm", function () {
        const ServicePrivileges = Privileges.service("wm");

        ServicePrivileges.set("create-job");
        assert.equal(ServicePrivileges.exists("create-job"), true);
    });

    it("# exists(name). Should return \"false\", because the check was done with the globally scoped lib", function () {
        const ServicePrivileges = Privileges.service("wm");

        ServicePrivileges.set("create-job");
        assert.equal(Privileges.exists("create-job"), false);
    });

    it("# can(user, name) Should return \"true\", because chris was granted the \"create-job\" privilege for service wm", function () {
        const ServicePrivileges = Privileges.service("wm");
        ServicePrivileges.grant("chris", "create-job");

        assert.equal(ServicePrivileges.can("chris", "create-job"), true);
    });

    it("# can(user, name) Should return \"false\", because chris was NOT granted the \"upload-file\" privilege for service wm", function () {
        const ServicePrivileges = Privileges.service("wm");
        ServicePrivileges.grant("chris", "create-job");

        assert.equal(ServicePrivileges.can("chris", "upload-file"), false);
    });

    it("# can(user, name) Should return \"false\", because chris was NOT granted the \"create-job\" privilege on the global scope", function () {
        const ServicePrivileges = Privileges.service("wm");
        ServicePrivileges.grant("chris", "create-job");

        assert.equal(Privileges.can("chris", "create-job"), false);
    });

    it("# can(user, name, group) Should return \"true\", because chris was granted the \"create-job\" privilege for service wm in the group", function () {
        const ServicePrivileges = Privileges.service("wm");
        ServicePrivileges.grant("chris", "create-job", "acme");

        assert.equal(ServicePrivileges.can("chris", "create-job", "acme"), true);
    });

    it("# can(user, name, group) Should return \"false\", because chris was NOT granted the \"upload-file\" privilege for service wm in the group", function () {
        const ServicePrivileges = Privileges.service("wm");
        ServicePrivileges.grant("chris", "create-job", "acme");

        assert.equal(ServicePrivileges.can("chris", "upload-file", "acme"), false);
    });

    it("# can(user, name, group) Should return \"false\", because chris was NOT granted the \"create-job\" privilege on the global scope for that group", function () {
        const ServicePrivileges = Privileges.service("wm");
        ServicePrivileges.grant("chris", "create-job", "acme");

        assert.equal(Privileges.can("chris", "create-job", "acme"), false);
    });
};

export const hierarchicPrivileges = function () {
    var Privileges;

    beforeEach(function () {
        Privileges = new PrivilegesInference(new storage());
    });

    it("# can(user, name) Checking against a group privilege should allow a person with a global privilege of the same name", function () {
        Privileges.grant("chris", "admin");
        assert.equal(Privileges.can("chris", "admin", "acme"), true);
    });

    it("# can(user, name) Checking against a group privilege should NOT allow a person with a global privilege of a different name", function () {
        Privileges.grant("chris", "admin");
        assert.equal(Privileges.can("chris", "tenant", "acme"), false);
    });

    it("# can(user, name) Checking against a service privilege should allow a person with a global privilege of the same name", function () {
        Privileges.grant("chris", "admin");
        const ServicePrivileges = Privileges.service("wm");
        assert.equal(ServicePrivileges.can("chris", "admin"), true);
    });

    it("# can(user, name) Checking against a service privilege should NOT allow a person with a global privilege of a different name", function () {
        Privileges.grant("chris", "admin");
        const ServicePrivileges = Privileges.service("wm");
        assert.equal(ServicePrivileges.can("chris", "hello"), false);
    });

    it("# can(user, name) Checking against a group privilege in a service should allow a person with a global privilege of the same name", function () {
        Privileges.grant("chris", "admin");
        const ServicePrivileges = Privileges.service("wm");
        assert.equal(ServicePrivileges.can("chris", "admin", "acme"), true);
        assert.equal(ServicePrivileges.can("chris", "admin", "fox"), true);
    });

    it("# can(user, name) Checking against a group privilege in a service should NOT allow a person with a global privilege of a different name", function () {
        Privileges.grant("chris", "admin");
        const ServicePrivileges = Privileges.service("wm");
        assert.equal(ServicePrivileges.can("chris", "tenant", "acme"), false);
    });

    it("# can(user, name) Checking against a group privilege in a service should allow a person with a service privilege of the same name", function () {
        const ServicePrivileges = Privileges.service("wm");
        ServicePrivileges.grant("chris", "admin");
        assert.equal(ServicePrivileges.can("chris", "admin", "acme"), true);
    });

    it("# can(user, name) Checking against a group privilege in a service should NOT allow a person with a different service", function () {
        const WmPrivileges = Privileges.service("wm");
        const LsaPrivileges = Privileges.service("lsa");
        LsaPrivileges.grant("chris", "admin");
        assert.equal(WmPrivileges.can("chris", "admin", "acme"), false);
    });
};