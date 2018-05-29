'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');
var loader = Devebot.require('loader');
var debugx = Devebot.require('pinbug')('tdd:devebot:base:bootstrap');
var assert = require('chai').assert;
var expect = require('chai').expect;
var path = require('path');
var util = require('util');
var bootstrap = require('../../lib/bootstrap');
var LogConfig = require('logolite').LogConfig;
var LogTracer = require('logolite').LogTracer;
var envtool = require('logolite/envtool');
var rewire = require('rewire');

describe('tdd:devebot:base:bootstrap', function() {
  this.timeout(lab.getDefaultTimeout());

  before(function() {
    envtool.setup({
      LOGOLITE_ALWAYS_ENABLED: 'all',
      LOGOLITE_ALWAYS_MUTED: 'all'
    });
    LogConfig.reset();
  });

  describe('Prerequisite', function() {
    it('launchApplication() load configure only (not server/runner)', function() {
      var loggingStore = {};
      LogTracer.reset().setupDefaultInterceptors([{
        accumulator: loggingStore,
        mappings: [{
          allTags: [ 'constructor-begin', 'appLoader' ],
          countTo: 'appLoader'
        }, {
          allTags: [ 'devebot/kernel', 'constructor-begin' ],
          countTo: 'loadingKernel'
        }, {
          allTags: [ 'devebot/server', 'constructor-begin' ],
          countTo: 'loadingServer'
        }, {
          allTags: [ 'devebot/runner', 'constructor-begin' ],
          countTo: 'loadingRunner'
        }]
      }]);

      var app = bootstrap.launchApplication({
        appRootPath: lab.getAppHome('default')
      });

      false && console.log(loggingStore);
      assert.deepEqual(loggingStore, { appLoader: 1 });

      LogTracer.clearStringifyInterceptors();
    });
  })

  describe('replaceObjectFields()', function() {
    it('should do nothing with empty object', function() {
      assert.deepEqual(replaceObjectFields({}, DEFAULT_CONTEXT), {});
      assert.deepEqual(replaceObjectFields(null, DEFAULT_CONTEXT), null);
      assert.deepEqual(replaceObjectFields('hello', DEFAULT_CONTEXT), 'hello');
    });
    it('should replace the matched string fields only', function() {
      assert.deepEqual(
        replaceObjectFields({
          libRootPaths: [
            '/some/path/here/test/lib/plugin1',
            '/some/path/here/test/lib/plugin2',
            '/some/path/here/test/lib/plugin3'
          ],
          pluginRefs: {
            'plugin1': { name: 'plugin1', path: '/some/path/here/test/lib/plugin1/index.js' },
            'plugin2': { name: 'plugin2', path: '/some/path/here/test/lib/plugin2/index.js' },
            'plugin3': { name: 'plugin3', path: '/some/path/here/test/lib/plugin3/index.js' }
          },
          bridgeRefs: {
            'bridge1': { name: 'bridge1', path: '/some/path/here/test/lib/bridge1/index.js' },
            'bridge2': { name: 'bridge2', path: '/some/path/here/test/lib/bridge2/index.js' }
          }
        }, DEFAULT_CONTEXT),
        {
          libRootPaths: ['/test/lib/plugin1', '/test/lib/plugin2', '/test/lib/plugin3'],
          pluginRefs: {
            'plugin1': { name: 'plugin1', path: '/test/lib/plugin1/index.js' },
            'plugin2': { name: 'plugin2', path: '/test/lib/plugin2/index.js' },
            'plugin3': { name: 'plugin3', path: '/test/lib/plugin3/index.js' }
          },
          bridgeRefs: {
            'bridge1': { name: 'bridge1', path: '/test/lib/bridge1/index.js' },
            'bridge2': { name: 'bridge2', path: '/test/lib/bridge2/index.js' }
          }
        }
      );
    });
  });

  describe('require()', function() {
    var pkgs = {
      chores: '../../lib/utils/chores.js',
      loader: '../../lib/utils/loader.js',
      pinbug: '../../lib/utils/pinbug.js'
    }
    lodash.forEach([
      'bluebird', 'lodash', 'injektor', 'logolite', 'schemato'
    ], function(pkgName) {
      pkgs[pkgName] = pkgName;
    });
    it('require() returns correct exported packages', function() {
      lodash.forOwn(pkgs, function(pkgPath, pkgName) {
        assert.equal(bootstrap.require(pkgName), require(pkgPath));
      });
    });
  });

  describe('expandExtensions()', function() {
    var bootstrap = rewire('../../lib/bootstrap');
    var expandExtensions = bootstrap.__get__('expandExtensions');
    assert.isNotNull(expandExtensions);

    it('expand empty parameters', function() {
      var output = expandExtensions();
      false && console.log('expandExtensions(): ', output);
      assert.deepEqual(output, {
        libRootPaths: [],
        bridgeRefs: {},
        pluginRefs: {}
      });
    });

    it('expand empty context with a list of plugins', function() {
      var output = expandExtensions(null, [
        {
          name: 'plugin1',
          path: lab.getLibHome('plugin1')
        },
        {
          name: 'plugin2',
          path: lab.getLibHome('plugin2')
        }
      ], null);
      output = replaceObjectFields(output, DEFAULT_CONTEXT);
      false && console.log('expandExtensions(): ', output);
      if (chores.isFeatureSupported('presets')) {
        assert.deepEqual(output, {
          libRootPaths: ['/test/lib/plugin1', '/test/lib/plugin2'],
          pluginRefs: {
            '/test/lib/plugin1/index.js': {
              name: 'plugin1',
              path: '/test/lib/plugin1/index.js',
              presets: {
                "configTags": "bridge[dialect-bridge]",
                layerRootPath: '/test/lib/plugin1'
              }
            },
            '/test/lib/plugin2/index.js': {
              name: 'plugin2',
              path: '/test/lib/plugin2/index.js',
              presets: {
                "configTags": "bridge[dialect-bridge]",
                layerRootPath: '/test/lib/plugin2'
              }
            }
          },
          bridgeRefs: {
            '/test/lib/bridge1/index.js': { name: 'bridge1', path: '/test/lib/bridge1/index.js' },
            '/test/lib/bridge2/index.js': { name: 'bridge2', path: '/test/lib/bridge2/index.js' }
          }
        });
      } else {
        assert.deepEqual(output, {
          libRootPaths: ['/test/lib/plugin1', '/test/lib/plugin2'],
          pluginRefs: {
            'plugin1': { name: 'plugin1', path: '/test/lib/plugin1/index.js' },
            'plugin2': { name: 'plugin2', path: '/test/lib/plugin2/index.js' }
          },
          bridgeRefs: {
            'bridge1': { name: 'bridge1', path: '/test/lib/bridge1/index.js' },
            'bridge2': { name: 'bridge2', path: '/test/lib/bridge2/index.js' }
          }
        });
      }
    });

    it('expand empty context with a list of bridges', function() {
      var output = expandExtensions(null, [], [
        {
          name: 'bridge1',
          path: lab.getLibHome('bridge1')
        },
        {
          name: 'bridge2',
          path: lab.getLibHome('bridge2')
        }
      ]);
      output = replaceObjectFields(output, DEFAULT_CONTEXT);
      false && console.log('expandExtensions(): ', output);
      if (chores.isFeatureSupported('presets')) {
        assert.deepEqual(output, {
          libRootPaths: [],
          pluginRefs: {},
          bridgeRefs: {
            '/test/lib/bridge1/index.js': {
              name: 'bridge1',
              path: '/test/lib/bridge1/index.js'
            },
            '/test/lib/bridge2/index.js': {
              name: 'bridge2',
              path: '/test/lib/bridge2/index.js'
            }
          }
        });
      } else {
        assert.deepEqual(output, {
          libRootPaths: [],
          pluginRefs: {},
          bridgeRefs: {
            'bridge1': { name: 'bridge1', path: '/test/lib/bridge1/index.js' },
            'bridge2': { name: 'bridge2', path: '/test/lib/bridge2/index.js' }
          }
        });
      }
    });

    it('expand empty context with a list of plugins and a list of bridges', function() {
      var output = expandExtensions(null, [
        {
          name: 'plugin1',
          path: lab.getLibHome('plugin1')
        },
        {
          name: 'plugin2',
          path: lab.getLibHome('plugin2')
        },
        {
          name: 'plugin3',
          path: lab.getLibHome('plugin3')
        }
      ], [
        {
          name: 'bridge1',
          path: lab.getLibHome('bridge1')
        },
        {
          name: 'bridge2',
          path: lab.getLibHome('bridge2')
        }
      ]);
      output = replaceObjectFields(output, DEFAULT_CONTEXT);
      if (chores.isFeatureSupported('presets')) {
        assert.deepEqual(output, {
          libRootPaths: ['/test/lib/plugin1', '/test/lib/plugin2', '/test/lib/plugin3'],
          pluginRefs: {
            '/test/lib/plugin1/index.js': {
              name: 'plugin1',
              path: '/test/lib/plugin1/index.js',
              presets: {
                "configTags": "bridge[dialect-bridge]",
                layerRootPath: '/test/lib/plugin1'
              }
            },
            '/test/lib/plugin2/index.js': {
              name: 'plugin2',
              path: '/test/lib/plugin2/index.js',
              presets: {
                "configTags": "bridge[dialect-bridge]",
                layerRootPath: '/test/lib/plugin2'
              }
            },
            '/test/lib/plugin3/index.js': {
              name: 'plugin3',
              path: '/test/lib/plugin3/index.js',
              presets: {
                layerRootPath: '/test/lib/plugin3'
              }
            }
          },
          bridgeRefs: {
            '/test/lib/bridge1/index.js': {
              name: 'bridge1',
              path: '/test/lib/bridge1/index.js'
            },
            '/test/lib/bridge2/index.js': {
              name: 'bridge2',
              path: '/test/lib/bridge2/index.js'
            }
          }
        });
      } else {
        assert.deepEqual(output, {
          libRootPaths: ['/test/lib/plugin1', '/test/lib/plugin2', '/test/lib/plugin3'],
          pluginRefs: {
            'plugin1': { name: 'plugin1', path: '/test/lib/plugin1/index.js' },
            'plugin2': { name: 'plugin2', path: '/test/lib/plugin2/index.js' },
            'plugin3': { name: 'plugin3', path: '/test/lib/plugin3/index.js' }
          },
          bridgeRefs: {
            'bridge1': { name: 'bridge1', path: '/test/lib/bridge1/index.js' },
            'bridge2': { name: 'bridge2', path: '/test/lib/bridge2/index.js' }
          }
        });
      }
    });

    it('expand empty context with nested and overlap plugins', function() {
      var output = expandExtensions(null, [
        {
          name: 'sub-plugin1',
          path: lab.getLibHome('sub-plugin1')
        },
        {
          name: 'sub-plugin2',
          path: lab.getLibHome('sub-plugin2')
        }
      ]);
      output = replaceObjectFields(output, DEFAULT_CONTEXT);
      false && console.log('expandExtensions(): ', output);
      if (chores.isFeatureSupported('presets')) {
        assert.deepEqual(output, {
          libRootPaths:
            [
              '/test/lib/sub-plugin1',
              '/test/lib/plugin1',
              '/test/lib/plugin2',
              '/test/lib/sub-plugin2',
              '/test/lib/plugin3'
            ],
          pluginRefs:
            {
              '/test/lib/sub-plugin1/index.js': {
                name: 'sub-plugin1',
                path: '/test/lib/sub-plugin1/index.js',
                presets: {
                  layerRootPath: '/test/lib/sub-plugin1'
                }
              },
              '/test/lib/sub-plugin2/index.js': {
                name: 'sub-plugin2',
                path: '/test/lib/sub-plugin2/index.js',
                presets: {
                  layerRootPath: '/test/lib/sub-plugin2'
                }
              },
              '/test/lib/plugin1/index.js': {
                name: 'plugin1',
                path: '/test/lib/plugin1/index.js',
                presets: {
                  "configTags": "bridge[dialect-bridge]",
                  layerRootPath: '/test/lib/plugin1'
                }
              },
              '/test/lib/plugin2/index.js': {
                name: 'plugin2',
                path: '/test/lib/plugin2/index.js',
                presets: {
                  "configTags": "bridge[dialect-bridge]",
                  layerRootPath: '/test/lib/plugin2'
                }
              },
              '/test/lib/plugin3/index.js': {
                name: 'plugin3',
                path: '/test/lib/plugin3/index.js',
                presets: {
                  layerRootPath: '/test/lib/plugin3'
                }
              }
            },
          bridgeRefs:
          {
            '/test/lib/bridge1/index.js': {
              name: 'bridge1',
              path: '/test/lib/bridge1/index.js'
            },
            '/test/lib/bridge2/index.js': {
              name: 'bridge2',
              path: '/test/lib/bridge2/index.js'
            },
            '/test/lib/bridge3/index.js': {
              name: 'bridge3',
              path: '/test/lib/bridge3/index.js'
            }
          }
        });
      } else {
        assert.deepEqual(output, {
          libRootPaths:
            [
              '/test/lib/sub-plugin1',
              '/test/lib/plugin1',
              '/test/lib/plugin2',
              '/test/lib/sub-plugin2',
              '/test/lib/plugin3'
            ],
          pluginRefs:
            {
              'sub-plugin1': { name: 'sub-plugin1', path: '/test/lib/sub-plugin1/index.js' },
              'sub-plugin2': { name: 'sub-plugin2', path: '/test/lib/sub-plugin2/index.js' },
              plugin1: { name: 'plugin1', path: '/test/lib/plugin1/index.js' },
              plugin2: { name: 'plugin2', path: '/test/lib/plugin2/index.js' },
              plugin3: { name: 'plugin3', path: '/test/lib/plugin3/index.js' }
            },
          bridgeRefs:
            {
              bridge1: { name: 'bridge1', path: '/test/lib/bridge1/index.js' },
              bridge2: { name: 'bridge2', path: '/test/lib/bridge2/index.js' },
              bridge3: { name: 'bridge3', path: '/test/lib/bridge3/index.js' }
            }
        });
      }
    });

    it('expand empty context with complete plugins (nested and overlap plugins)', function() {
      var output = expandExtensions(null, [
        {
          name: 'sub-plugin1',
          path: lab.getLibHome('sub-plugin1')
        },
        {
          name: 'plugin1',
          path: lab.getLibHome('plugin1')
        },
        {
          name: 'plugin2',
          path: lab.getLibHome('plugin2')
        },
        {
          name: 'sub-plugin2',
          path: lab.getLibHome('sub-plugin2')
        },
        {
          name: 'plugin3',
          path: lab.getLibHome('plugin3')
        },
        {
          name: 'plugin4',
          path: lab.getLibHome('plugin4')
        }
      ], [
        {
          name: 'bridge1',
          path: lab.getLibHome('bridge1')
        },
        {
          name: 'bridge2',
          path: lab.getLibHome('bridge2')
        },
        {
          name: 'bridge3',
          path: lab.getLibHome('bridge3')
        },
        {
          name: 'bridge4',
          path: lab.getLibHome('bridge4')
        }
      ]);
      output = replaceObjectFields(output, DEFAULT_CONTEXT);
      false && console.log('expandExtensions(): ', output);
      if (chores.isFeatureSupported('presets')) {
        assert.deepEqual(output, {
          libRootPaths:
            [
              '/test/lib/sub-plugin1',
              '/test/lib/plugin1',
              '/test/lib/plugin2',
              '/test/lib/sub-plugin2',
              '/test/lib/plugin3',
              '/test/lib/plugin4'
            ],
          pluginRefs:
            {
              '/test/lib/sub-plugin1/index.js': {
                name: 'sub-plugin1',
                path: '/test/lib/sub-plugin1/index.js',
                presets: {
                  layerRootPath: '/test/lib/sub-plugin1'
                }
              },
              '/test/lib/sub-plugin2/index.js': {
                name: 'sub-plugin2',
                path: '/test/lib/sub-plugin2/index.js',
                presets: {
                  layerRootPath: '/test/lib/sub-plugin2'
                }
              },
              '/test/lib/plugin1/index.js': {
                name: 'plugin1',
                path: '/test/lib/plugin1/index.js',
                presets: {
                  "configTags": "bridge[dialect-bridge]",
                  layerRootPath: '/test/lib/plugin1'
                }
              },
              '/test/lib/plugin2/index.js': {
                name: 'plugin2',
                path: '/test/lib/plugin2/index.js',
                presets: {
                  "configTags": "bridge[dialect-bridge]",
                  layerRootPath: '/test/lib/plugin2'
                }
              },
              '/test/lib/plugin3/index.js': {
                name: 'plugin3',
                path: '/test/lib/plugin3/index.js',
                presets: {
                  layerRootPath: '/test/lib/plugin3'
                }
              },
              '/test/lib/plugin4/index.js': {
                name: 'plugin4',
                path: '/test/lib/plugin4/index.js',
                presets: {
                  layerRootPath: '/test/lib/plugin4'
                }
              }
            },
          bridgeRefs:
            {
              '/test/lib/bridge1/index.js': {
                name: 'bridge1',
                path: '/test/lib/bridge1/index.js'
              },
              '/test/lib/bridge2/index.js': {
                name: 'bridge2',
                path: '/test/lib/bridge2/index.js'
              },
              '/test/lib/bridge3/index.js': {
                name: 'bridge3',
                path: '/test/lib/bridge3/index.js'
              },
              '/test/lib/bridge4/index.js': {
                name: 'bridge4',
                path: '/test/lib/bridge4/index.js'
              }
            }
        });
      } else {
        assert.deepEqual(output, {
          libRootPaths:
            [
              '/test/lib/sub-plugin1',
              '/test/lib/plugin1',
              '/test/lib/plugin2',
              '/test/lib/sub-plugin2',
              '/test/lib/plugin3',
              '/test/lib/plugin4'
            ],
          pluginRefs:
            {
              'sub-plugin1': { name: 'sub-plugin1', path: '/test/lib/sub-plugin1/index.js' },
              plugin1: { name: 'plugin1', path: '/test/lib/plugin1/index.js' },
              plugin2: { name: 'plugin2', path: '/test/lib/plugin2/index.js' },
              'sub-plugin2': { name: 'sub-plugin2', path: '/test/lib/sub-plugin2/index.js' },
              plugin3: { name: 'plugin3', path: '/test/lib/plugin3/index.js' },
              plugin4: { name: 'plugin4', path: '/test/lib/plugin4/index.js' }
            },
          bridgeRefs:
            {
              bridge1: { name: 'bridge1', path: '/test/lib/bridge1/index.js' },
              bridge2: { name: 'bridge2', path: '/test/lib/bridge2/index.js' },
              bridge3: { name: 'bridge3', path: '/test/lib/bridge3/index.js' },
              bridge4: { name: 'bridge4', path: '/test/lib/bridge4/index.js' }
            }
        });
      }
    });
  });

  describe('launchApplication()', function() {
    var assertAppConfig = function(app) {
      var cfg = app.config;
      false && console.log('SHOW [app.config]: ', cfg);
      assert.hasAllKeys(cfg, [
        'profile', 'sandbox', 'appName', 'appInfo', 'bridgeRefs', 'pluginRefs'
      ]);
      assert.equal(cfg.appName, 'devebot-application');
      assert.deepEqual(cfg.appInfo, {
        layerware: [],
        framework: lab.getFrameworkInfo()
      });
      assert.sameDeepMembers(cfg.bridgeRefs, []);
      assert.sameDeepMembers(lodash.map(cfg.pluginRefs, item => {
        return lodash.pick(item, ['type', 'name'])
      }), [{
        type: 'application',
        name: 'devebot-application'
      },
      {
        type: 'framework',
        name: 'devebot'
      }]);
    }

    var assertAppRunner = function(app) {
      var runner = app.runner;
    }

    var assertAppServer = function(app) {
      var runner = app.runner;
    }

    beforeEach(function() {
      LogTracer.reset();
    });

    it('launch application with empty parameters', function() {
      var app = bootstrap.launchApplication();
      var cfg = replaceObjectFields(app.config);
      false && console.log('Application config: ', JSON.stringify(cfg, null, 2));
      assert.equal(cfg.appName, 'devebot-application');
      assert.deepEqual(cfg.appInfo, {
        layerware: [],
        framework: lab.getFrameworkInfo()
      });
      assert.sameDeepMembers(cfg.bridgeRefs, []);
      assert.sameDeepMembers(cfg.pluginRefs, [
        {
          "type": "framework",
          "name": "devebot",
          "path": "/devebot/index.js"
        }
      ]);
    });

    it('launch application with empty root directory (as string)', function() {
      var app = bootstrap.launchApplication(lab.getAppHome('empty'), [], []);
      assertAppConfig(app);
    });

    it('launch application with empty root directory (in context)', function() {
      var app = bootstrap.launchApplication({
        appRootPath: lab.getAppHome('empty')
      }, [], []);
      assertAppConfig(app);
      assertAppRunner(app);
      assertAppServer(app);
    });

    it('launch application with full components', function() {
      var app = lab.getApp('fullapp');
      false && console.log('fullapp app.config: ', JSON.stringify(app.config, null, 2));
      var cfg = replaceObjectFields(app.config, DEFAULT_CONTEXT);
      false && console.log('fullapp cfg: ', JSON.stringify(cfg, null, 2));
      assert.hasAllKeys(cfg, [
        'profile', 'sandbox', 'appName', 'appInfo', 'bridgeRefs', 'pluginRefs'
      ]);
      // verify appInfo
      assert.equal(cfg.appName, 'fullapp');
      assert.deepEqual(cfg.appInfo, {
        "version": "0.1.0",
        "name": "fullapp",
        "description": "Devebot Demo Application",
        "author": "devebot",
        "license": "ISC",
        "layerware": [
          {
            "version": "0.1.1",
            "name": "sub-plugin1",
            "description": "",
            "author": "devebot",
            "license": "ISC"
          },
          {
            "version": "0.1.2",
            "name": "sub-plugin2",
            "description": "",
            "author": "devebot",
            "license": "ISC"
          },
          {
            "version": "0.1.1",
            "name": "plugin1",
            "description": "",
            "author": "devebot",
            "license": "ISC"
          },
          {
            "version": "0.1.2",
            "name": "plugin2",
            "description": "",
            "author": "devebot",
            "license": "ISC"
          },
          {
            "version": "0.1.3",
            "name": "plugin3",
            "description": "",
            "author": "devebot",
            "license": "ISC"
          }
        ],
        "framework": lab.getFrameworkInfo()
      });
      // verify bridgeRefs
      assert.sameDeepMembers(cfg.bridgeRefs, [
        {
          "code": "bridge3",
          "codeInCamel": "bridge3",
          "name": "bridge3",
          "nameInCamel": "bridge3",
          "path": "/test/lib/bridge3/index.js"
        },
        {
          "code": "bridge4",
          "codeInCamel": "bridge4",
          "name": "bridge4",
          "nameInCamel": "bridge4",
          "path": "/test/lib/bridge4/index.js"
        },
        {
          "code": "bridge1",
          "codeInCamel": "bridge1",
          "name": "bridge1",
          "nameInCamel": "bridge1",
          "path": "/test/lib/bridge1/index.js"
        },
        {
          "code": "bridge2",
          "codeInCamel": "bridge2",
          "name": "bridge2",
          "nameInCamel": "bridge2",
          "path": "/test/lib/bridge2/index.js"
        },
        {
          "code": "connector1",
          "codeInCamel": "connector1",
          "name": "devebot-co-connector1",
          "nameInCamel": "devebotCoConnector1",
          "path": "/test/lib/devebot-co-connector1/bridge.js"
        },
        {
          "code": "connector2",
          "codeInCamel": "connector2",
          "name": "devebot-co-connector2",
          "nameInCamel": "devebotCoConnector2",
          "path": "/test/lib/devebot-co-connector2/bridge.js"
        }
      ]);
      // verify pluginRefs
      var expectedPluginRefs = [
        {
          "type": "application",
          "name": "fullapp",
          "path": "/test/app/fullapp/index.js"
        },
        {
          "code": "sub-plugin1",
          "codeInCamel": "subPlugin1",
          "name": "sub-plugin1",
          "nameInCamel": "subPlugin1",
          "path": "/test/lib/sub-plugin1/index.js",
          "presets": {
            "layerRootPath": '/test/lib/sub-plugin1'
          }
        },
        {
          "code": "sub-plugin2",
          "codeInCamel": "subPlugin2",
          "name": "sub-plugin2",
          "nameInCamel": "subPlugin2",
          "path": "/test/lib/sub-plugin2/index.js",
          "presets": {
            "layerRootPath": '/test/lib/sub-plugin2'
          }
        },
        {
          "code": "plugin1",
          "codeInCamel": "plugin1",
          "name": "plugin1",
          "nameInCamel": "plugin1",
          "path": "/test/lib/plugin1/index.js",
          "presets": {
            "configTags": "bridge[dialect-bridge]",
            "layerRootPath": '/test/lib/plugin1'
          }
        },
        {
          "code": "plugin2",
          "codeInCamel": "plugin2",
          "name": "plugin2",
          "nameInCamel": "plugin2",
          "path": "/test/lib/plugin2/index.js",
          "presets": {
            "configTags": "bridge[dialect-bridge]",
            "layerRootPath": '/test/lib/plugin2'
          }
        },
        {
          "code": "plugin3",
          "codeInCamel": "plugin3",
          "name": "plugin3",
          "nameInCamel": "plugin3",
          "path": "/test/lib/plugin3/index.js",
          "presets": {
            "layerRootPath": '/test/lib/plugin3'
          }
        },
        {
          "type": "framework",
          "name": "devebot",
          "path": "/devebot/index.js"
        }
      ];
      if (!chores.isFeatureSupported('presets')) {
        expectedPluginRefs = lodash.map(expectedPluginRefs, function(item) {
          return lodash.omit(item, ["presets"]);
        });
      }
      assert.sameDeepMembers(cfg.pluginRefs, expectedPluginRefs);
    });
  });

  describe('registerLayerware()', function() {
    beforeEach(function() {
      LogTracer.reset();
    });

    it('register a new plugin with empty parameters', function() {
      var pluginLauncher = bootstrap.registerLayerware();
      var pluginStore = pluginLauncher();
      false && console.log(JSON.stringify(pluginStore, null, 2));
      assert.deepEqual(pluginStore, { libRootPaths: [], bridgeRefs: {}, pluginRefs: {} });
    });

    it('register a new plugin with nested and overlap sub-plugins', function() {
      var pluginLauncher = bootstrap.registerLayerware(null, [
        {
          name: 'sub-plugin1',
          path: lab.getLibHome('sub-plugin1')
        },
        {
          name: 'sub-plugin2',
          path: lab.getLibHome('sub-plugin2')
        }
      ], []);
      var output = replaceObjectFields(pluginLauncher(), DEFAULT_CONTEXT);
      false && console.log('pluginLauncher(): ', output);
      if (chores.isFeatureSupported('presets')) {
        assert.deepEqual(output, {
          libRootPaths:
            [
              '/test/lib/sub-plugin1',
              '/test/lib/plugin1',
              '/test/lib/plugin2',
              '/test/lib/sub-plugin2',
              '/test/lib/plugin3'
            ],
          pluginRefs:
            {
              '/test/lib/sub-plugin1/index.js': {
                name: 'sub-plugin1',
                path: '/test/lib/sub-plugin1/index.js',
                presets: {
                  layerRootPath: '/test/lib/sub-plugin1'
                }
              },
              '/test/lib/sub-plugin2/index.js': {
                name: 'sub-plugin2',
                path: '/test/lib/sub-plugin2/index.js',
                presets: {
                  layerRootPath: '/test/lib/sub-plugin2'
                }
              },
              '/test/lib/plugin1/index.js': {
                name: 'plugin1',
                path: '/test/lib/plugin1/index.js',
                presets: {
                  configTags: "bridge[dialect-bridge]",
                  layerRootPath: '/test/lib/plugin1'
                }
              },
              '/test/lib/plugin2/index.js': {
                name: 'plugin2',
                path: '/test/lib/plugin2/index.js',
                presets: {
                  configTags: "bridge[dialect-bridge]",
                  layerRootPath: '/test/lib/plugin2'
                }
              },
              '/test/lib/plugin3/index.js': {
                name: 'plugin3',
                path: '/test/lib/plugin3/index.js',
                presets: {
                  layerRootPath: '/test/lib/plugin3'
                }
              }
            },
          bridgeRefs:
            {
              '/test/lib/bridge1/index.js': {
                name: 'bridge1',
                path: '/test/lib/bridge1/index.js'
              },
              '/test/lib/bridge2/index.js': {
                name: 'bridge2',
                path: '/test/lib/bridge2/index.js'
              },
              '/test/lib/bridge3/index.js': {
                name: 'bridge3',
                path: '/test/lib/bridge3/index.js'
              }
            }
        });
      } else {
        assert.deepEqual(output, {
          libRootPaths:
            [
              '/test/lib/sub-plugin1',
              '/test/lib/plugin1',
              '/test/lib/plugin2',
              '/test/lib/sub-plugin2',
              '/test/lib/plugin3'
            ],
          pluginRefs:
            {
              'sub-plugin1': { name: 'sub-plugin1', path: '/test/lib/sub-plugin1/index.js' },
              'sub-plugin2': { name: 'sub-plugin2', path: '/test/lib/sub-plugin2/index.js' },
              plugin1: { name: 'plugin1', path: '/test/lib/plugin1/index.js' },
              plugin2: { name: 'plugin2', path: '/test/lib/plugin2/index.js' },
              plugin3: { name: 'plugin3', path: '/test/lib/plugin3/index.js' }
            },
          bridgeRefs:
            {
              bridge1: { name: 'bridge1', path: '/test/lib/bridge1/index.js' },
              bridge2: { name: 'bridge2', path: '/test/lib/bridge2/index.js' },
              bridge3: { name: 'bridge3', path: '/test/lib/bridge3/index.js' }
            }
        });
      }
    });
  });

  after(function() {
    LogTracer.clearStringifyInterceptors();
    envtool.reset();
  });
});

