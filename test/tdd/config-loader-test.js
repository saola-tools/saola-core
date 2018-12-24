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
var LogAdapter = require('logolite').LogAdapter;
var LogTracer = require('logolite').LogTracer;
var envmask = require('envmask').instance;
var envbox = require(lab.getDevebotModule('utils/envbox'));
var rewire = require('rewire');
var sinon = require('sinon');

describe('tdd:devebot:core:config-loader', function() {

  var issueInspector = lab.getIssueInspector();
  var stateInspector = lab.getStateInspector();

  var CTX = {
    L: LogAdapter.getLogger(),
    T: LogTracer.ROOT,
    issueInspector,
    CONFIG_PROFILE_NAME: 'profile',
    CONFIG_SANDBOX_NAME: 'sandbox'
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
      path: lab.getLibHome('plugin1')
    },
    "plugin2": {
      name: 'plugin2',
      path: lab.getLibHome('plugin2')
    }
  };

  var bridgeRefs = {};

  var nameResolver = new NameResolver({
    issueInspector,
    pluginRefs: lodash.values(pluginRefs),
    bridgeRefs: lodash.values(bridgeRefs)
  });

  describe('transformConfig(): standardizing loaded configuration data', function() {
    var NameResolver = rewire(lab.getDevebotModule('backbone/name-resolver'));
    var extractAliasNames = NameResolver.__get__('extractAliasNames');
    var buildAbsoluteAliasMap = NameResolver.__get__('buildAbsoluteAliasMap');
    var buildRelativeAliasMap = NameResolver.__get__('buildRelativeAliasMap');
    var ConfigLoader = rewire(lab.getDevebotModule('backbone/config-loader'));
    var applyAliasMap = ConfigLoader.__get__('applyAliasMap');
    var doAliasMap = ConfigLoader.__get__('doAliasMap');
    var transformConfig = ConfigLoader.__get__('transformConfig');

    it('should transform relative names into default full names', function() {
      if (!chores.isUpgradeSupported(['bridge-full-ref', 'standardizing-config'])) {
        this.skip();
        return;
      }

      var originalCfg = {
        bridges: {
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
        bridges: {
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
      if (!chores.isUpgradeSupported(['bridge-full-ref', 'standardizing-config'])) {
        this.skip();
        return;
      }

      var originalCfg = {
        bridges: {
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
        bridges: {
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
    var ConfigLoader = rewire(lab.getDevebotModule('backbone/config-loader'));
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
            "something": "sub-bridge1"
          },
        },
        "/test/lib/sub-bridge2": {
          "name": "sub-bridge2",
          "type": "bridge",
          "path": "/test/lib/sub-bridge2",
          "version": "0.1.2",
          "manifest": {
            "something": "sub-bridge2"
          },
        },
        "/test/lib/devebot-co-vps": {
          "name": "devebot-co-vps",
          "type": "bridge",
          "path": "/test/lib/devebot-co-vps",
          "version": "0.1.3",
          "manifest": {
            "something": "devebot-co-vps"
          },
        }
      }
      var expected = {
        "sub-bridge1": {
          "version": "0.1.1",
          "manifest": {
            "something": "sub-bridge1"
          },
        },
        "sub-bridge2": {
          "version": "0.1.2",
          "manifest": {
            "something": "sub-bridge2"
          },
        },
        "devebot-co-vps": {
          "version": "0.1.3",
          "manifest": {
            "something": "devebot-co-vps"
          },
        },
      }
      assert.deepEqual(extractConfigManifest(ctx, bridgeRefs), expected);
    });

    it('return the correct configManifest with normal pluginRefs', function() {
      var pluginRefs = {
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
            "something": "sub-plugin1"
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
            "something": "sub-plugin2"
          },
        }
      }
      var expected = {
        "sub-plugin1": {
          "version": "0.1.1",
          "manifest": {
            "something": "sub-plugin1"
          },
        },
        "sub-plugin2": {
          "version": "0.1.2",
          "manifest": {
            "something": "sub-plugin2"
          },
        },
      }
      assert.deepEqual(extractConfigManifest(ctx, pluginRefs), expected);
    });
  });

  describe('modernizeConfig(): upgrade the old configuration to current version', function() {
    var ConfigLoader = rewire(lab.getDevebotModule('backbone/config-loader'));
    var modernizeConfig = ConfigLoader.__get__('modernizeConfig');
    var nameResolver = lab.getNameResolver(['simple-plugin'], ['simple-bridge']);
    var loggingFactory = lab.createLoggingFactoryMock();
    var L = loggingFactory.getLogger();
    var T = loggingFactory.getTracer();

    var moduleInfo = { name: 'example', type: 'application', presets: {} }

    beforeEach(function() {
      loggingFactory.resetHistory();
    })

    it('do nothing if manifests is empty or not found', function() {
      var configType = 'sandbox';
      var configData = {};
      var result = modernizeConfig({L, T, nameResolver}, configType, configData, moduleInfo);
      assert.deepEqual(result, configData);
    });

    it('keep configData unchange if __metadata__ not found', function() {
      var configType = 'sandbox';
      var configData = {
        plugins: {
          "subPlugin1": {
            host: "localhost",
            port: 17721,
          },
        },
        bridges: {
          "bridge1": {
            "subPlugin1": {
              "connector": {
                "refName": "subPlugin1/bridge1#connector",
                "refPath": "sandbox -> bridges -> bridge1 -> subPlugin1 -> connector",
                "refType": "dialect",
              }
            }
          },
        }
      };
      var pluginTransform = sinon.stub().callsFake(function(source) {
        return { "httpserver": source }
      });
      var pluginManifests = {
        "subPlugin1": {
          "version": "0.1.1",
          "manifest": {
            "sandbox": {
              "migration": {
                "0.1.0_0.1.1": {
                  "from": "0.1.0",
                  "to": "0.1.1",
                  "transform": pluginTransform
                }
              }
            }
          }
        },
      }
      var bridgeTransform = sinon.stub().callsFake(function(source) {
        return {
          name: source.refName,
          path: source.refPath
        }
      });
      var bridgeManifests = {
        "bridge1": {
          "version": "0.1.1",
          "manifest": {
            "migration": {
              "latest": {
                "from": "0.1.0",
                "to": "0.1.1",
                "transform": bridgeTransform
              }
            }
          }
        },
      }

      var result = modernizeConfig({L, T, nameResolver}, configType, configData, moduleInfo, bridgeManifests, pluginManifests);

      false && console.log('modernizeConfig(): %s', JSON.stringify(result, null, 2));

      var expected = {
        plugins: {
          "subPlugin1": {
            host: "localhost",
            port: 17721,
          },
        },
        bridges: {
          "bridge1": {
            "subPlugin1": {
              "connector": {
                "refName": "subPlugin1/bridge1#connector",
                "refPath": "sandbox -> bridges -> bridge1 -> subPlugin1 -> connector",
                "refType": "dialect",
              }
            }
          },
        }
      }

      assert.deepEqual(result, expected);
      assert.isFalse(pluginTransform.called);
      assert.isFalse(bridgeTransform.called);
    });

    it('upgrade the configuration based on manifests', function() {
      var configType = 'sandbox';
      var configData = {
        plugins: {
          "subPlugin1": {
            host: "localhost",
            port: 17721,
            "__metadata__": {
              "version": "0.1.0"
            },
          },
          "subPlugin2": {
            host: "localhost",
            port: 17722,
            "__metadata__": {
              "version": "0.1.0"
            },
          },
        },
        bridges: {
          "bridge1": {
            "subPlugin1": {
              "connector": {
                "refName": "subPlugin1/bridge1#connector",
                "refPath": "sandbox -> bridges -> bridge1 -> subPlugin1 -> connector",
                "refType": "dialect",
                "__metadata__": {
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
                "__metadata__": {
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
                "__metadata__": {
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
            "sandbox": {
              "migration": {
                "0.1.0_0.1.1": {
                  "from": "0.1.0",
                  "to": "0.1.1",
                  "transform": subPlugin1Transform
                }
              }
            }
          }
        },
        "subPlugin2": {
          "version": "0.1.2",
          "manifest": {
            "sandbox": {
              "migration": {
                "0.1.0_0.1.2": {
                  "from": "0.1.0",
                  "to": "0.1.2",
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
            "migration": {
              "latest": {
                "from": "0.1.0",
                "to": "0.1.1",
                "transform": bridgeTransformer
              }
            }
          }
        },
        "bridge2": {
          "version": "0.1.2",
          "manifest": {
            "migration": {
              "latest": {
                "from": "0.1.1",
                "to": "0.1.2",
                "transform": bridgeTransformer
              }
            }
          }
        },
        "bridge4": {
          "version": "0.1.4",
          "manifest": {
            "migration": {
              "latest": {
                "from": "0.1.2",
                "to": "0.1.4",
                "transform": bridgeTransformer
              }
            }
          }
        },
      }

      var result = modernizeConfig({L, T, nameResolver}, configType, configData, moduleInfo, bridgeManifests, pluginManifests);

      false && console.log('modernizeConfig(): %s', JSON.stringify(result, null, 2));

      var expected = {
        plugins: {
          "subPlugin1": {
            "httpserver": {
              host: "localhost",
              port: 17721,
            },
            "__metadata__": {
              "version": "0.1.1"
            },
          },
          "subPlugin2": {
            "webservice": {
              host: "localhost",
              port: 17722,
            },
            "__metadata__": {
              "version": "0.1.2"
            },
          },
        },
        bridges: {
          "bridge1": {
            "subPlugin1": {
              "connector": {
                "name": "subPlugin1/bridge1#connector",
                "path": "sandbox -> bridges -> bridge1 -> subPlugin1 -> connector",
                "__metadata__": {
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
                "__metadata__": {
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
                "__metadata__": {
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

  describe('ConfigLoader.load(): default configuration (without profile & sandbox)', function() {
    it('load configuration of nothing (empty loader)', function() {
      // appName: null, appOptions: null, appRootDir: null, libRootDirs: null
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
      // appName: empty-app, appOptions: null, appRootDir: null, libRootDirs: [...]
      var cfgLoader = new ConfigLoader({appName: 'empty-app', devebotRef, pluginRefs, bridgeRefs, issueInspector, stateInspector, nameResolver});
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
      var cfgLoader = new ConfigLoader({appName: 'app', appRef, devebotRef, pluginRefs, bridgeRefs, issueInspector, stateInspector, nameResolver});
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
      envmask.setup({
        NODE_ENV: 'test',
        DEVEBOT_CONFIG_DIR: lab.getAppCfgDir('tdd-cfg', 'newcfg'),
        DEVEBOT_CONFIG_ENV: 'dev'
      });
    });

    it('load application configuration (without customized profile, sandbox)', function() {
      var cfgLoader = new ConfigLoader({appName: 'app', appRef, devebotRef, pluginRefs, bridgeRefs, issueInspector, stateInspector, nameResolver});
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
      envmask.reset();
    });
  });

  describe('ConfigLoader.load(): private sandbox configurations', function() {
    before(function() {
      envmask.setup({
        NODE_ENV: 'test',
        DEVEBOT_CONFIG_DIR: lab.getAppCfgDir('tdd-cfg', 'newcfg'),
        DEVEBOT_CONFIG_ENV: 'dev',
        DEVEBOT_SANDBOX: 'private1,private2,ev1,ev2'
      });
    });

    it('load application configuration (without private sandboxes)', function() {
      var cfgLoader = new ConfigLoader({appName: 'app', appRef, devebotRef, pluginRefs, bridgeRefs, issueInspector, stateInspector, nameResolver});
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
      var cfgLoader = new ConfigLoader({appName: 'app', appOptions: {
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
      var cfgLoader = new ConfigLoader({appName: 'app', appOptions: {
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
      var cfgLoader = new ConfigLoader({appName: 'app', appOptions: {
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
      var cfgLoader = new ConfigLoader({appName: 'app', appOptions: {
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
      envmask.reset();
    });
  });

  describe('convertPreciseConfig(): bridge configure transformation', function() {
    before(function() {
      envmask.setup({
        NODE_ENV: 'test',
        DEVEBOT_CONFIG_DIR: lab.getAppCfgDir('tdd-cfg', 'newcfg'),
        DEVEBOT_CONFIG_ENV: 'dev'
      });
    });

    var ConfigLoader = rewire(lab.getDevebotModule('backbone/config-loader'));
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
      envmask.reset();
    });
  });

  describe('ConfigLoader.load(): change PROFILE/SANDBOX labels', function() {
    before(function() {
      envmask.setup({
        NODE_ENV: 'test',
        DEVEBOT_CONFIG_PROFILE_ALIASES: 'context',
        DEVEBOT_CONFIG_SANDBOX_ALIASES: 'setting',
        DEVEBOT_CONFIG_DIR: lab.getAppCfgDir('tdd-cfg-customized-names', 'newcfg'),
        DEVEBOT_CONFIG_ENV: 'dev',
        DEVEBOT_SANDBOX: 'private1,private2,ev1,ev2'
      });
      envbox.clearCache();
    });

    var appRef = {
      name: 'tdd-cfg-customized-names',
      type: 'application',
      path: lab.getAppHome('tdd-cfg-customized-names')
    };

    it('load application configuration with multiple private sandboxes', function() {
      var cfgLoader = new ConfigLoader({appName: 'app', appOptions: {
        privateSandboxes: ['bs1', 'bs2']
      }, appRef, devebotRef, pluginRefs, bridgeRefs, issueInspector, stateInspector, nameResolver});
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
      envmask.reset();
    });
  });
});
