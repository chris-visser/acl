import { InMemoryPrivilegeStorage as storage } from "../lib/adapters/memory";
import { Privileges as PrivilegesInference } from "../lib/privileges";

export const dependent = function () {

    var db;
    var Privileges;

    beforeEach(function () {
        db = new storage();
        Privileges = new PrivilegesInference(db);

        db.setUserPrivilege("user_a", { name: "role_a" });
        db.setUserPrivilege("user_b", { name: "role_b" });
        db.setUserPrivilege("fabian", { name: "role_a" });
        db.setUserPrivilege("fabian", { name: "role_b" });
        db.setUserPrivilege("lucas", { name: "role_c" });
        db.setUserPrivilege("flappie", [{ name: "role_a" } , { name: "role_c" }]);
        db.setUserPrivilege("chris", [{ name: "role_a" }, { name: "role_b" }, { name: "role_c" }]);

        /* role_c requires both role_a and role_b */
        Privileges._addValidationRule(wanted => {
            if (wanted.name === "role_c") {
                return [{ name: "role_a" }, { name: "role_b" }];
            }
            return false;
        });
    });

    it("Should return \"true\", because the user has role_a & role_b", function () {
        assert.equal(Privileges.hasPrivilege("fabian", { name: "role_c"}), true);
    });

    it("Should return \"false\", because the user does NOT have role_b", function () {
        assert.equal(Privileges.hasPrivilege("user_a", { name: "role_c"}), false);
    });

    it("Should return \"false\", because the user does NOT have role_a", function () {
        assert.equal(Privileges.hasPrivilege("user_b", { name: "role_c"}), false);
    });

    it("Should return \"false\", because the user does NOT exist", function () {
        assert.equal(Privileges.hasPrivilege("unknown_user", { name: "role_c"}), false);
    });

    it("Should return \"false\", because although the user has role_c, it should also have role_a & role_b", function () {
        assert.equal(Privileges.hasPrivilege("lucas", { name: "role_c"}), true);
    });

    it("Should return \"true\", because besides role_c, the user also has role_a & role_b", function () {
        assert.equal(Privileges.hasPrivilege("chris", { name: "role_c"}), true);
    });

    it("Should return \"true\", because user has role_c", function () {
        assert.equal(Privileges.hasPrivilege("flappie", { name: "role_c"}), true);
    });
};