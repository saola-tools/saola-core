"use strict";

const lab = require("../index");
const FRWK = lab.getFramework();
const lodash = FRWK.require("lodash");
const envcloak = require("envcloak").instance;
const envcfg = require(lab.getFrameworkModule("utils/envcfg"));

const { assert } = require("liberica");

const constx = require(lab.getFrameworkModule("utils/constx"));
const FRAMEWORK_NAMESPACE = constx.FRAMEWORK.NAMESPACE;
const FRAMEWORK_NAMESPACE_UCASE = lodash.toUpper(FRAMEWORK_NAMESPACE);

describe("tdd:lib:utils:envcfg", function() {
  describe("extractEnv()", function() {
    before(function() {
      envcloak.setup({
        A_PREFIX_OF_ENVCFG_plugins_example_settings_supportContacts_phoneNumber: "+84987654321",
        A_PREFIX_OF_ENVCFG_plugins_example_settings_supportContacts_email: "contact@example.com",
        [FRAMEWORK_NAMESPACE_UCASE + "_NODE_ENV"]: "test",
      });
    });

    after(function() {
      envcloak.reset();
    });

    it("filters and extracts configuration values properly", function() {
      const cfgMap = envcfg.extractEnv("A_PREFIX_OF_ENVCFG_");
      false && console.info("Configuration: %s", JSON.stringify(cfgMap, null, 2));
      assert.deepEqual(cfgMap, {
        store: {
          "plugins": {
            "example": {
              "settings": {
                "supportContacts": {
                  "phoneNumber": "+84987654321",
                  "email": "contact@example.com"
                }
              }
            }
          }
        },
        paths: [
          [
            "plugins",
            "example",
            "settings",
            "supportContacts",
            "phoneNumber"
          ],
          [
            "plugins",
            "example",
            "settings",
            "supportContacts",
            "email"
          ]
        ]
      });
    });

    it("return empty result when none of environment variables satisfied the prefix", function() {
      assert.deepEqual(envcfg.extractEnv("NOT_FOUND_PREFIX_ENVCFG"), {
        store: {},
        paths: [],
      });
    });
  });
});