var DEFAULT_CONTEXT = {
  replacers: [
    {
      pattern: /^(?!https).*\/(devebot|test\/lib|test\/app)\/([^\/].*)(\/?.*)/g,
      replacement: '/$1/$2$3'
    }
  ]
};

var replaceLibPath = function(p, context) {
  if (typeof p !== 'string') return p;
  context = context || DEFAULT_CONTEXT;
  context.replacers = context.replacers || [];
  for(var i=0; i<context.replacers.length; i++) {
    var replacer = context.replacers[i];
    if (p.match(replacer.pattern)) {
      return p.replace(replacer.pattern, replacer.replacement);
    }
  }
  return p;
}

var replaceObjectFields = function(obj, context) {
  var replaceFields = function(queue) {
    if (queue.length > 0) {
      var o = queue.shift();
      if (lodash.isObject(o)) {
        lodash.forEach(lodash.keys(o), function(key) {
          if (lodash.isObject(o[key])) {
            queue.push(o[key]);
            return;
          }
          if (lodash.isString(o[key])) {
            o[key] = replaceLibPath(o[key], context);
          }
        })
      }
      replaceFields(queue);
    }
  }
  obj = lodash.cloneDeep(obj);
  if (chores.isFeatureSupported('presets')) {
    if (obj && obj.bridgeRefs && !lodash.isArray(obj.bridgeRefs)) {
      obj.bridgeRefs = lodash.mapKeys(obj.bridgeRefs, function(value, key) {
        return replaceLibPath(key, context);
      });
    }
    if (obj && obj.pluginRefs && !lodash.isArray(obj.pluginRefs)) {
      obj.pluginRefs = lodash.mapKeys(obj.pluginRefs, function(value, key) {
        return replaceLibPath(key, context);
      });
    }
  }
  replaceFields([obj]);
  return obj;
}