"use strict";

const lab = require("../index");
const assert = require("chai").assert;
const envcloak = require("envcloak").instance;
const envcfg = require(lab.getDevebotModule("utils/envcfg"));

describe("tdd:lib:utils:envcfg", function() {
  describe("extractEnv()", function() {
    before(function() {
      envcloak.setup({
        A_PREFIX_OF_ENVCFG_plugins_example_settings_supportContacts_phoneNumber: "+84987654321",
        A_PREFIX_OF_ENVCFG_plugins_example_settings_supportContacts_email: "contact@example.com",
        NODE_ENV: "test"
      });
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

    after(function() {
      envcloak.reset();
    });
  });
});
