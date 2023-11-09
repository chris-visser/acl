import { inMemoryStorageTests } from "../test/memory-storage";
import { meteorStorageTests } from "../test/minimongo-storage";

import {
    globalPrivileges,
    serviceScopedPrivileges,
    hierarchicPrivileges
} from "./privileges";

import {fetchPrivilegeInfo} from "./information";

describe("Privileges", function () {
    describe("Global lib", globalPrivileges);
    describe("Service scoped lib", serviceScopedPrivileges);
    describe("Hierarchic lib", hierarchicPrivileges);
    describe("Privilege information", fetchPrivilegeInfo);
});

describe("Storage", function () {
    describe("In Memory adapter", inMemoryStorageTests);
    describe("Meteor adapter", meteorStorageTests);
});