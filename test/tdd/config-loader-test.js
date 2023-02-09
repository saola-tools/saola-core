"use strict";

const lab = require("../index");
const FRWK = lab.getFramework();
const chores = FRWK.require("chores");
const lodash = FRWK.require("lodash");
const loader = FRWK.require("loader");
const path = require("path");
const ConfigLoader = require(lab.getFrameworkModule("backbone/config-loader"));
const NameResolver = require(lab.getFrameworkModule("backbone/name-resolver"));
const ManifestHandler = require(lab.getFrameworkModule("backbone/manifest-handler"));
const Envcloak = require("envcloak");
const envcloak = Envcloak.instance;

const { assert, sinon } = require("liberica");

const constx = require(lab.getFrameworkModule("utils/constx"));
const FRAMEWORK_NAMESPACE = constx.FRAMEWORK.NAMESPACE;
const FRAMEWORK_NAMESPACE_UCASE = lodash.toUpper(FRAMEWORK_NAMESPACE);
const FRAMEWORK_PACKAGE_NAME = constx.FRAMEWORK.PACKAGE_NAME;

describe("tdd:lib:core:config-loader", function() {
  let issueInspector = lab.getIssueInspector();
  let stateInspector = lab.getStateInspector();
  let loggingFactory = lab.createLoggingFactoryMock();

  let CTX = {
    L: loggingFactory.getLogger(),
    T: loggingFactory.getTracer(),
    issueInspector: issueInspector,
  };

  let appRef = {
    name: "tdd-cfg",
    type: "application",
    path: lab.getAppHome("tdd-cfg")
  };

  let frameworkRef = {
    name: FRAMEWORK_PACKAGE_NAME,
    type: "framework",
    path: lab.getFrameworkHome()
  };

  let pluginRefs = {
    "plugin1": {
      name: "plugin1",
      type: "plugin",
      path: lab.getLibHome("plugin1")
    },
    "plugin2": {
      name: "plugin2",
      type: "plugin",
      path: lab.getLibHome("plugin2")
    }
  };

  let bridgeRefs = {};

  let nameResolver = new NameResolver({
    issueInspector,
    bridgeList: lodash.values(bridgeRefs),
    pluginList: lodash.values(pluginRefs),
  });

  let manifestHandler = new ManifestHandler({
    issueInspector,
    bridgeList: lodash.values(bridgeRefs),
    bundleList: lodash.concat(appRef, lodash.values(pluginRefs), frameworkRef),
    nameResolver,
  });

  let stepEnv = new Envcloak();

  describe("readVariable(): read environment variables", function() {
    let ConfigLoader = lab.acquireFrameworkModule("backbone/config-loader");
    let readVariable = ConfigLoader.__get__("readVariable");
    assert.isFunction(readVariable);

    beforeEach(function() {
      stepEnv.reset();
      chores.clearCache();
    });

    it("should return undefined if the associated environment variables not found", function() {
      assert.isUndefined(readVariable(CTX, "EXAMPLE_APP", "CONFIG_DIR"));
    });

    it("should extract value from the first environment variable", function() {
      stepEnv.setup({
        "EXAMPLE_APP_CONFIG_DIR": "val#1",
        [FRAMEWORK_NAMESPACE_UCASE + "_CONFIG_DIR"]: "val#2",
        "NODE_EXAMPLE_APP_CONFIG_DIR": "val#3",
        ["NODE_" + FRAMEWORK_NAMESPACE_UCASE + "_CONFIG_DIR"]: "val#4",
      });
      assert.equal(readVariable(CTX, "EXAMPLE_APP", "CONFIG_DIR"), "val#1");
    });

    it("should extract value from the second environment variable", function() {
      stepEnv.setup({
        [FRAMEWORK_NAMESPACE_UCASE + "_CONFIG_DIR"]: "val#2",
        "NODE_EXAMPLE_APP_CONFIG_DIR": "val#3",
        ["NODE_" + FRAMEWORK_NAMESPACE_UCASE + "_CONFIG_DIR"]: "val#4",
      });
      assert.equal(readVariable(CTX, "EXAMPLE_APP", "CONFIG_DIR"), "val#2");
    });

    it("should extract value from the third environment variable", function() {
      stepEnv.setup({
        "NODE_EXAMPLE_APP_CONFIG_DIR": "val#3",
        ["NODE_" + FRAMEWORK_NAMESPACE_UCASE + "_CONFIG_DIR"]: "val#4",
      });
      assert.equal(readVariable(CTX, "EXAMPLE_APP", "CONFIG_DIR"), "val#3");
    });

    it("should extract value from the fourth environment variable", function() {
      stepEnv.setup({
        ["NODE_" + FRAMEWORK_NAMESPACE_UCASE + "_CONFIG_DIR"]: "val#4",
      });
      assert.equal(readVariable(CTX, "EXAMPLE_APP", "CONFIG_DIR"), "val#4");
    });

    after(function() {
      stepEnv.reset();
      chores.clearCache();
    });
  });

  describe("extractEnvironConfig(): extract the configuration from the environment variables", function() {
    let ConfigLoader = lab.acquireFrameworkModule("backbone/config-loader");
    let extractEnvironConfig = ConfigLoader.__get__("extractEnvironConfig");

    it("support both default and customized prefixes", function() {
      envcloak.setup({
        NODE_ENV: "test",
        LOGOLITE_FULL_LOG_MODE: "false",
        EXAMPLE_CONFIG_VAL_sandbox_plugins_appDemoPlugin_settings_email: "contact@example.com",
        [FRAMEWORK_NAMESPACE_UCASE + "_CONFIG_VAL_sandbox_plugins_appDemoPlugin_settings_phoneNumber"]: "+84987654321",
        [FRAMEWORK_NAMESPACE_UCASE + "_CONFIG_ENV"]: "dev"
      });

      let { store, paths } = extractEnvironConfig(CTX, "EXAMPLE");
      false && console.info(JSON.stringify(store, null, 2));
      assert.deepInclude(store, {
        "sandbox": {
          "plugins": {
            "appDemoPlugin": {
              "settings": {
                "email": "contact@example.com",
                "phoneNumber": "+84987654321"
              }
            }
          }
        }
      });

      envcloak.reset();
    });
  });

  describe("fillConfigByEnvVars(): load the configuration from the environment variables", function() {
    let ConfigLoader = lab.acquireFrameworkModule("backbone/config-loader");
    let fillConfigByEnvVars = ConfigLoader.__get__("fillConfigByEnvVars");

    it("support both default and customized prefixes", function() {
      envcloak.setup({
        LOGOLITE_FULL_LOG_MODE: "false",
        MY_DEMO_CONFIG_VAL_sandbox_plugins_appDemoPlugin_settings_enabled: "true",
        MY_DEMO_CONFIG_VAL_sandbox_plugins_appDemoPlugin_settings_timeout: 102400,
        MY_DEMO_CONFIG_VAL_sandbox_plugins_appDemoPlugin_settings_rate: 3.14190,
        MY_DEMO_CONFIG_VAL_sandbox_plugins_appDemoPlugin_settings_email: "contact@example.com",
        [FRAMEWORK_NAMESPACE_UCASE + "_CONFIG_VAL_sandbox_plugins_appDemoPlugin_settings_phoneNumber"]: "+84987654321",
        [FRAMEWORK_NAMESPACE_UCASE + "_CONFIG_ENV"]: "dev",
        [FRAMEWORK_NAMESPACE_UCASE + "_NODE_ENV"]: "test",
      });

      let environCfg = {
        "sandbox": {
          "mixture": {
            "plugins": {
              "appDemoPlugin": {
                "settings": {
                  "enabled": false,
                  "email": "noreply@example.com",
                  "address": "No. 123, WestLake street",
                  "timeout": 0,
                  "rate": 0.0,
                  "note": null
                }
              }
            }
          }
        }
      };
      fillConfigByEnvVars(CTX, environCfg, "my-demo");
      false && console.info(JSON.stringify(environCfg, null, 2));
      assert.deepInclude(environCfg, {
        "profile": {},
        "sandbox": {
          "environ": {
            "plugins": {
              "appDemoPlugin": {
                "settings": {
                  "enabled": true,
                  "email": "contact@example.com",
                  "timeout": 102400,
                  "rate": 3.1419
                }
              }
            }
          },
          "mixture": {
            "plugins": {
              "appDemoPlugin": {
                "settings": {
                  "enabled": true,
                  "address": "No. 123, WestLake street",
                  "email": "contact@example.com",
                  "timeout": 102400,
                  "rate": 3.1419,
                  "note": null
                }
              }
            }
          }
        },
        "texture": {}
      });

      envcloak.reset();
    });
  });

  describe("transformConfig(): standardizing loaded configuration data", function() {
    let NameResolver = lab.acquireFrameworkModule("backbone/name-resolver");
    let extractAliasNames = NameResolver.__get__("extractAliasNames");
    let buildAbsoluteAliasMap = NameResolver.__get__("buildAbsoluteAliasMap");
    let buildRelativeAliasMap = NameResolver.__get__("buildRelativeAliasMap");
    let ConfigLoader = lab.acquireFrameworkModule("backbone/config-loader");
    let applyAliasMap = ConfigLoader.__get__("applyAliasMap");
    let doAliasMap = ConfigLoader.__get__("doAliasMap");
    let transformConfig = ConfigLoader.__get__("transformConfig");

    it("[profile] should rename the core config field name to 'framework'", function() {
      if (!chores.isUpgradeSupported(["profile-config-field-framework"])) this.skip();
      //
      const appRef = new Object();
      //
      const originalCfg = {
        "devebot": {
          "verbose": true,
          "jobqueue": {
            "enabled": true
          }
        }
      };
      //
      const expectedCfg = {
        "framework": {
          "verbose": true,
          "jobqueue": {
            "enabled": true
          }
        }
      };
      //
      let convertedCfg = transformConfig(CTX, "profile", originalCfg, appRef);
      //
      false && console.info(JSON.stringify(convertedCfg, null, 2));
      assert.deepInclude(convertedCfg, expectedCfg);
    });

    it("[sandbox] should transform relative names into default full names", function() {
      if (!chores.isUpgradeSupported(["bridge-full-ref", "standardizing-config"])) this.skip();

      let originalCfg = {
        "bridges": {
          "bridgeKebabCase1": {
            "wrapper1": {
              "pointer": {
                "refPath": "sandbox -> bridge-kebab-case1 -> wrapper1 -> pointer"
              }
            }
          },
          "bridgeKebabCase2": {
            [FRAMEWORK_NAMESPACE + "-dp-wrapper1"]: {
              "pointer": {
                "refPath": "sandbox -> bridge-kebab-case2 -> wrapper1 -> pointer"
              }
            }
          },
          "connector1": {
            "wrapper1": {
              "bean": {
                "refPath": "sandbox -> connector1 -> wrapper1 -> bean"
              }
            }
          },
          "connector2": {
            [FRAMEWORK_NAMESPACE + "-dp-wrapper1"]: {
              "bean": {
                "refPath": "sandbox -> connector2 -> wrapper1 -> bean"
              }
            }
          }
        }
      };

      let expectedCfg = {
        "bridges": {
          "bridge-kebab-case1": {
            [FRAMEWORK_NAMESPACE + "-dp-wrapper1"]: {
              "pointer": {
                "refPath": "sandbox -> bridge-kebab-case1 -> wrapper1 -> pointer"
              }
            }
          },
          "bridge-kebab-case2": {
            [FRAMEWORK_NAMESPACE + "-dp-wrapper1"]: {
              "pointer": {
                "refPath": "sandbox -> bridge-kebab-case2 -> wrapper1 -> pointer"
              }
            }
          },
          [FRAMEWORK_NAMESPACE + "-co-connector1"]: {
            [FRAMEWORK_NAMESPACE + "-dp-wrapper1"]: {
              "bean": {
                "refPath": "sandbox -> connector1 -> wrapper1 -> bean"
              }
            }
          },
          [FRAMEWORK_NAMESPACE + "-co-connector2"]: {
            [FRAMEWORK_NAMESPACE + "-dp-wrapper1"]: {
              "bean": {
                "refPath": "sandbox -> connector2 -> wrapper1 -> bean"
              }
            }
          }
        }
      };

      let absoluteAliasMap = {
        plugin: buildAbsoluteAliasMap(extractAliasNames(CTX, "plugin", {
          "path/to/namespace-dp-wrapper1": {
            name: FRAMEWORK_NAMESPACE + "-dp-wrapper1"
          },
          "path/to/namespace-dp-wrapper2": {
            name: FRAMEWORK_NAMESPACE + "-dp-wrapper2"
          }
        })),
        bridge: buildAbsoluteAliasMap(extractAliasNames(CTX, "bridge", {
          "path/to/bridge-kebab-case1": {
            name: "bridge-kebab-case1"
          },
          "path/to/bridge-kebab-case2": {
            name: "bridge-kebab-case2"
          },
          "path/to/namespace-co-connector1": {
            name: FRAMEWORK_NAMESPACE + "-co-connector1"
          },
          "path/to/namespace-co-connector2": {
            name: FRAMEWORK_NAMESPACE + "-co-connector2"
          }
        })),
      };
      let convertedCfg = transformConfig(
        lodash.assign({
          nameResolver: {
            getAbsoluteAliasMap: function() {
              return absoluteAliasMap;
            },
            getOriginalNameOf: function (name, type) {
              return absoluteAliasMap[type][name] || name;
            }
          }
        }, CTX),
        "sandbox",
        originalCfg,
        { type: "plugin", name: "cfg-example", presets: {} }
      );

      false && console.info(JSON.stringify(convertedCfg, null, 2));
      assert.deepInclude(convertedCfg, expectedCfg);
    });

    it("[sandbox] should transform absolute names into relative names", function() {
      if (!chores.isUpgradeSupported(["bridge-full-ref", "standardizing-config"])) this.skip();

      let originalCfg = {
        "bridges": {
          "bridgeKebabCase1": {
            "wrapper1": {
              "pointer": {
                "refPath": "sandbox -> bridge-kebab-case1 -> wrapper1 -> pointer"
              }
            }
          },
          "bridge-kebab-case2": {
            [FRAMEWORK_NAMESPACE + "-dp-wrapper1"]: {
              "pointer": {
                "refPath": "sandbox -> bridge-kebab-case2 -> wrapper1 -> pointer"
              }
            }
          },
          "connector1": {
            "wrapper1": {
              "bean": {
                "refPath": "sandbox -> connector1 -> wrapper1 -> bean"
              }
            }
          },
          "connector2": {
            [FRAMEWORK_NAMESPACE + "-dp-wrapper1"]: {
              "bean": {
                "refPath": "sandbox -> connector2 -> wrapper1 -> bean"
              }
            }
          }
        }
      };

      let expectedCfg = {
        "bridges": {
          "bridgeKebabCase1": {
            "wrapper1": {
              "pointer": {
                "refPath": "sandbox -> bridge-kebab-case1 -> wrapper1 -> pointer"
              }
            }
          },
          "bridgeKebabCase2": {
            "wrapper1": {
              "pointer": {
                "refPath": "sandbox -> bridge-kebab-case2 -> wrapper1 -> pointer"
              }
            }
          },
          "connector1": {
            "wrapper1": {
              "bean": {
                "refPath": "sandbox -> connector1 -> wrapper1 -> bean"
              }
            }
          },
          "connector2": {
            "wrapper1": {
              "bean": {
                "refPath": "sandbox -> connector2 -> wrapper1 -> bean"
              }
            }
          }
        }
      };

      let pluginRefs = extractAliasNames(CTX, "plugin", {
        "path/to/namespace-dp-wrapper1": {
          name: FRAMEWORK_NAMESPACE + "-dp-wrapper1"
        },
        "path/to/namespace-dp-wrapper2": {
          name: FRAMEWORK_NAMESPACE + "-dp-wrapper2"
        }
      });

      let bridgeRefs = extractAliasNames(CTX, "bridge", {
        "path/to/bridge-kebab-case1": {
          name: "bridge-kebab-case1"
        },
        "path/to/bridge-kebab-case2": {
          name: "bridge-kebab-case2"
        },
        "path/to/namespace-co-connector1": {
          name: FRAMEWORK_NAMESPACE + "-co-connector1"
        },
        "path/to/namespace-co-connector2": {
          name: FRAMEWORK_NAMESPACE + "-co-connector2"
        }
      });

      let absoluteAliasMap = {
        plugin: buildAbsoluteAliasMap(pluginRefs),
        bridge: buildAbsoluteAliasMap(bridgeRefs),
      };
      let absoluteCfg = transformConfig(
        lodash.assign({
          nameResolver: {
            getAbsoluteAliasMap: function() {
              return absoluteAliasMap;
            },
            getOriginalNameOf: function (name, type) {
              return absoluteAliasMap[type][name] || name;
            }
          }
        }, CTX),
        "sandbox",
        originalCfg,
        { type: "plugin", name: "cfg-example", presets: {} }
      );

      false && console.log(JSON.stringify(absoluteCfg, null, 2));

      let relativeAliasMap = {
        plugin: buildRelativeAliasMap(pluginRefs),
        bridge: buildRelativeAliasMap(bridgeRefs),
      };
      let relativeCfg = null;
      if (doAliasMap) {
        relativeCfg = doAliasMap(CTX, absoluteCfg, relativeAliasMap.plugin, relativeAliasMap.bridge);
      } else {
        relativeCfg = applyAliasMap(CTX, absoluteCfg, function(name, type) {
          return relativeAliasMap[type][name];
        });
      }

      false && console.info(JSON.stringify(relativeCfg, null, 2));
      assert.deepInclude(relativeCfg, expectedCfg);
    });
  });

  describe("extractConfigManifest()", function() {
    let ConfigLoader = lab.acquireFrameworkModule("backbone/config-loader");
    let extractConfigManifest = ConfigLoader.__get__("extractConfigManifest");
    let nameResolver = lab.getNameResolver(["sub-plugin1", "sub-plugin2"], ["sub-bridge1", "sub-bridge2", FRAMEWORK_NAMESPACE + "-co-vps"]);
    let ctx = { nameResolver: nameResolver };

    it("return empty configManifest map if the moduleRef is empty or null", function() {
      assert.deepEqual(extractConfigManifest(ctx, null), {});
      assert.deepEqual(extractConfigManifest(ctx, {}), {});
    });

    it("return the correct configManifest with normal bridgeRefs", function() {
      let bridgeRefs = {
        "/test/lib/sub-bridge1": {
          "name": "sub-bridge1",
          "type": "bridge",
          "path": "/test/lib/sub-bridge1",
          "version": "0.1.1",
          "manifest": {
            "config": {
              "something": "sub-bridge1"
            }
          },
        },
        "/test/lib/sub-bridge2": {
          "name": "sub-bridge2",
          "type": "bridge",
          "path": "/test/lib/sub-bridge2",
          "version": "0.1.2",
          "manifest": {
            "config": {
              "something": "sub-bridge2"
            }
          },
        },
        "/test/lib/namespace-co-vps": {
          "name": FRAMEWORK_NAMESPACE + "-co-vps",
          "type": "bridge",
          "path": "/test/lib/namespace-co-vps",
          "version": "0.1.3",
          "manifest": {
            "config": {
              "something": FRAMEWORK_NAMESPACE + "-co-vps"
            }
          },
        }
      };
      let expected = {
        "sub-bridge1": {
          "version": "0.1.1",
          "manifest": {
            "config": {
              "something": "sub-bridge1"
            }
          },
        },
        "sub-bridge2": {
          "version": "0.1.2",
          "manifest": {
            "config": {
              "something": "sub-bridge2"
            }
          },
        },
        [FRAMEWORK_NAMESPACE + "-co-vps"]: {
          "version": "0.1.3",
          "manifest": {
            "config": {
              "something": FRAMEWORK_NAMESPACE + "-co-vps"
            }
          },
        },
      };
      assert.deepEqual(extractConfigManifest(ctx, bridgeRefs), expected);
    });

    it("return the correct configManifest with normal pluginRefs", function() {
      let pluginRefs = {
        "/test/app/default": {
          "name": "fullapp",
          "type": "application",
          "path": "/test/app/default",
          "presets": {
            "privateProfile": "abc",
            "privateSandbox": "xyz",
          },
          "bridgeDepends": [ "bridge1", "bridge2" ],
          "pluginDepends": [ "sub-plugin1", "sub-plugin2" ],
          "version": "0.1.0",
          "manifest": {
            "config": {
              "something": "application",
            },
          },
        },
        "/test/lib/sub-plugin1": {
          "name": "sub-plugin1",
          "type": "plugin",
          "path": "/test/lib/sub-plugin1",
          "presets": {
            "configTags": "bridge[dialect-bridge]"
          },
          "bridgeDepends": [ "bridge1", "bridge2" ],
          "pluginDepends": [],
          "version": "0.1.1",
          "manifest": {
            "config": {
              "something": "sub-plugin1"
            }
          },
        },
        "/test/lib/sub-plugin2": {
          "name": "sub-plugin2",
          "type": "plugin",
          "path": "/test/lib/sub-plugin2",
          "presets": {
            "configTags": "bridge[dialect-bridge]"
          },
          "bridgeDepends": [ "bridge1", "bridge2" ],
          "pluginDepends": [],
          "version": "0.1.2",
          "manifest": {
            "config": {
              "something": "sub-plugin2"
            }
          },
        },
        "/": {
          "name": "devebot",
          "type": "framework",
          "path": "/",
          "version": "0.2.9",
          "manifest": {
            "config": {
              "something": "namespace"
            },
          },
        }
      };
      let expected = {
        "application": {
          "version": "0.1.0",
          "manifest": {
            "config": {
              "something": "application",
            },
          },
        },
        "sub-plugin1": {
          "version": "0.1.1",
          "manifest": {
            "config": {
              "something": "sub-plugin1"
            }
          },
        },
        "sub-plugin2": {
          "version": "0.1.2",
          "manifest": {
            "config": {
              "something": "sub-plugin2"
            }
          },
        },
        "devebot": {
          "version": "0.2.9",
          "manifest": {
            "config": {
              "something": "namespace"
            },
          },
        },
      };
      assert.deepEqual(extractConfigManifest(ctx, pluginRefs), expected);
    });
  });

  describe("applyManifestMigration() - for sandbox only", function() {
    let ConfigLoader = lab.acquireFrameworkModule("backbone/config-loader");
    let applyManifestMigration = ConfigLoader.__get__("applyManifestMigration");
    let nameResolver = lab.getNameResolver(["sub-plugin1", "sub-plugin2", "sub-plugin3"], []);
    let loggingFactory = lab.createLoggingFactoryMock();
    let L = loggingFactory.getLogger();
    let T = loggingFactory.getTracer();
    let ctx = { L, T, nameResolver };

    beforeEach(function() {
      loggingFactory.resetHistory();
    });

    it("at most only one migration rule will be applied", function() {
      const configStore = {
        "plugins": {
          "subPlugin1": {
            "host": "localhost",
            "port": 17721,
            "__manifest__": {
              "version": "1.2.9",
              "note": "extended fields are reserved",
            },
          },
          "subPlugin2": {
            "host": "localhost",
            "port": 17722,
            "__manifest__": {
              "version": "1.3.1",
              "note": "extended fields are reserved",
            },
          },
          "subPlugin3": {
            "host": "localhost",
            "port": 17723,
            "__manifest__": {
              "version": "1.4.5",
              "note": "extended fields are reserved",
            },
          },
        },
      };
      const moduleVersion = "1.7.0";
      const transform = new Array(4);
      transform[0] = sinon.stub();
      transform[1] = sinon.stub().callsFake(function(cfg) { return { "matched1": cfg }; });
      transform[2] = sinon.stub().callsFake(function(cfg) { return { "matched2": cfg }; });
      transform[3] = sinon.stub().callsFake(function(cfg) { return { "matched3": cfg }; });
      const manifest = {
        "migration": {
          "head": {
            "from": "1.0.0",
            "transform": transform[0]
          },
          "matched1": {
            "from": "~1.2.3",
            "transform": transform[1]
          },
          "matched2": {
            "from": "1.3.x",
            "transform": transform[2]
          },
          "matched3": {
            "from": "^1.2.3",
            "transform": transform[3]
          },
          "tail": {
            "from": "1.6.0",
            "transform": transform[0]
          },
        }
      };

      const result = lodash.map(lodash.range(1, 4), function(i) {
        const configPath = ["plugins", "subPlugin" + i];
        return applyManifestMigration(ctx, configStore, configPath, moduleVersion, manifest);
      });

      false && console.info(JSON.stringify(result, null, 2));
      assert.deepEqual(result, [
        {
          "migrated": true,
          "configVersion": "1.2.9",
          "moduleVersion": "1.7.0",
          "steps": {
            "head": "unmatched",
            "matched1": "ok"
          },
          "ruleName": "matched1"
        },
        {
          "migrated": true,
          "configVersion": "1.3.1",
          "moduleVersion": "1.7.0",
          "steps": {
            "head": "unmatched",
            "matched1": "unmatched",
            "matched2": "ok"
          },
          "ruleName": "matched2"
        },
        {
          "migrated": true,
          "configVersion": "1.4.5",
          "moduleVersion": "1.7.0",
          "steps": {
            "head": "unmatched",
            "matched1": "unmatched",
            "matched2": "unmatched",
            "matched3": "ok"
          },
          "ruleName": "matched3"
        }
      ]);

      assert.isFalse(transform[0].called);
      assert.isTrue(transform[1].calledOnce);
      assert.isTrue(transform[2].calledOnce);
      assert.isTrue(transform[3].calledOnce);
    });
  });

  describe("modernizeConfig(): upgrade the old configuration to current version - for sandbox only", function() {
    let ConfigLoader = lab.acquireFrameworkModule("backbone/config-loader");
    let modernizeConfig = ConfigLoader.__get__("modernizeConfig");
    let nameResolver = lab.getNameResolver(["simple-plugin"], ["simple-bridge"]);
    let loggingFactory = lab.createLoggingFactoryMock();
    let L = loggingFactory.getLogger();
    let T = loggingFactory.getTracer();
    let CTX = { L, T, issueInspector, nameResolver };

    let moduleInfo = { name: "example", type: "application", presets: {} };

    beforeEach(function() {
      loggingFactory.resetHistory();
    });

    it("[sandbox] do nothing if manifests are omitted", function() {
      let configType = "sandbox";
      let configStore = {};
      let result = modernizeConfig(CTX, configType, configStore, moduleInfo);
      assert.deepEqual(result, configStore);
    });

    it("[sandbox] do nothing if manifests are empty", function() {
      let configType = "sandbox";
      let configStore = {};
      let result = modernizeConfig(CTX, configType, configStore, moduleInfo, {}, {});
      assert.deepEqual(result, configStore);
    });

    it("[sandbox] keep configure unchange if manifests are disabled or not found", function() {
      let configType = "sandbox";
      let configStore = {
        "plugins": {
          "subPlugin1": {
            "host": "localhost",
            "port": 17721,
            "__manifest__": {
              "version": "0.1.0",
              "note": "extended fields are reserved",
            },
          },
          "subPlugin2": {
            "host": "localhost",
            "port": 17722,
            "__manifest__": {
              "version": "0.1.1",
              "note": "extended fields are reserved",
            },
          },
        },
        "bridges": {
          "bridge1": {
            "subPlugin1": {
              "connector": {
                "refName": "subPlugin1/bridge1#connector",
                "refPath": "sandbox -> bridges -> bridge1 -> subPlugin1 -> connector",
                "refType": "dialect",
                "__manifest__": {
                  "version": "0.1.0",
                  "note": "extended fields are reserved",
                },
              }
            }
          },
          "bridge2": {
            "subPlugin2": {
              "connector": {
                "refName": "subPlugin2/bridge2#connector",
                "refPath": "sandbox -> bridges -> bridge2 -> subPlugin2 -> connector",
                "refType": "dialect",
                "__manifest__": {
                  "version": "0.1.1",
                  "note": "extended fields are reserved",
                },
              }
            }
          },
        }
      };
      let pluginTransform1 = sinon.stub().callsFake(function(source) {
        return { "httpserver": source };
      });
      let pluginManifests = {
        "subPlugin1": {
          "version": "0.1.1",
          "manifest": {
            "config": {
              "enabled": false,
              "migration": {
                "0.1.0_0.1.1": {
                  "from": "0.1.0",
                  "transform": pluginTransform1
                }
              }
            }
          }
        },
        "subPlugin2": {
          "version": "0.1.2",
        },
      };
      let bridgeTransform1 = sinon.stub().callsFake(function(source) {
        return {
          name: source.refName,
          path: source.refPath
        };
      });
      let bridgeManifests = {
        "bridge1": {
          "version": "0.1.1",
          "manifest": {
            "config": {
              "enabled": false,
              "migration": {
                "latest": {
                  "from": "0.1.0",
                  "transform": bridgeTransform1
                }
              }
            }
          }
        },
        "bridge2": {
          "version": "0.1.2",
          "manifest": {}
        },
      };

      let result = modernizeConfig(CTX, configType, configStore, moduleInfo, bridgeManifests, pluginManifests);

      false && console.info("modernizeConfig(): %s", JSON.stringify(result, null, 2));

      let expected = {
        "plugins": {
          "subPlugin1": {
            "host": "localhost",
            "port": 17721,
            "__manifest__": {
              "version": "0.1.0",
              "note": "extended fields are reserved",
            },
          },
          "subPlugin2": {
            "host": "localhost",
            "port": 17722,
            "__manifest__": {
              "version": "0.1.1",
              "note": "extended fields are reserved",
            },
          },
        },
        "bridges": {
          "bridge1": {
            "subPlugin1": {
              "connector": {
                "refName": "subPlugin1/bridge1#connector",
                "refPath": "sandbox -> bridges -> bridge1 -> subPlugin1 -> connector",
                "refType": "dialect",
                "__manifest__": {
                  "version": "0.1.0",
                  "note": "extended fields are reserved",
                },
              }
            }
          },
          "bridge2": {
            "subPlugin2": {
              "connector": {
                "refName": "subPlugin2/bridge2#connector",
                "refPath": "sandbox -> bridges -> bridge2 -> subPlugin2 -> connector",
                "refType": "dialect",
                "__manifest__": {
                  "version": "0.1.1",
                  "note": "extended fields are reserved",
                },
              }
            }
          },
        }
      };

      assert.deepEqual(result, expected);
      assert.isFalse(pluginTransform1.called);
      assert.isFalse(bridgeTransform1.called);
    });

    it("[sandbox] keep configure unchange if __manifest__ block not found", function() {
      let configType = "sandbox";
      let configStore = {
        "plugins": {
          "subPlugin1": {
            "host": "localhost",
            "port": 17721,
          },
          "subPlugin2": {
            "host": "localhost",
            "port": 17722,
            "__manifest__": {
              "version": "0.1.1",
              "note": "extended fields are reserved",
            }
          },
        },
        "bridges": {
          "bridge1": {
            "subPlugin1": {
              "connector": {
                "refName": "subPlugin1/bridge1#connector",
                "refPath": "sandbox -> bridges -> bridge1 -> subPlugin1 -> connector",
                "refType": "dialect",
              }
            }
          },
          "bridge2": {
            "subPlugin2": {
              "connector": {
                "refName": "subPlugin2/bridge2#connector",
                "refPath": "sandbox -> bridges -> bridge2 -> subPlugin2 -> connector",
                "refType": "dialect",
                "__manifest__": {
                  "version": "0.1.1",
                  "note": "extended fields are reserved",
                },
              }
            }
          },
        }
      };
      let pluginTransform1 = sinon.stub().callsFake(function(source) {
        return { "httpserver": source };
      });
      let pluginTransform2 = sinon.stub().callsFake(function(source) {
        return { "httpserver": source };
      });
      let pluginManifests = {
        "subPlugin1": {
          "version": "0.1.1",
          "manifest": {
            "config": {
              "migration": {
                "0.1.0_0.1.1": {
                  "from": "0.1.0",
                  "transform": pluginTransform1
                }
              }
            }
          }
        },
        "subPlugin2": {
          "version": "0.1.2",
          "manifest": {
            "config": {
              "migration": {
                "default": {
                  "from": "0.1.x",
                  "transform": pluginTransform2
                }
              }
            }
          }
        },
      };
      let bridgeTransform1 = sinon.stub().callsFake(function(source) {
        return {
          name: source.refName,
          path: source.refPath
        };
      });
      let bridgeTransform2 = sinon.stub().callsFake(function(source) {
        return {
          name: source.refName,
          path: source.refPath
        };
      });
      let bridgeManifests = {
        "bridge1": {
          "version": "0.1.1",
          "manifest": {
            "config": {
              "migration": {
                "latest": {
                  "from": "0.1.0",
                  "transform": bridgeTransform1
                }
              }
            }
          }
        },
        "bridge2": {
          "version": "0.1.2",
          "manifest": {
            "config": {
              "migration": {
                "latest": {
                  "from": "0.1.x",
                  "transform": bridgeTransform2
                }
              }
            }
          }
        },
      };

      let result = modernizeConfig(CTX, configType, configStore, moduleInfo, bridgeManifests, pluginManifests);

      false && console.info("modernizeConfig(): %s", JSON.stringify(result, null, 2));

      let expected = {
        "plugins": {
          "subPlugin1": {
            "host": "localhost",
            "port": 17721,
          },
          "subPlugin2": {
            "httpserver": {
              "host": "localhost",
              "port": 17722,
            },
            "__manifest__": {
              "version": "0.1.2",
              "note": "extended fields are reserved",
            },
          },
        },
        "bridges": {
          "bridge1": {
            "subPlugin1": {
              "connector": {
                "refName": "subPlugin1/bridge1#connector",
                "refPath": "sandbox -> bridges -> bridge1 -> subPlugin1 -> connector",
                "refType": "dialect",
              }
            }
          },
          "bridge2": {
            "subPlugin2": {
              "connector": {
                "name": "subPlugin2/bridge2#connector",
                "path": "sandbox -> bridges -> bridge2 -> subPlugin2 -> connector",
                "__manifest__": {
                  "version": "0.1.2",
                  "note": "extended fields are reserved",
                },
              }
            }
          },
        }
      };

      assert.deepEqual(result, expected);
      assert.isFalse(pluginTransform1.called);
      assert.isTrue(pluginTransform2.calledOnce);
      assert.isFalse(bridgeTransform1.called);
      assert.isTrue(bridgeTransform2.calledOnce);
    });

    it("[sandbox] keep configure unchange if configVersion is not less than moduleVersion", function() {
      let configType = "sandbox";
      let configStore = {
        "plugins": {
          "subPlugin1": {
            "host": "localhost",
            "port": 17721,
            "__manifest__": {
              "version": "0.1.9",
              "note": "extended fields are reserved",
            },
          },
          "subPlugin2": {
            "host": "localhost",
            "port": 17722,
            "__manifest__": {
              "version": "0.1.2",
              "note": "extended fields are reserved",
            }
          },
        },
        "bridges": {
          "bridge1": {
            "subPlugin1": {
              "connector": {
                "refName": "subPlugin1/bridge1#connector",
                "refPath": "sandbox -> bridges -> bridge1 -> subPlugin1 -> connector",
                "refType": "dialect",
                "__manifest__": {
                  "version": "0.1.9",
                  "note": "extended fields are reserved",
                },
              }
            }
          },
          "bridge2": {
            "subPlugin2": {
              "connector": {
                "refName": "subPlugin2/bridge2#connector",
                "refPath": "sandbox -> bridges -> bridge2 -> subPlugin2 -> connector",
                "refType": "dialect",
                "__manifest__": {
                  "version": "0.1.2",
                  "note": "extended fields are reserved",
                },
              }
            }
          },
        }
      };
      let pluginTransform1 = sinon.stub().callsFake(function(source) {
        return { "httpserver": source };
      });
      let pluginTransform2 = sinon.stub().callsFake(function(source) {
        return { "httpserver": source };
      });
      let pluginManifests = {
        "subPlugin1": {
          "version": "0.1.1",
          "manifest": {
            "config": {
              "migration": {
                "0.1.x": {
                  "from": "0.1.x",
                  "transform": pluginTransform1
                }
              }
            }
          }
        },
        "subPlugin2": {
          "version": "0.1.2",
          "manifest": {
            "config": {
              "migration": {
                "default": {
                  "from": "0.1.x",
                  "transform": pluginTransform2
                }
              }
            }
          }
        },
      };
      let bridgeTransform1 = sinon.stub().callsFake(function(source) {
        return {
          name: source.refName,
          path: source.refPath
        };
      });
      let bridgeTransform2 = sinon.stub().callsFake(function(source) {
        return {
          name: source.refName,
          path: source.refPath
        };
      });
      let bridgeManifests = {
        "bridge1": {
          "version": "0.1.1",
          "manifest": {
            "config": {
              "migration": {
                "latest": {
                  "from": "0.1.x",
                  "transform": bridgeTransform1
                }
              }
            }
          }
        },
        "bridge2": {
          "version": "0.1.2",
          "manifest": {
            "config": {
              "migration": {
                "latest": {
                  "from": "0.1.x",
                  "transform": bridgeTransform2
                }
              }
            }
          }
        },
      };

      let result = modernizeConfig(CTX, configType, configStore, moduleInfo, bridgeManifests, pluginManifests);

      false && console.info("modernizeConfig(): %s", JSON.stringify(result, null, 2));

      let expected = {
        "plugins": {
          "subPlugin1": {
            "host": "localhost",
            "port": 17721,
            "__manifest__": {
              "version": "0.1.9",
              "note": "extended fields are reserved",
            },
          },
          "subPlugin2": {
            "host": "localhost",
            "port": 17722,
            "__manifest__": {
              "version": "0.1.2",
              "note": "extended fields are reserved",
            },
          },
        },
        "bridges": {
          "bridge1": {
            "subPlugin1": {
              "connector": {
                "refName": "subPlugin1/bridge1#connector",
                "refPath": "sandbox -> bridges -> bridge1 -> subPlugin1 -> connector",
                "refType": "dialect",
                "__manifest__": {
                  "version": "0.1.9",
                  "note": "extended fields are reserved",
                },
              }
            }
          },
          "bridge2": {
            "subPlugin2": {
              "connector": {
                "refName": "subPlugin2/bridge2#connector",
                "refPath": "sandbox -> bridges -> bridge2 -> subPlugin2 -> connector",
                "refType": "dialect",
                "__manifest__": {
                  "version": "0.1.2",
                  "note": "extended fields are reserved",
                },
              }
            }
          },
        }
      };

      assert.deepEqual(result, expected);
      assert.isFalse(pluginTransform1.called);
      assert.isFalse(pluginTransform2.called);
      assert.isFalse(bridgeTransform1.called);
      assert.isFalse(bridgeTransform2.called);
    });

    it("[sandbox] upgrade the configuration corresponding to manifests", function() {
      let configType = "sandbox";
      let configStore = {
        "plugins": {
          "subPlugin1": {
            host: "localhost",
            port: 17721,
            "__manifest__": {
              "version": "0.1.0"
            },
          },
          "subPlugin2": {
            host: "localhost",
            port: 17722,
            "__manifest__": {
              "version": "0.1.0"
            },
          },
        },
        "bridges": {
          "bridge1": {
            "subPlugin1": {
              "connector": {
                "refName": "subPlugin1/bridge1#connector",
                "refPath": "sandbox -> bridges -> bridge1 -> subPlugin1 -> connector",
                "refType": "dialect",
                "__manifest__": {
                  "version": "0.1.0"
                }
              }
            }
          },
          "bridge2": {
            "subPlugin2": {
              "connector": {
                "refName": "subPlugin2/bridge2#connector",
                "refPath": "sandbox -> bridges -> bridge2 -> subPlugin2 -> connector",
                "refType": "dialect",
                "__manifest__": {
                  "version": "0.1.1"
                }
              }
            }
          },
          "bridge4": {
            "application": {
              "instance": {
                "refName": "application/bridge4#instance",
                "refPath": "sandbox -> bridges -> bridge4 -> application -> instance",
                "refType": "dialect",
                "__manifest__": {
                  "version": "0.1.2"
                }
              }
            }
          },
        }
      };
      let subPlugin1Transform = sinon.stub().callsFake(function(source) {
        return { "httpserver": source };
      });
      let subPlugin2Transform = sinon.stub().callsFake(function(source) {
        return { "webservice": source };
      });
      let pluginManifests = {
        "subPlugin1": {
          "version": "0.1.1",
          "manifest": {
            "config": {
              "migration": {
                "0.1.0_0.1.1": {
                  "from": "0.1.0",
                  "transform": subPlugin1Transform
                }
              }
            }
          }
        },
        "subPlugin2": {
          "version": "0.1.2",
          "manifest": {
            "config": {
              "migration": {
                "0.1.0_0.1.2": {
                  "from": "0.1.0",
                  "transform": subPlugin2Transform
                }
              }
            }
          }
        },
      };
      let bridgeTransformer = sinon.stub().callsFake(function(source) {
        return {
          name: source.refName,
          path: source.refPath
        };
      });
      let bridgeManifests = {
        "bridge1": {
          "version": "0.1.1",
          "manifest": {
            "config": {
              "migration": {
                "latest": {
                  "from": "0.1.0",
                  "transform": bridgeTransformer
                }
              }
            }
          }
        },
        "bridge2": {
          "version": "0.1.2",
          "manifest": {
            "config": {
              "migration": {
                "latest": {
                  "from": "0.1.1",
                  "transform": bridgeTransformer
                }
              }
            }
          }
        },
        "bridge4": {
          "version": "0.1.4",
          "manifest": {
            "config": {
              "migration": {
                "latest": {
                  "from": "0.1.2",
                  "transform": bridgeTransformer
                }
              }
            }
          }
        },
      };

      let result = modernizeConfig(CTX, configType, configStore, moduleInfo, bridgeManifests, pluginManifests);

      false && console.info("modernizeConfig(): %s", JSON.stringify(result, null, 2));

      let expected = {
        "plugins": {
          "subPlugin1": {
            "httpserver": {
              host: "localhost",
              port: 17721,
            },
            "__manifest__": {
              "version": "0.1.1"
            },
          },
          "subPlugin2": {
            "webservice": {
              host: "localhost",
              port: 17722,
            },
            "__manifest__": {
              "version": "0.1.2"
            },
          },
        },
        "bridges": {
          "bridge1": {
            "subPlugin1": {
              "connector": {
                "name": "subPlugin1/bridge1#connector",
                "path": "sandbox -> bridges -> bridge1 -> subPlugin1 -> connector",
                "__manifest__": {
                  "version": "0.1.1"
                }
              }
            }
          },
          "bridge2": {
            "subPlugin2": {
              "connector": {
                "name": "subPlugin2/bridge2#connector",
                "path": "sandbox -> bridges -> bridge2 -> subPlugin2 -> connector",
                "__manifest__": {
                  "version": "0.1.2"
                }
              }
            }
          },
          "bridge4": {
            "application": {
              "instance": {
                "name": "application/bridge4#instance",
                "path": "sandbox -> bridges -> bridge4 -> application -> instance",
                "__manifest__": {
                  "version": "0.1.4"
                }
              }
            }
          },
        }
      };

      assert.deepEqual(result, expected);
      assert.isTrue(subPlugin1Transform.calledOnce);
      assert.isTrue(subPlugin2Transform.calledOnce);
      assert.equal(bridgeTransformer.callCount, 3);
    });
  });

  describe("convertPreciseConfig(): bridge configure transformation", function() {
    before(function() {
      envcloak.setup({
        NODE_ENV: "test",
        LOGOLITE_FULL_LOG_MODE: "false",
        [FRAMEWORK_NAMESPACE_UCASE + "_CONFIG_DIR"]: lab.getAppCfgDir("tdd-cfg", "newcfg"),
        [FRAMEWORK_NAMESPACE_UCASE + "_CONFIG_ENV"]: "dev"
      });
    });

    let ConfigLoader = lab.acquireFrameworkModule("backbone/config-loader");
    let convertPreciseConfig = ConfigLoader.__get__("convertPreciseConfig");
    let RELOADING_FORCED = ConfigLoader.__get__("RELOADING_FORCED");

    it("transform sandboxConfig.bridges from application", function() {
      let sandboxConfig = {
        "plugins": {
          "plugin1": {},
          "plugin2": {}
        },
        "bridges": {
          "bridge1": {
            "plugin1": {
              "anyname1a": {
                "refPath": "sandbox -> bridge1 -> plugin1 -> anyname1a"
              },
              "anyname1c": {
                "refPath": "sandbox -> bridge1 -> plugin1 -> anyname1c"
              }
            }
          },
          "bridge2": {
            "plugin2": {
              "anyname2b": {
                "refPath": "sandbox -> bridge2 -> plugin2 -> anyname2b"
              }
            }
          }
        }
      };
      let exptectedConfig = {
        "plugins": {
          "plugin1": {},
          "plugin2": {}
        },
        "bridges": {
          "bridge1": {
            "plugin1": {
              "anyname1a": {
                "refPath": "sandbox -> bridge1 -> plugin1 -> anyname1a"
              },
              "anyname1c": {
                "refPath": "sandbox -> bridge1 -> plugin1 -> anyname1c"
              }
            }
          },
          "bridge2": {
            "plugin2": {
              "anyname2b": {
                "refPath": "sandbox -> bridge2 -> plugin2 -> anyname2b"
              }
            }
          }
        }
      };
      let convertedCfg = convertPreciseConfig(CTX, sandboxConfig, "application");
      false && console.info(JSON.stringify(convertedCfg, null, 2));
      assert.deepInclude(convertedCfg, exptectedConfig);
    });

    it("transform sandboxConfig.bridges from a plugin (without name)", function() {
      let sandboxConfig = {
        "plugins": {
          "plugin1": {},
          "plugin2": {}
        },
        "bridges": {
          "anyname1a": {
            "bridge1": {
              "refPath": "sandbox -> bridge1 -> anyname1a"
            }
          },
          "anyname1c": {
            "bridge1": {
              "refPath": "sandbox -> bridge1 -> anyname1c"
            }
          },
          "anyname2b": {
            "bridge2": {
              "refPath": "sandbox -> bridge2 -> anyname2b"
            }
          }
        }
      };
      let exptectedConfig = lodash.cloneDeep(sandboxConfig);
      if (chores.isUpgradeSupported(["bridge-full-ref", "presets"])) {
        exptectedConfig.bridges = {
          "bridge1": {
            "*": {
              "anyname1a": {
                "refPath": "sandbox -> bridge1 -> anyname1a"
              },
              "anyname1c": {
                "refPath": "sandbox -> bridge1 -> anyname1c"
              }
            }
          },
          "bridge2": {
            "*": {
              "anyname2b": {
                "refPath": "sandbox -> bridge2 -> anyname2b"
              }
            }
          }
        };
        if (!RELOADING_FORCED) {
          exptectedConfig.bridges.__status__ = true;
        }
      }
      let convertedCfg = convertPreciseConfig(CTX, sandboxConfig, "plugin", null, {
        configTags: ["bridge[dialect-bridge]"]
      });
      false && console.info(JSON.stringify(convertedCfg, null, 2));
      assert.deepInclude(convertedCfg, exptectedConfig);
    });

    it("transform sandboxConfig.bridges from a named plugin", function() {
      let sandboxConfig = {
        "plugins": {
          "plugin1": {},
          "plugin2": {}
        },
        "bridges": {
          "anyname1a": {
            "bridge1": {
              "refPath": "sandbox -> bridge1 -> anyname1a"
            }
          },
          "anyname1b": {
            "bridge1": {
              "refPath": "sandbox -> bridge1 -> anyname1b"
            }
          },
          "anyname3a": {
            "bridge3": {
              "refPath": "sandbox -> bridge3 -> anyname3a"
            }
          }
        }
      };
      let exptectedConfig = lodash.cloneDeep(sandboxConfig);
      if (chores.isUpgradeSupported(["bridge-full-ref", "presets"])) {
        exptectedConfig.bridges = {
          "bridge1": {
            "plugin1": {
              "anyname1a": {
                "refPath": "sandbox -> bridge1 -> anyname1a"
              },
              "anyname1b": {
                "refPath": "sandbox -> bridge1 -> anyname1b"
              }
            }
          },
          "bridge3": {
            "plugin1": {
              "anyname3a": {
                "refPath": "sandbox -> bridge3 -> anyname3a"
              }
            }
          }
        };
        if (!RELOADING_FORCED) {
          exptectedConfig.bridges.__status__ = true;
        }
      }
      let convertedCfg = convertPreciseConfig(CTX, sandboxConfig, "plugin", "plugin1", {
        configTags: "bridge[dialect-bridge]"
      });
      false && console.info(JSON.stringify(convertedCfg, null, 2));
      assert.deepInclude(convertedCfg, exptectedConfig);
    });

    after(function() {
      envcloak.reset();
    });
  });

  describe("ConfigLoader.load(): propagates a method call to local functions", function() {
    let ConfigLoader = lab.acquireFrameworkModule("backbone/config-loader");
    let loadConfig = lab.stubModuleFunction(ConfigLoader, "loadConfig");
    let validateConfig = sinon.spy(manifestHandler, "validateConfig");

    let configLoader = new ConfigLoader({
      appRef, frameworkRef, pluginRefs, bridgeRefs,
      nameResolver, issueInspector, stateInspector, manifestHandler
    });

    beforeEach(function() {
      loadConfig.reset();
      validateConfig.resetHistory();
    });

    it("dispatch a function call to other functions properly (popular case)", function() {
      // prepare a call
      let expectedConfig = { profile: { mixture: {} }, sandbox: { mixture: { application: {} } } };
      loadConfig.returns(lodash.cloneDeep(expectedConfig));
      // make the request
      let configStore = configLoader.load();
      // verify results
      assert.deepEqual(configStore, expectedConfig);
      // verify arguments
      assert.isTrue(loadConfig.calledOnce);
      if (chores.isUpgradeSupported("manifest-refiner")) {
        assert.isTrue(validateConfig.calledOnce);
      } else {
        assert.isFalse(validateConfig.called);
      }
    });
  });

  describe("ConfigLoader.load(): default configuration (without profile & sandbox)", function() {
    it("load configuration of nothing (empty loader)", function() {
      // options: null, appRootDir: null, libRootDirs: null
      let cfgLoader = new ConfigLoader({issueInspector, stateInspector, nameResolver});
      let config = cfgLoader.load();
      false && console.info(JSON.stringify(config, null, 2));
      assert.deepEqual(config, {
        "profile": {
          "mixture": {},
          "names": [ "default" ]
        },
        "sandbox": {
          "mixture": {},
          "names": [ "default" ]
        },
        "texture": {
          "mixture": {},
          "names": [ "default" ]
        }
      });
    });

    it("load configuration of empty application", function() {
      // options: null, appRootDir: null, libRootDirs: [...]
      let appRef = { type: "application", name: "empty-app" };
      let cfgLoader = new ConfigLoader({appRef, frameworkRef, pluginRefs, bridgeRefs, issueInspector, stateInspector, nameResolver});
      let config = cfgLoader.load();
      false && console.info(JSON.stringify(config, null, 2));

      // Profile configuration
      assert.deepEqual(lodash.get(config, "profile.names"), ["default"]);
      assert.deepEqual(lodash.get(config, "profile.mixture"), {});
      //
      let profileConfigExpected = lodash.defaultsDeep(
        sanitize(loader(path.join(lab.getLibCfgDir("plugin1"), "profile.js"))),
        sanitize(loader(path.join(lab.getLibCfgDir("plugin2"), "profile.js"))),
        sanitize(loader(path.join(lab.getFrameworkCfgDir(), "profile.js"))),
        {});
      assert.deepEqual(lodash.get(config, "profile.default"), profileConfigExpected);

      // Sandbox configuration
      assert.deepEqual(lodash.get(config, "sandbox.names"), ["default"]);
      assert.deepEqual(lodash.get(config, "sandbox.default"),
        lodash.defaultsDeep(
          loader(path.join(lab.getLibCfgDir("plugin1"), "sandbox.js")),
          loader(path.join(lab.getLibCfgDir("plugin2"), "sandbox.js")),
          loader(path.join(lab.getFrameworkCfgDir(), "sandbox.js")),
          {}));
      assert.deepEqual(lodash.get(config, "sandbox.mixture"), {});
    });

    it("load application configuration (without options)", function() {
      let cfgLoader = new ConfigLoader({appRef, frameworkRef, pluginRefs, bridgeRefs, issueInspector, stateInspector, nameResolver});
      let config = cfgLoader.load();
      false && console.info(JSON.stringify(config, null, 2));

      // Profile configuration
      assert.deepEqual(lodash.get(config, "profile.default"),
        lodash.defaultsDeep(
          sanitize(loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "profile.js"))),
          sanitize(loader(path.join(lab.getLibCfgDir("plugin1"), "profile.js"))),
          sanitize(loader(path.join(lab.getLibCfgDir("plugin2"), "profile.js"))),
          sanitize(loader(path.join(lab.getFrameworkCfgDir(), "profile.js"))),
          {}));
      assert.deepEqual(lodash.get(config, "profile.mixture"),
          lodash.get(config, "profile.default"));

      // Sandbox configuration
      assert.deepEqual(lodash.get(config, "sandbox.default"),
        lodash.defaultsDeep(
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox.js")),
          loader(path.join(lab.getLibCfgDir("plugin1"), "sandbox.js")),
          loader(path.join(lab.getLibCfgDir("plugin2"), "sandbox.js")),
          loader(path.join(lab.getFrameworkCfgDir(), "sandbox.js")),
          {}));
      assert.deepEqual(lodash.get(config, "sandbox.mixture"),
          lodash.get(config, "sandbox.default"));
    });
  });

  describe("ConfigLoader.load(): customize configDir and mixture", function() {
    before(function() {
      envcloak.setup({
        NODE_ENV: "test",
        LOGOLITE_FULL_LOG_MODE: "false",
        [FRAMEWORK_NAMESPACE_UCASE + "_CONFIG_DIR"]: lab.getAppCfgDir("tdd-cfg", "newcfg"),
        [FRAMEWORK_NAMESPACE_UCASE + "_CONFIG_ENV"]: "dev"
      });
    });

    it("load application configuration (without customized profile, sandbox)", function() {
      let cfgLoader = new ConfigLoader({appRef, frameworkRef, pluginRefs, bridgeRefs, issueInspector, stateInspector, nameResolver});
      let config = cfgLoader.load();
      false && console.info(JSON.stringify(config, null, 2));

      // Profile configuration (merge vs defaultsDeep)
      assert.deepInclude(
        lodash.get(config, "profile.default"),
        lodash.merge({},
          sanitize(loader(path.join(lab.getFrameworkCfgDir(), "profile.js"))),
          sanitize(loader(path.join(lab.getLibCfgDir("plugin2"), "profile.js"))),
          sanitize(loader(path.join(lab.getLibCfgDir("plugin1"), "profile.js"))),
          sanitize(loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "profile.js"))),
          {}
        )
      );

      assert.deepEqual(
        lodash.get(config, "profile.mixture"),
        lodash.get(config, "profile.default")
      );

      // Sandbox configuration
      assert.deepEqual(
        lodash.get(config, "sandbox.default"),
        lodash.merge({},
          loader(path.join(lab.getFrameworkCfgDir(), "sandbox.js")),
          loader(path.join(lab.getLibCfgDir("plugin1"), "sandbox.js")),
          loader(path.join(lab.getLibCfgDir("plugin2"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox.js")),
          {}
        )
      );

      assert.deepEqual(
        lodash.get(config, "sandbox.mixture"),
        lodash.get(config, "sandbox.default")
      );
    });

    after(function() {
      envcloak.reset();
    });
  });

  describe("ConfigLoader.load(): private sandbox configurations", function() {
    before(function() {
      envcloak.setup({
        NODE_ENV: "test",
        LOGOLITE_FULL_LOG_MODE: "false",
        [FRAMEWORK_NAMESPACE_UCASE + "_CONFIG_DIR"]: lab.getAppCfgDir("tdd-cfg", "newcfg"),
        [FRAMEWORK_NAMESPACE_UCASE + "_CONFIG_ENV"]: "dev",
        [FRAMEWORK_NAMESPACE_UCASE + "_SANDBOX"]: "private1,private2,ev1,ev2"
      });
    });

    it("load application configuration (without private sandboxes)", function() {
      let cfgLoader = new ConfigLoader({appRef, frameworkRef, pluginRefs, bridgeRefs, issueInspector, stateInspector, nameResolver});
      let config = cfgLoader.load();
      false && console.info(JSON.stringify(config, null, 2));

      // Profile configuration
      assert.deepEqual(
        lodash.get(config, "profile.default"),
        lodash.merge({},
          sanitize(loader(path.join(lab.getFrameworkCfgDir(), "profile.js"))),
          sanitize(loader(path.join(lab.getLibCfgDir("plugin2"), "profile.js"))),
          sanitize(loader(path.join(lab.getLibCfgDir("plugin1"), "profile.js"))),
          sanitize(loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "profile.js"))),
          {}
        )
      );

      assert.deepEqual(
        lodash.get(config, "profile.mixture"),
        lodash.get(config, "profile.default")
      );

      // Sandbox configuration
      assert.deepEqual(
        lodash.get(config, "sandbox.default"),
        lodash.merge({},
          loader(path.join(lab.getFrameworkCfgDir(), "sandbox.js")),
          loader(path.join(lab.getLibCfgDir("plugin1"), "sandbox.js")),
          loader(path.join(lab.getLibCfgDir("plugin2"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox.js")),
          {}
        )
      );

      assert.deepEqual(
        lodash.get(config, "sandbox.mixture"),
        lodash.merge(
          {},
          loader(path.join(lab.getFrameworkCfgDir(), "sandbox.js")),
          loader(path.join(lab.getLibCfgDir("plugin1"), "sandbox.js")),
          loader(path.join(lab.getLibCfgDir("plugin2"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox_private1.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox_private2.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox_ev1.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox_ev2.js")),
          {}
        )
      );

      // config/* <-> newcfg/dev/*
      assert.notDeepEqual(
        lodash.get(config, "sandbox.mixture"),
        lodash.merge(
          {},
          loader(path.join(lab.getFrameworkCfgDir(), "sandbox.js")),
          loader(path.join(lab.getLibCfgDir("plugin1"), "sandbox.js")),
          loader(path.join(lab.getLibCfgDir("plugin2"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox_ev1.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox_ev2.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox_private1.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox_private2.js")),
          {}
        )
      );

      // config/sandbox.js <-> config/sandbox_private1.js
      assert.notDeepEqual(
        lodash.get(config, "sandbox.mixture"),
        lodash.merge(
          {},
          loader(path.join(lab.getFrameworkCfgDir(), "sandbox.js")),
          loader(path.join(lab.getLibCfgDir("plugin1"), "sandbox.js")),
          loader(path.join(lab.getLibCfgDir("plugin2"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox_private1.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox_private2.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox_ev1.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox_ev2.js")),
          {}
        )
      );

      // config/sandbox_private1.js <-> config/sandbox_private2.js
      assert.notDeepEqual(
        lodash.get(config, "sandbox.mixture"),
        lodash.merge(
          {},
          loader(path.join(lab.getFrameworkCfgDir(), "sandbox.js")),
          loader(path.join(lab.getLibCfgDir("plugin1"), "sandbox.js")),
          loader(path.join(lab.getLibCfgDir("plugin2"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox_private2.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox_private1.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox_ev1.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox_ev2.js")),
          {}
        )
      );

      // newcfg/dev/sandbox.js <-> newcfg/dev/sandbox_ev1.js
      assert.notDeepEqual(
        lodash.get(config, "sandbox.mixture"),
        lodash.merge(
          {},
          loader(path.join(lab.getFrameworkCfgDir(), "sandbox.js")),
          loader(path.join(lab.getLibCfgDir("plugin1"), "sandbox.js")),
          loader(path.join(lab.getLibCfgDir("plugin2"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox_private1.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox_private2.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox_ev1.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox_ev2.js")),
          {}
        )
      );

      // newcfg/dev/sandbox_ev1.js <-> newcfg/dev/sandbox_ev2.js
      assert.notDeepEqual(
        lodash.get(config, "sandbox.mixture"),
        lodash.merge(
          {},
          loader(path.join(lab.getFrameworkCfgDir(), "sandbox.js")),
          loader(path.join(lab.getLibCfgDir("plugin1"), "sandbox.js")),
          loader(path.join(lab.getLibCfgDir("plugin2"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox_private1.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox_private2.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox_ev2.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox_ev1.js")),
          {}
        )
      );
    });

    it("load application configuration with single private sandboxes", function() {
      let cfgLoader = new ConfigLoader({options: {
        privateSandboxes: "bs1"
      }, appRef, frameworkRef, pluginRefs, bridgeRefs, issueInspector, stateInspector, nameResolver});
      let config = cfgLoader.load();
      false && console.info(JSON.stringify(config, null, 2));

      // Profile configuration
      assert.deepEqual(
        lodash.get(config, "profile.default"),
        lodash.merge({},
          sanitize(loader(path.join(lab.getFrameworkCfgDir(), "profile.js"))),
          sanitize(loader(path.join(lab.getLibCfgDir("plugin2"), "profile.js"))),
          sanitize(loader(path.join(lab.getLibCfgDir("plugin1"), "profile.js"))),
          sanitize(loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "profile.js"))),
          {}
        )
      );

      assert.deepEqual(
        lodash.get(config, "profile.mixture"),
        lodash.get(config, "profile.default")
      );

      // Sandbox configuration
      assert.deepEqual(
        lodash.get(config, "sandbox.mixture"),
        lodash.merge(
          {},
          loader(path.join(lab.getFrameworkCfgDir(), "sandbox.js")),
          loader(path.join(lab.getLibCfgDir("plugin1"), "sandbox.js")),
          loader(path.join(lab.getLibCfgDir("plugin2"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox_private1.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox_private2.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox_ev1.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox_ev2.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox_bs1.js")),
          {}
        )
      );
    });

    it("load application configuration with multiple private sandboxes", function() {
      let cfgLoader = new ConfigLoader({options: {
        privateSandboxes: ["bs1", "bs2"]
      }, appRef, frameworkRef, pluginRefs, bridgeRefs, issueInspector, stateInspector, nameResolver});
      let config = cfgLoader.load();
      false && console.info(JSON.stringify(config, null, 2));

      // Profile configuration
      assert.deepEqual(
        lodash.get(config, "profile.default"),
        lodash.merge({},
          sanitize(loader(path.join(lab.getFrameworkCfgDir(), "profile.js"))),
          sanitize(loader(path.join(lab.getLibCfgDir("plugin2"), "profile.js"))),
          sanitize(loader(path.join(lab.getLibCfgDir("plugin1"), "profile.js"))),
          sanitize(loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "profile.js"))),
          {}
        )
      );

      assert.deepEqual(
        lodash.get(config, "profile.mixture"),
        lodash.get(config, "profile.default")
      );

      // Sandbox configuration
      assert.deepEqual(
        lodash.get(config, "sandbox.mixture"),
        lodash.merge(
          {},
          loader(path.join(lab.getFrameworkCfgDir(), "sandbox.js")),
          loader(path.join(lab.getLibCfgDir("plugin1"), "sandbox.js")),
          loader(path.join(lab.getLibCfgDir("plugin2"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox_private1.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox_private2.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox_ev1.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox_ev2.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox_bs1.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox_bs2.js")),
          {}
        )
      );
    });

    it("load application configuration with underscore suffixes", function() {
      let cfgLoader = new ConfigLoader({options: {
        privateSandboxes: ["bs_p1", "bs_p2"]
      }, appRef, frameworkRef, pluginRefs, bridgeRefs, issueInspector, stateInspector, nameResolver});
      let config = cfgLoader.load();
      false && console.info(JSON.stringify(config, null, 2));

      // Profile configuration
      assert.deepEqual(
        lodash.get(config, "profile.default"),
        lodash.merge({},
          sanitize(loader(path.join(lab.getFrameworkCfgDir(), "profile.js"))),
          sanitize(loader(path.join(lab.getLibCfgDir("plugin2"), "profile.js"))),
          sanitize(loader(path.join(lab.getLibCfgDir("plugin1"), "profile.js"))),
          sanitize(loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "profile.js"))),
          {}
        )
      );

      assert.deepEqual(
        lodash.get(config, "profile.mixture"),
        lodash.get(config, "profile.default")
      );

      // Sandbox configuration
      assert.deepEqual(
        lodash.get(config, "sandbox.mixture"),
        lodash.merge(
          {},
          loader(path.join(lab.getFrameworkCfgDir(), "sandbox.js")),
          loader(path.join(lab.getLibCfgDir("plugin1"), "sandbox.js")),
          loader(path.join(lab.getLibCfgDir("plugin2"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox_private1.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox_private2.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox_ev1.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox_ev2.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox_bs_p1.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox_bs_p2.js")),
          {}
        )
      );
    });

    it("the order of listed sandbox labels is sensitive", function() {
      let cfgLoader = new ConfigLoader({options: {
        privateSandboxes: "bs2, bs1"
      }, appRef, frameworkRef, pluginRefs, bridgeRefs, issueInspector, stateInspector, nameResolver});
      let config = cfgLoader.load();

      // Profile configuration
      assert.deepEqual(
        lodash.get(config, "profile.default"),
        lodash.merge({},
          sanitize(loader(path.join(lab.getFrameworkCfgDir(), "profile.js"))),
          sanitize(loader(path.join(lab.getLibCfgDir("plugin2"), "profile.js"))),
          sanitize(loader(path.join(lab.getLibCfgDir("plugin1"), "profile.js"))),
          sanitize(loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "profile.js"))),
          {}
        )
      );

      assert.deepEqual(
        lodash.get(config, "profile.mixture"),
        lodash.get(config, "profile.default")
      );

      // Sandbox configuration
      assert.notDeepEqual(
        lodash.get(config, "sandbox.mixture"),
        lodash.merge(
          {},
          loader(path.join(lab.getFrameworkCfgDir(), "sandbox.js")),
          loader(path.join(lab.getLibCfgDir("plugin1"), "sandbox.js")),
          loader(path.join(lab.getLibCfgDir("plugin2"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox_private1.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox_private2.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox_ev1.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox_ev2.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox_bs1.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox_bs2.js")),
          {}
        )
      );

      assert.deepEqual(
        lodash.get(config, "sandbox.mixture"),
        lodash.merge(
          {},
          loader(path.join(lab.getFrameworkCfgDir(), "sandbox.js")),
          loader(path.join(lab.getLibCfgDir("plugin1"), "sandbox.js")),
          loader(path.join(lab.getLibCfgDir("plugin2"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox_private1.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "config"), "sandbox_private2.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox_ev1.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox_ev2.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox_bs2.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg", "newcfg/dev"), "sandbox_bs1.js")),
          {}
        )
      );
    });

    after(function() {
      envcloak.reset();
    });
  });

  describe("ConfigLoader.load(): change PROFILE/SANDBOX labels", function() {
    before(function() {
      envcloak.setup({
        NODE_ENV: "test",
        LOGOLITE_FULL_LOG_MODE: "false",
        [FRAMEWORK_NAMESPACE_UCASE + "_CONFIG_PROFILE_ALIASES"]: "context",
        [FRAMEWORK_NAMESPACE_UCASE + "_CONFIG_SANDBOX_ALIASES"]: "setting",
        [FRAMEWORK_NAMESPACE_UCASE + "_CONFIG_DIR"]: lab.getAppCfgDir("tdd-cfg-customized-names", "newcfg"),
        [FRAMEWORK_NAMESPACE_UCASE + "_CONFIG_ENV"]: "dev",
        [FRAMEWORK_NAMESPACE_UCASE + "_SANDBOX"]: "private1,private2,ev1,ev2"
      });
      chores.clearCache();
    });

    let appRef = {
      name: "tdd-cfg-customized-names",
      type: "application",
      path: lab.getAppHome("tdd-cfg-customized-names")
    };

    it("load application configuration with multiple private sandboxes", function() {
      let cfgLoader = new ConfigLoader({options: {
        privateSandboxes: ["bs1", "bs2"]
      }, appRef, frameworkRef, pluginRefs, bridgeRefs, issueInspector, stateInspector, nameResolver, manifestHandler});
      let config = cfgLoader.load();
      false && console.info(JSON.stringify(config, null, 2));

      // Profile configuration
      // Profile overriden order: [framework]/profile <- [app:default]/profile <- [app:external]/profile
      assert.deepEqual(
        lodash.get(config, "profile.default"),
        lodash.merge({},
          sanitize(loader(path.join(lab.getFrameworkCfgDir(), "profile.js"))),
          sanitize(loader(path.join(lab.getLibCfgDir("plugin2"), "profile.js"))),
          sanitize(loader(path.join(lab.getLibCfgDir("plugin1"), "profile.js"))),
          sanitize(loader(path.join(lab.getAppCfgDir("tdd-cfg-customized-names", "config"), "context.js"))),
          sanitize(loader(path.join(lab.getAppCfgDir("tdd-cfg-customized-names", "newcfg/dev"), "context.js"))),
          {}
        )
      );

      assert.deepEqual(
        lodash.get(config, "profile.mixture"),
        lodash.get(config, "profile.default")
      );

      // Sandbox configuration
      // Sandbox overriden order:
      //   [framework]/sandbox
      //    <- [lib:plugin1]/sandbox
      //    <- [lib:plugin2]/sandbox
      //    <- [app:default]/sandbox <- [app:external]/sandbox
      assert.deepEqual(
        lodash.get(config, "sandbox.default"),
        lodash.merge({},
          loader(path.join(lab.getFrameworkCfgDir(), "sandbox.js")),
          loader(path.join(lab.getLibCfgDir("plugin1"), "sandbox.js")),
          loader(path.join(lab.getLibCfgDir("plugin2"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg-customized-names", "config"), "setting.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg-customized-names", "newcfg/dev"), "setting.js")),
          {}
        )
      );

      assert.deepEqual(
        lodash.get(config, "sandbox.mixture"),
        lodash.merge({},
          loader(path.join(lab.getFrameworkCfgDir(), "sandbox.js")),
          loader(path.join(lab.getLibCfgDir("plugin1"), "sandbox.js")),
          loader(path.join(lab.getLibCfgDir("plugin2"), "sandbox.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg-customized-names", "config"), "setting.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg-customized-names", "config"), "setting_private1.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg-customized-names", "config"), "setting_private2.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg-customized-names", "newcfg/dev"), "setting.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg-customized-names", "newcfg/dev"), "setting_ev1.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg-customized-names", "newcfg/dev"), "setting_ev2.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg-customized-names", "newcfg/dev"), "setting_bs1.js")),
          loader(path.join(lab.getAppCfgDir("tdd-cfg-customized-names", "newcfg/dev"), "setting_bs2.js")),
          {}
        )
      );
    });

    after(function() {
      envcloak.reset();
    });
  });
});

function sanitize (configStore) {
  if (chores.isUpgradeSupported("profile-config-field-framework")) {
    return chores.renameJsonFields(configStore, {
      "devebot": "framework"
    });
  }
  return configStore;
}