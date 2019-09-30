'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');
var loader = Devebot.require('loader');
var assert = require('chai').assert;
var path = require('path');
var ConfigLoader = require(lab.getDevebotModule('backbone/config-loader'));
var NameResolver = require(lab.getDevebotModule('backbone/name-resolver'));
var ManifestHandler = require(lab.getDevebotModule('backbone/manifest-handler'));
var Envcloak = require('envcloak');
var envcloak = Envcloak.instance;
var sinon = require('sinon');

describe('tdd:devebot:core:config-loader', function() {

  var issueInspector = lab.getIssueInspector();
  var stateInspector = lab.getStateInspector();
  var loggingFactory = lab.createLoggingFactoryMock();

  var CTX = {
    L: loggingFactory.getLogger(),
    T: loggingFactory.getTracer(),
    issueInspector: issueInspector,
  };

  var appRef = {
    name: 'tdd-cfg',
    type: 'application',
    path: lab.getAppHome('tdd-cfg')
  };

  var devebotRef = {
    name: 'devebot',
    type: 'framework',
    path: lab.getDevebotHome()
  };

  var pluginRefs = {
    "plugin1": {
      name: 'plugin1',
      type: 'plugin',
      path: lab.getLibHome('plugin1')
    },
    "plugin2": {
      name: 'plugin2',
      type: 'plugin',
      path: lab.getLibHome('plugin2')
    }
  };

  var bridgeRefs = {};

  var nameResolver = new NameResolver({
    issueInspector,
    bridgeList: lodash.values(bridgeRefs),
    pluginList: lodash.values(pluginRefs),
  });

  var manifestHandler = new ManifestHandler({
    issueInspector,
    bridgeList: lodash.values(bridgeRefs),
    bundleList: lodash.concat(appRef, lodash.values(pluginRefs), devebotRef),
    nameResolver,
  });

  var stepEnv = new Envcloak();

  describe('readVariable(): read environment variables', function() {
    var ConfigLoader = lab.acquireDevebotModule('backbone/config-loader');
    var readVariable = ConfigLoader.__get__('readVariable');
    assert.isFunction(readVariable);

    beforeEach(function() {
      stepEnv.reset();
      chores.clearCache();
    });

    it('should return undefined if the associated environment variables not found', function() {
      assert.isUndefined(readVariable(CTX, 'EXAMPLE_APP', 'CONFIG_DIR'));
    });

    it('should extract value from the first environment variable', function() {
      stepEnv.setup({
        'EXAMPLE_APP_CONFIG_DIR': 'val#1',
        'DEVEBOT_CONFIG_DIR': 'val#2',
        'NODE_EXAMPLE_APP_CONFIG_DIR': 'val#3',
        'NODE_DEVEBOT_CONFIG_DIR': 'val#4',
      });
      assert.equal(readVariable(CTX, 'EXAMPLE_APP', 'CONFIG_DIR'), 'val#1');
    });

    it('should extract value from the second environment variable', function() {
      stepEnv.setup({
        'DEVEBOT_CONFIG_DIR': 'val#2',
        'NODE_EXAMPLE_APP_CONFIG_DIR': 'val#3',
        'NODE_DEVEBOT_CONFIG_DIR': 'val#4',
      });
      assert.equal(readVariable(CTX, 'EXAMPLE_APP', 'CONFIG_DIR'), 'val#2');
    });

    it('should extract value from the third environment variable', function() {
      stepEnv.setup({
        'NODE_EXAMPLE_APP_CONFIG_DIR': 'val#3',
        'NODE_DEVEBOT_CONFIG_DIR': 'val#4',
      });
      assert.equal(readVariable(CTX, 'EXAMPLE_APP', 'CONFIG_DIR'), 'val#3');
    });

    it('should extract value from the fourth environment variable', function() {
      stepEnv.setup({
        'NODE_DEVEBOT_CONFIG_DIR': 'val#4',
      });
      assert.equal(readVariable(CTX, 'EXAMPLE_APP', 'CONFIG_DIR'), 'val#4');
    });

    after(function() {
      stepEnv.reset();
      chores.clearCache();
    });
  });

  describe('extractEnvironConfig(): load the configuration from the environment variables', function() {
    var ConfigLoader = lab.acquireDevebotModule('backbone/config-loader');
    var extractEnvironConfig = ConfigLoader.__get__('extractEnvironConfig');

    it('transform sandboxConfig.bridges from application', function() {
      envcloak.setup({
        NODE_ENV: 'test',
        LOGOLITE_FULL_LOG_MODE: 'false',
        DEVEBOT_CONFIG_VAL_sandbox_plugins_appDemoPlugin_settings_phoneNumber: '+84987654321',
        EXAMPLE_CONFIG_VAL_sandbox_plugins_appDemoPlugin_settings_email: 'contact@example.com',
        DEVEBOT_CONFIG_ENV: 'dev'
      });

      var environCfg = extractEnvironConfig(CTX, 'EXAMPLE');
      false && console.log(JSON.stringify(environCfg, null, 2));
      assert.deepInclude(environCfg, {
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

  describe('transformConfig(): standardizing loaded configuration data', function() {
    var NameResolver = lab.acquireDevebotModule('backbone/name-resolver');
    var extractAliasNames = NameResolver.__get__('extractAliasNames');
    var buildAbsoluteAliasMap = NameResolver.__get__('buildAbsoluteAliasMap');
    var buildRelativeAliasMap = NameResolver.__get__('buildRelativeAliasMap');
    var ConfigLoader = lab.acquireDevebotModule('backbone/config-loader');
    var applyAliasMap = ConfigLoader.__get__('applyAliasMap');
    var doAliasMap = ConfigLoader.__get__('doAliasMap');
    var transformConfig = ConfigLoader.__get__('transformConfig');

    it('should transform relative names into default full names', function() {
      if (!chores.isUpgradeSupported(['bridge-full-ref', 'standardizing-config'])) this.skip();

      var originalCfg = {
        "bridges": {
          "bridgeKebabCase1": {
            "wrapper1": {
              "pointer": {
                "refPath": "sandbox -> bridge-kebab-case1 -> wrapper1 -> pointer"
              }
            }
          },
          "bridgeKebabCase2": {
            "devebot-dp-wrapper1": {
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
            "devebot-dp-wrapper1": {
              "bean": {
                "refPath": "sandbox -> connector2 -> wrapper1 -> bean"
              }
            }
          }
        }
      };

      var expectedCfg = {
        "bridges": {
          "bridge-kebab-case1": {
            "devebot-dp-wrapper1": {
              "pointer": {
                "refPath": "sandbox -> bridge-kebab-case1 -> wrapper1 -> pointer"
              }
            }
          },
          "bridge-kebab-case2": {
            "devebot-dp-wrapper1": {
              "pointer": {
                "refPath": "sandbox -> bridge-kebab-case2 -> wrapper1 -> pointer"
              }
            }
          },
          "devebot-co-connector1": {
            "devebot-dp-wrapper1": {
              "bean": {
                "refPath": "sandbox -> connector1 -> wrapper1 -> bean"
              }
            }
          },
          "devebot-co-connector2": {
            "devebot-dp-wrapper1": {
              "bean": {
                "refPath": "sandbox -> connector2 -> wrapper1 -> bean"
              }
            }
          }
        }
      };

      var absoluteAliasMap = {
        plugin: buildAbsoluteAliasMap(extractAliasNames(CTX, 'plugin', {
          "path/to/devebot-dp-wrapper1": {
            name: "devebot-dp-wrapper1"
          },
          "path/to/devebot-dp-wrapper2": {
            name: "devebot-dp-wrapper2"
          }
        })),
        bridge: buildAbsoluteAliasMap(extractAliasNames(CTX, 'bridge', {
          "path/to/bridge-kebab-case1": {
            name: "bridge-kebab-case1"
          },
          "path/to/bridge-kebab-case2": {
            name: "bridge-kebab-case2"
          },
          "path/to/devebot-co-connector1": {
            name: "devebot-co-connector1"
          },
          "path/to/devebot-co-connector2": {
            name: "devebot-co-connector2"
          }
        })),
      }
      var convertedCfg = transformConfig(lodash.assign({
        nameResolver: {
          getAbsoluteAliasMap: function() {
            return absoluteAliasMap;
          },
          getOriginalNameOf: function (name, type) {
            return absoluteAliasMap[type][name] || name;
          }
        }
      }, CTX), 'sandbox', originalCfg, 'plugin', 'cfg-example', {});

      false && console.log(JSON.stringify(convertedCfg, null, 2));
      assert.deepInclude(convertedCfg, expectedCfg);
    });

    it('should transform absolute names into relative names', function() {
      if (!chores.isUpgradeSupported(['bridge-full-ref', 'standardizing-config'])) this.skip();

      var originalCfg = {
        "bridges": {
          "bridgeKebabCase1": {
            "wrapper1": {
              "pointer": {
                "refPath": "sandbox -> bridge-kebab-case1 -> wrapper1 -> pointer"
              }
            }
          },
          "bridge-kebab-case2": {
            "devebot-dp-wrapper1": {
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
            "devebot-dp-wrapper1": {
              "bean": {
                "refPath": "sandbox -> connector2 -> wrapper1 -> bean"
              }
            }
          }
        }
      };

      var expectedCfg = {
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

      var pluginRefs = extractAliasNames(CTX, 'plugin', {
        "path/to/devebot-dp-wrapper1": {
          name: "devebot-dp-wrapper1"
        },
        "path/to/devebot-dp-wrapper2": {
          name: "devebot-dp-wrapper2"
        }
      });

      var bridgeRefs = extractAliasNames(CTX, 'bridge', {
        "path/to/bridge-kebab-case1": {
          name: "bridge-kebab-case1"
        },
        "path/to/bridge-kebab-case2": {
          name: "bridge-kebab-case2"
        },
        "path/to/devebot-co-connector1": {
          name: "devebot-co-connector1"
        },
        "path/to/devebot-co-connector2": {
          name: "devebot-co-connector2"
        }
      });

      var absoluteAliasMap = {
        plugin: buildAbsoluteAliasMap(pluginRefs),
        bridge: buildAbsoluteAliasMap(bridgeRefs),
      }
      var absoluteCfg = transformConfig(lodash.assign({
        nameResolver: {
          getAbsoluteAliasMap: function() {
            return absoluteAliasMap;
          },
          getOriginalNameOf: function (name, type) {
            return absoluteAliasMap[type][name] || name;
          }
        }
      }, CTX), 'sandbox', originalCfg, 'plugin', 'cfg-example', {});

      var relativeAliasMap = {
        plugin: buildRelativeAliasMap(pluginRefs),
        bridge: buildRelativeAliasMap(bridgeRefs),
      }
      var relativeCfg = null;
      if (doAliasMap) {
        relativeCfg = doAliasMap(CTX, absoluteCfg, relativeAliasMap.plugin, relativeAliasMap.bridge);
      } else {
        relativeCfg = applyAliasMap(CTX, absoluteCfg, function(name, type) {
          return relativeAliasMap[type][name];
        })
      }

      false && console.log(JSON.stringify(relativeCfg, null, 2));
      assert.deepInclude(relativeCfg, expectedCfg);
    });
  });

  describe('extractConfigManifest()', function() {
    var ConfigLoader = lab.acquireDevebotModule('backbone/config-loader');
    var extractConfigManifest = ConfigLoader.__get__('extractConfigManifest');
    var nameResolver = lab.getNameResolver(['sub-plugin1', 'sub-plugin2'], ['sub-bridge1', 'sub-bridge2', 'devebot-co-vps']);
    var ctx = { nameResolver: nameResolver }

    it('return empty configManifest map if the moduleRef is empty or null', function() {
      assert.deepEqual(extractConfigManifest(ctx, null), {});
      assert.deepEqual(extractConfigManifest(ctx, {}), {});
    });

    it('return the correct configManifest with normal bridgeRefs', function() {
      var bridgeRefs = {
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
        "/test/lib/devebot-co-vps": {
          "name": "devebot-co-vps",
          "type": "bridge",
          "path": "/test/lib/devebot-co-vps",
          "version": "0.1.3",
          "manifest": {
            "config": {
              "something": "devebot-co-vps"
            }
          },
        }
      }
      var expected = {
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
        "devebot-co-vps": {
          "version": "0.1.3",
          "manifest": {
            "config": {
              "something": "devebot-co-vps"
            }
          },
        },
      }
      assert.deepEqual(extractConfigManifest(ctx, bridgeRefs), expected);
    });

    it('return the correct configManifest with normal pluginRefs', function() {
      var pluginRefs = {
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
              "something": "devebot"
            },
          },
        }
      }
      var expected = {
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
              "something": "devebot"
            },
          },
        },
      }
      assert.deepEqual(extractConfigManifest(ctx, pluginRefs), expected);
    });
  });

  describe('applyManifestMigration()', function() {
    var ConfigLoader = lab.acquireDevebotModule('backbone/config-loader');
    var applyManifestMigration = ConfigLoader.__get__('applyManifestMigration');
    var nameResolver = lab.getNameResolver(['sub-plugin1', 'sub-plugin2', 'sub-plugin3'], []);
    var loggingFactory = lab.createLoggingFactoryMock();
    var L = loggingFactory.getLogger();
    var T = loggingFactory.getTracer();
    var ctx = { L, T, nameResolver }

    beforeEach(function() {
      loggingFactory.resetHistory();
    })

    it('at most only one migration rule will be applied', function() {
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
      transform[1] = sinon.stub().callsFake(function(cfg) { return { "matched1": cfg } });
      transform[2] = sinon.stub().callsFake(function(cfg) { return { "matched2": cfg } });
      transform[3] = sinon.stub().callsFake(function(cfg) { return { "matched3": cfg } });
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
      }

      const result = lodash.map(lodash.range(1,4), function(i) {
        const configPath = ["plugins", "subPlugin" + i];
        return applyManifestMigration(ctx, configStore, configPath, moduleVersion, manifest);
      });

      false && console.log(JSON.stringify(result, null, 2));
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

  describe('modernizeConfig(): upgrade the old configuration to current version', function() {
    var ConfigLoader = lab.acquireDevebotModule('backbone/config-loader');
    var modernizeConfig = ConfigLoader.__get__('modernizeConfig');
    var nameResolver = lab.getNameResolver(['simple-plugin'], ['simple-bridge']);
    var loggingFactory = lab.createLoggingFactoryMock();
    var L = loggingFactory.getLogger();
    var T = loggingFactory.getTracer();
    var CTX = { L, T, issueInspector, nameResolver };

    var moduleInfo = { name: 'example', type: 'application', presets: {} }

    beforeEach(function() {
      loggingFactory.resetHistory();
    })

    it('do nothing if manifests are omitted', function() {
      var configType = 'sandbox';
      var configStore = {};
      var result = modernizeConfig(CTX, configType, configStore, moduleInfo);
      assert.deepEqual(result, configStore);
    });

    it('do nothing if manifests are empty', function() {
      var configType = 'sandbox';
      var configStore = {};
      var result = modernizeConfig(CTX, configType, configStore, moduleInfo, {}, {});
      assert.deepEqual(result, configStore);
    });

    it('keep configure unchange if manifests are disabled or not found', function() {
      var configType = 'sandbox';
      var configStore = {
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
      var pluginTransform1 = sinon.stub().callsFake(function(source) {
        return { "httpserver": source }
      });
      var pluginManifests = {
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
      }
      var bridgeTransform1 = sinon.stub().callsFake(function(source) {
        return {
          name: source.refName,
          path: source.refPath
        }
      });
      var bridgeManifests = {
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
      }

      var result = modernizeConfig(CTX, configType, configStore, moduleInfo, bridgeManifests, pluginManifests);

      false && console.log('modernizeConfig(): %s', JSON.stringify(result, null, 2));

      var expected = {
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
      }

      assert.deepEqual(result, expected);
      assert.isFalse(pluginTransform1.called);
      assert.isFalse(bridgeTransform1.called);
    });

    it('keep configure unchange if __manifest__ block not found', function() {
      var configType = 'sandbox';
      var configStore = {
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
      var pluginTransform1 = sinon.stub().callsFake(function(source) {
        return { "httpserver": source }
      });
      var pluginTransform2 = sinon.stub().callsFake(function(source) {
        return { "httpserver": source }
      });
      var pluginManifests = {
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
      }
      var bridgeTransform1 = sinon.stub().callsFake(function(source) {
        return {
          name: source.refName,
          path: source.refPath
        }
      });
      var bridgeTransform2 = sinon.stub().callsFake(function(source) {
        return {
          name: source.refName,
          path: source.refPath
        }
      });
      var bridgeManifests = {
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
      }

      var result = modernizeConfig(CTX, configType, configStore, moduleInfo, bridgeManifests, pluginManifests);

      false && console.log('modernizeConfig(): %s', JSON.stringify(result, null, 2));

      var expected = {
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
      }

      assert.deepEqual(result, expected);
      assert.isFalse(pluginTransform1.called);
      assert.isTrue(pluginTransform2.calledOnce);
      assert.isFalse(bridgeTransform1.called);
      assert.isTrue(bridgeTransform2.calledOnce);
    });

    it('keep configure unchange if configVersion is not less than moduleVersion', function() {
      var configType = 'sandbox';
      var configStore = {
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
      var pluginTransform1 = sinon.stub().callsFake(function(source) {
        return { "httpserver": source }
      });
      var pluginTransform2 = sinon.stub().callsFake(function(source) {
        return { "httpserver": source }
      });
      var pluginManifests = {
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
      }
      var bridgeTransform1 = sinon.stub().callsFake(function(source) {
        return {
          name: source.refName,
          path: source.refPath
        }
      });
      var bridgeTransform2 = sinon.stub().callsFake(function(source) {
        return {
          name: source.refName,
          path: source.refPath
        }
      });
      var bridgeManifests = {
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
      }

      var result = modernizeConfig(CTX, configType, configStore, moduleInfo, bridgeManifests, pluginManifests);

      false && console.log('modernizeConfig(): %s', JSON.stringify(result, null, 2));

      var expected = {
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
      }

      assert.deepEqual(result, expected);
      assert.isFalse(pluginTransform1.called);
      assert.isFalse(pluginTransform2.called);
      assert.isFalse(bridgeTransform1.called);
      assert.isFalse(bridgeTransform2.called);
    });

    it('upgrade the configuration corresponding to manifests', function() {
      var configType = 'sandbox';
      var configStore = {
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
      var subPlugin1Transform = sinon.stub().callsFake(function(source) {
        return { "httpserver": source }
      });
      var subPlugin2Transform = sinon.stub().callsFake(function(source) {
        return { "webservice": source }
      });
      var pluginManifests = {
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
      }
      var bridgeTransformer = sinon.stub().callsFake(function(source) {
        return {
          name: source.refName,
          path: source.refPath
        }
      });
      var bridgeManifests = {
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
      }

      var result = modernizeConfig(CTX, configType, configStore, moduleInfo, bridgeManifests, pluginManifests);

      false && console.log('modernizeConfig(): %s', JSON.stringify(result, null, 2));

      var expected = {
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
      }

      assert.deepEqual(result, expected);
      assert.isTrue(subPlugin1Transform.calledOnce);
      assert.isTrue(subPlugin2Transform.calledOnce);
      assert.equal(bridgeTransformer.callCount, 3);
    });
  });

  describe('convertPreciseConfig(): bridge configure transformation', function() {
    before(function() {
      envcloak.setup({
        NODE_ENV: 'test',
        LOGOLITE_FULL_LOG_MODE: 'false',
        DEVEBOT_CONFIG_DIR: lab.getAppCfgDir('tdd-cfg', 'newcfg'),
        DEVEBOT_CONFIG_ENV: 'dev'
      });
    });

    var ConfigLoader = lab.acquireDevebotModule('backbone/config-loader');
    var convertPreciseConfig = ConfigLoader.__get__('convertPreciseConfig');
    var RELOADING_FORCED = ConfigLoader.__get__('RELOADING_FORCED');

    it('transform sandboxConfig.bridges from application', function() {
      var sandboxConfig = {
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
      var exptectedConfig = {
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
      var convertedCfg = convertPreciseConfig(CTX, sandboxConfig, 'application');
      false && console.log(JSON.stringify(convertedCfg, null, 2));
      assert.deepInclude(convertedCfg, exptectedConfig);
    });

    it('transform sandboxConfig.bridges from a plugin (without name)', function() {
      var sandboxConfig = {
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
      var exptectedConfig = lodash.cloneDeep(sandboxConfig);
      if (chores.isUpgradeSupported(['bridge-full-ref','presets'])) {
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
      var convertedCfg = convertPreciseConfig(CTX, sandboxConfig, 'plugin', null, {
        configTags: ['bridge[dialect-bridge]']
      });
      false && console.log(JSON.stringify(convertedCfg, null, 2));
      assert.deepInclude(convertedCfg, exptectedConfig);
    });

    it('transform sandboxConfig.bridges from a named plugin', function() {
      var sandboxConfig = {
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
      var exptectedConfig = lodash.cloneDeep(sandboxConfig);
      if (chores.isUpgradeSupported(['bridge-full-ref','presets'])) {
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
      var convertedCfg = convertPreciseConfig(CTX, sandboxConfig, 'plugin', 'plugin1', {
        configTags: 'bridge[dialect-bridge]'
      });
      false && console.log(JSON.stringify(convertedCfg, null, 2));
      assert.deepInclude(convertedCfg, exptectedConfig);
    });

    after(function() {
      envcloak.reset();
    });
  });

  describe('ConfigLoader.load(): propagates a method call to local functions', function() {
    var ConfigLoader = lab.acquireDevebotModule('backbone/config-loader');
    var loadConfig = lab.stubModuleFunction(ConfigLoader, 'loadConfig');
    var validateConfig = sinon.spy(manifestHandler, 'validateConfig');

    var configLoader = new ConfigLoader({
      appRef, devebotRef, pluginRefs, bridgeRefs,
      nameResolver, issueInspector, stateInspector, manifestHandler
    });

    beforeEach(function() {
      loadConfig.reset();
      validateConfig.resetHistory();
    });

    it("dispatch a function call to other functions properly (popular case)", function() {
      // prepare a call
      var expectedConfig = { profile: { mixture: {} }, sandbox: { mixture: { application: {} } } };
      loadConfig.returns(lodash.cloneDeep(expectedConfig));
      // make the request
      var configStore = configLoader.load();
      // verify results
      assert.deepEqual(configStore, expectedConfig);
      // verify arguments
      assert.isTrue(loadConfig.calledOnce);
      if (chores.isUpgradeSupported('manifest-refiner')) {
        assert.isTrue(validateConfig.calledOnce);
      } else {
        assert.isFalse(validateConfig.called);
      }
    });
  });

  describe('ConfigLoader.load(): default configuration (without profile & sandbox)', function() {
    it('load configuration of nothing (empty loader)', function() {
      // options: null, appRootDir: null, libRootDirs: null
      var cfgLoader = new ConfigLoader({issueInspector, stateInspector, nameResolver});
      var config = cfgLoader.load();
      false && console.log(JSON.stringify(config, null, 2));
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

    it('load configuration of empty application', function() {
      // options: null, appRootDir: null, libRootDirs: [...]
      var appRef = { type: 'application', name: 'empty-app' }
      var cfgLoader = new ConfigLoader({appRef, devebotRef, pluginRefs, bridgeRefs, issueInspector, stateInspector, nameResolver});
      var config = cfgLoader.load();
      false && console.log(JSON.stringify(config, null, 2));

      // Profile configuration
      assert.deepEqual(lodash.get(config,"profile.names"), ["default"]);
      assert.deepEqual(lodash.get(config,"profile.default"),
        lodash.defaultsDeep(
          loader(path.join(lab.getLibCfgDir('plugin1'), 'profile.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'profile.js')),
          loader(path.join(lab.getDevebotCfgDir(), 'profile.js')),
          {}));
      assert.deepEqual(lodash.get(config,"profile.mixture"), {});

      // Sandbox configuration
      assert.deepEqual(lodash.get(config,"sandbox.names"), ["default"]);
      assert.deepEqual(lodash.get(config,"sandbox.default"),
        lodash.defaultsDeep(
          loader(path.join(lab.getLibCfgDir('plugin1'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'sandbox.js')),
          loader(path.join(lab.getDevebotCfgDir(), 'sandbox.js')),
          {}));
      assert.deepEqual(lodash.get(config,"sandbox.mixture"), {});
    });

    it('load application configuration (without options)', function() {
      var cfgLoader = new ConfigLoader({appRef, devebotRef, pluginRefs, bridgeRefs, issueInspector, stateInspector, nameResolver});
      var config = cfgLoader.load();
      false && console.log(JSON.stringify(config, null, 2));

      // Profile configuration
      assert.deepEqual(lodash.get(config,"profile.default"),
        lodash.defaultsDeep(
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'profile.js')),
          loader(path.join(lab.getLibCfgDir('plugin1'), 'profile.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'profile.js')),
          loader(path.join(lab.getDevebotCfgDir(), 'profile.js')),
          {}));
      assert.deepEqual(lodash.get(config,"profile.mixture"),
          lodash.get(config,"profile.default"));

      // Sandbox configuration
      assert.deepEqual(lodash.get(config,"sandbox.default"),
        lodash.defaultsDeep(
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin1'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'sandbox.js')),
          loader(path.join(lab.getDevebotCfgDir(), 'sandbox.js')),
          {}));
      assert.deepEqual(lodash.get(config,"sandbox.mixture"),
          lodash.get(config,"sandbox.default"));
    });
  });

  describe('ConfigLoader.load(): customize configDir and mixture', function() {
    before(function() {
      envcloak.setup({
        NODE_ENV: 'test',
        LOGOLITE_FULL_LOG_MODE: 'false',
        DEVEBOT_CONFIG_DIR: lab.getAppCfgDir('tdd-cfg', 'newcfg'),
        DEVEBOT_CONFIG_ENV: 'dev'
      });
    });

    it('load application configuration (without customized profile, sandbox)', function() {
      var cfgLoader = new ConfigLoader({appRef, devebotRef, pluginRefs, bridgeRefs, issueInspector, stateInspector, nameResolver});
      var config = cfgLoader.load();
      false && console.log(JSON.stringify(config, null, 2));

      // Profile configuration
      assert.deepInclude(
        lodash.get(config,"profile.default"),
        lodash.merge(
          loader(path.join(lab.getDevebotCfgDir(), 'profile.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'profile.js')),
          {}
        )
      );

      assert.deepEqual(
        lodash.get(config,"profile.mixture"),
        lodash.get(config,"profile.default")
      );

      // Sandbox configuration
      assert.deepEqual(
        lodash.get(config,"sandbox.default"),
        lodash.merge({},
          loader(path.join(lab.getDevebotCfgDir(), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin1'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox.js')),
          {}
        )
      );

      assert.deepEqual(
        lodash.get(config,"sandbox.mixture"),
        lodash.get(config,"sandbox.default")
      );
    });

    after(function() {
      envcloak.reset();
    });
  });

  describe('ConfigLoader.load(): private sandbox configurations', function() {
    before(function() {
      envcloak.setup({
        NODE_ENV: 'test',
        LOGOLITE_FULL_LOG_MODE: 'false',
        DEVEBOT_CONFIG_DIR: lab.getAppCfgDir('tdd-cfg', 'newcfg'),
        DEVEBOT_CONFIG_ENV: 'dev',
        DEVEBOT_SANDBOX: 'private1,private2,ev1,ev2'
      });
    });

    it('load application configuration (without private sandboxes)', function() {
      var cfgLoader = new ConfigLoader({appRef, devebotRef, pluginRefs, bridgeRefs, issueInspector, stateInspector, nameResolver});
      var config = cfgLoader.load();
      false && console.log(JSON.stringify(config, null, 2));

      // Profile configuration
      assert.deepEqual(
        lodash.get(config,"profile.default"),
        lodash.merge(
          loader(path.join(lab.getDevebotCfgDir(), 'profile.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'profile.js')),
          {}
        )
      );

      assert.deepEqual(
        lodash.get(config,"profile.mixture"),
        lodash.get(config,"profile.default")
      );

      // Sandbox configuration
      assert.deepEqual(
        lodash.get(config,"sandbox.default"),
        lodash.merge({},
          loader(path.join(lab.getDevebotCfgDir(), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin1'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox.js')),
          {}
        )
      );

      assert.deepEqual(
        lodash.get(config,"sandbox.mixture"),
        lodash.merge(
          {},
          loader(path.join(lab.getDevebotCfgDir(), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin1'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox_private1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox_private2.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_ev1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_ev2.js')),
          {}
        )
      );

      // config/* <-> newcfg/dev/*
      assert.notDeepEqual(
        lodash.get(config,"sandbox.mixture"),
        lodash.merge(
          {},
          loader(path.join(lab.getDevebotCfgDir(), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin1'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_ev1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_ev2.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox_private1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox_private2.js')),
          {}
        )
      );

      // config/sandbox.js <-> config/sandbox_private1.js
      assert.notDeepEqual(
        lodash.get(config,"sandbox.mixture"),
        lodash.merge(
          {},
          loader(path.join(lab.getDevebotCfgDir(), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin1'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox_private1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox_private2.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_ev1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_ev2.js')),
          {}
        )
      );

      // config/sandbox_private1.js <-> config/sandbox_private2.js
      assert.notDeepEqual(
        lodash.get(config,"sandbox.mixture"),
        lodash.merge(
          {},
          loader(path.join(lab.getDevebotCfgDir(), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin1'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox_private2.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox_private1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_ev1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_ev2.js')),
          {}
        )
      );

      // newcfg/dev/sandbox.js <-> newcfg/dev/sandbox_ev1.js
      assert.notDeepEqual(
        lodash.get(config,"sandbox.mixture"),
        lodash.merge(
          {},
          loader(path.join(lab.getDevebotCfgDir(), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin1'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox_private1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox_private2.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_ev1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_ev2.js')),
          {}
        )
      );

      // newcfg/dev/sandbox_ev1.js <-> newcfg/dev/sandbox_ev2.js
      assert.notDeepEqual(
        lodash.get(config,"sandbox.mixture"),
        lodash.merge(
          {},
          loader(path.join(lab.getDevebotCfgDir(), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin1'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox_private1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox_private2.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_ev2.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_ev1.js')),
          {}
        )
      );
    });

    it('load application configuration with single private sandboxes', function() {
      var cfgLoader = new ConfigLoader({options: {
        privateSandboxes: 'bs1'
      }, appRef, devebotRef, pluginRefs, bridgeRefs, issueInspector, stateInspector, nameResolver});
      var config = cfgLoader.load();
      false && console.log(JSON.stringify(config, null, 2));

      // Profile configuration
      assert.deepEqual(
        lodash.get(config,"profile.default"),
        lodash.merge(
          loader(path.join(lab.getDevebotCfgDir(), 'profile.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'profile.js')),
          {}
        )
      );

      assert.deepEqual(
        lodash.get(config,"profile.mixture"),
        lodash.get(config,"profile.default")
      );

      // Sandbox configuration
      assert.deepEqual(
        lodash.get(config,"sandbox.mixture"),
        lodash.merge(
          {},
          loader(path.join(lab.getDevebotCfgDir(), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin1'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox_private1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox_private2.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_ev1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_ev2.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_bs1.js')),
          {}
        )
      );
    });

    it('load application configuration with multiple private sandboxes', function() {
      var cfgLoader = new ConfigLoader({options: {
        privateSandboxes: ['bs1', 'bs2']
      }, appRef, devebotRef, pluginRefs, bridgeRefs, issueInspector, stateInspector, nameResolver});
      var config = cfgLoader.load();
      false && console.log(JSON.stringify(config, null, 2));

      // Profile configuration
      assert.deepEqual(
        lodash.get(config,"profile.default"),
        lodash.merge(
          loader(path.join(lab.getDevebotCfgDir(), 'profile.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'profile.js')),
          {}
        )
      );

      assert.deepEqual(
        lodash.get(config,"profile.mixture"),
        lodash.get(config,"profile.default")
      );

      // Sandbox configuration
      assert.deepEqual(
        lodash.get(config,"sandbox.mixture"),
        lodash.merge(
          {},
          loader(path.join(lab.getDevebotCfgDir(), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin1'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox_private1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox_private2.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_ev1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_ev2.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_bs1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_bs2.js')),
          {}
        )
      );
    });

    it('load application configuration with underscore suffixes', function() {
      var cfgLoader = new ConfigLoader({options: {
        privateSandboxes: ['bs_p1', 'bs_p2']
      }, appRef, devebotRef, pluginRefs, bridgeRefs, issueInspector, stateInspector, nameResolver});
      var config = cfgLoader.load();
      false && console.log(JSON.stringify(config, null, 2));

      // Profile configuration
      assert.deepEqual(
        lodash.get(config,"profile.default"),
        lodash.merge(
          loader(path.join(lab.getDevebotCfgDir(), 'profile.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'profile.js')),
          {}
        )
      );

      assert.deepEqual(
        lodash.get(config,"profile.mixture"),
        lodash.get(config,"profile.default")
      );

      // Sandbox configuration
      assert.deepEqual(
        lodash.get(config,"sandbox.mixture"),
        lodash.merge(
          {},
          loader(path.join(lab.getDevebotCfgDir(), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin1'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox_private1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox_private2.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_ev1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_ev2.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_bs_p1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_bs_p2.js')),
          {}
        )
      );
    });

    it('the order of listed sandbox labels is sensitive', function() {
      var cfgLoader = new ConfigLoader({options: {
        privateSandboxes: 'bs2, bs1'
      }, appRef, devebotRef, pluginRefs, bridgeRefs, issueInspector, stateInspector, nameResolver});
      var config = cfgLoader.load();

      // Profile configuration
      assert.deepEqual(
        lodash.get(config,"profile.default"),
        lodash.merge(
          loader(path.join(lab.getDevebotCfgDir(), 'profile.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'profile.js')),
          {}
        )
      );

      assert.deepEqual(
        lodash.get(config,"profile.mixture"),
        lodash.get(config,"profile.default")
      );

      // Sandbox configuration
      assert.notDeepEqual(
        lodash.get(config,"sandbox.mixture"),
        lodash.merge(
          {},
          loader(path.join(lab.getDevebotCfgDir(), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin1'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox_private1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox_private2.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_ev1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_ev2.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_bs1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_bs2.js')),
          {}
        )
      );

      assert.deepEqual(
        lodash.get(config,"sandbox.mixture"),
        lodash.merge(
          {},
          loader(path.join(lab.getDevebotCfgDir(), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin1'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox_private1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'config'), 'sandbox_private2.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_ev1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_ev2.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_bs2.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg', 'newcfg/dev'), 'sandbox_bs1.js')),
          {}
        )
      );
    });

    after(function() {
      envcloak.reset();
    });
  });

  describe('ConfigLoader.load(): change PROFILE/SANDBOX labels', function() {
    before(function() {
      envcloak.setup({
        NODE_ENV: 'test',
        LOGOLITE_FULL_LOG_MODE: 'false',
        DEVEBOT_CONFIG_PROFILE_ALIASES: 'context',
        DEVEBOT_CONFIG_SANDBOX_ALIASES: 'setting',
        DEVEBOT_CONFIG_DIR: lab.getAppCfgDir('tdd-cfg-customized-names', 'newcfg'),
        DEVEBOT_CONFIG_ENV: 'dev',
        DEVEBOT_SANDBOX: 'private1,private2,ev1,ev2'
      });
      chores.clearCache();
    });

    var appRef = {
      name: 'tdd-cfg-customized-names',
      type: 'application',
      path: lab.getAppHome('tdd-cfg-customized-names')
    };

    it('load application configuration with multiple private sandboxes', function() {
      var cfgLoader = new ConfigLoader({options: {
        privateSandboxes: ['bs1', 'bs2']
      }, appRef, devebotRef, pluginRefs, bridgeRefs, issueInspector, stateInspector, nameResolver, manifestHandler});
      var config = cfgLoader.load();
      false && console.log(JSON.stringify(config, null, 2));

      // Profile configuration
      // Profile overriden order: [devebot]/profile <- [app:default]/profile <- [app:external]/profile
      assert.deepEqual(
        lodash.get(config,"profile.default"),
        lodash.merge(
          loader(path.join(lab.getDevebotCfgDir(), 'profile.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg-customized-names', 'config'), 'context.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg-customized-names', 'newcfg/dev'), 'context.js')),
          {}
        )
      );

      assert.deepEqual(
        lodash.get(config,"profile.mixture"),
        lodash.get(config,"profile.default")
      );

      // Sandbox configuration
      // Sandbox overriden order: 
      //   [devebot]/sandbox
      //    <- [lib:plugin1]/sandbox
      //    <- [lib:plugin2]/sandbox
      //    <- [app:default]/sandbox <- [app:external]/sandbox
      assert.deepEqual(
        lodash.get(config,"sandbox.default"),
        lodash.merge({},
          loader(path.join(lab.getDevebotCfgDir(), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin1'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg-customized-names', 'config'), 'setting.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg-customized-names', 'newcfg/dev'), 'setting.js')),
          {}
        )
      );

      assert.deepEqual(
        lodash.get(config,"sandbox.mixture"),
        lodash.merge({},
          loader(path.join(lab.getDevebotCfgDir(), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin1'), 'sandbox.js')),
          loader(path.join(lab.getLibCfgDir('plugin2'), 'sandbox.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg-customized-names', 'config'), 'setting.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg-customized-names', 'config'), 'setting_private1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg-customized-names', 'config'), 'setting_private2.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg-customized-names', 'newcfg/dev'), 'setting.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg-customized-names', 'newcfg/dev'), 'setting_ev1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg-customized-names', 'newcfg/dev'), 'setting_ev2.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg-customized-names', 'newcfg/dev'), 'setting_bs1.js')),
          loader(path.join(lab.getAppCfgDir('tdd-cfg-customized-names', 'newcfg/dev'), 'setting_bs2.js')),
          {}
        )
      );
    });

    after(function() {
      envcloak.reset();
    });
  });
});
