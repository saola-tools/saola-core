'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');
var debugx = Devebot.require('pinbug')('tdd:devebot:base:bootstrap');
var assert = require('chai').assert;
var path = require('path');
var bootstrap = require(lab.getDevebotModule('bootstrap'));
var LogConfig = require('logolite').LogConfig;
var LogTracer = require('logolite').LogTracer;
var envmask = require('envmask').instance;
var rewire = require('rewire');

describe('tdd:devebot:base:bootstrap', function() {
  this.timeout(lab.getDefaultTimeout());

  before(function() {
    envmask.setup({
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
          allTags: [ chores.toFullname('devebot', 'kernel'), 'constructor-begin' ],
          countTo: 'loadingKernel'
        }, {
          allTags: [ chores.toFullname('devebot', 'server'), 'constructor-begin' ],
          countTo: 'loadingServer'
        }, {
          allTags: [ chores.toFullname('devebot', 'runner'), 'constructor-begin' ],
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
            'plugin1': { name: 'plugin1', path: '/some/path/here/test/lib/plugin1' },
            'plugin2': { name: 'plugin2', path: '/some/path/here/test/lib/plugin2' },
            'plugin3': { name: 'plugin3', path: '/some/path/here/test/lib/plugin3' }
          },
          bridgeRefs: {
            'bridge1': { name: 'bridge1', path: '/some/path/here/test/lib/bridge1' },
            'bridge2': { name: 'bridge2', path: '/some/path/here/test/lib/bridge2' }
          }
        }, DEFAULT_CONTEXT),
        {
          libRootPaths: ['/test/lib/plugin1', '/test/lib/plugin2', '/test/lib/plugin3'],
          pluginRefs: {
            'plugin1': { name: 'plugin1', path: '/test/lib/plugin1' },
            'plugin2': { name: 'plugin2', path: '/test/lib/plugin2' },
            'plugin3': { name: 'plugin3', path: '/test/lib/plugin3' }
          },
          bridgeRefs: {
            'bridge1': { name: 'bridge1', path: '/test/lib/bridge1' },
            'bridge2': { name: 'bridge2', path: '/test/lib/bridge2' }
          }
        }
      );
    });
  });

  describe('require()', function() {
    var pkgs = {
      chores: path.join(lab.getDevebotHome(), 'lib/utils/chores.js'),
      loader: path.join(lab.getDevebotHome(), 'lib/utils/loader.js'),
      pinbug: path.join(lab.getDevebotHome(), 'lib/utils/pinbug.js')
    }
    lodash.forEach([ 'injektor', 'logolite', 'schemato', 'semver' ], function(pkgName) {
      pkgs[pkgName] = pkgName;
    });
    it('require() returns correct exported packages', function() {
      lodash.forOwn(pkgs, function(pkgPath, pkgName) {
        assert.equal(bootstrap.require(pkgName), require(pkgPath));
      });
    });
  });

  describe('locatePackage()', function() {
    var bootstrap = rewire(lab.getDevebotModule('bootstrap'));
    var locatePackage = bootstrap.__get__('locatePackage');
    assert.isFunction(locatePackage);

    it('locate a valid package successfully', function() {
      var providedPkg = lab.getAppHome('locating-package-json');
      var detectedPkg = locatePackage({}, {
        name: 'locating-package-json',
        path: providedPkg
      }, 'plugin');
      assert.equal(detectedPkg, providedPkg);
    });
  });

  describe('expandExtensions()', function() {
    var bootstrap = rewire(path.join(lab.getDevebotHome(), 'lib/bootstrap'));
    var expandExtensions = bootstrap.__get__('expandExtensions');
    assert.isFunction(expandExtensions);

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
      output = replaceObjectFields(removeLoggingUtils(output), DEFAULT_CONTEXT);
      false && console.log('expandExtensions(): ', JSON.stringify(output, null, 2));
      if (chores.isUpgradeSupported('presets')) {
        assert.deepEqual(output, {
          "libRootPaths": [
            "/test/lib/plugin1",
            "/test/lib/plugin2"
          ],
          "pluginRefs": {
            "/test/lib/plugin1": {
              "name": "plugin1",
              "path": "/test/lib/plugin1",
              "presets": {
                "configTags": "bridge[dialect-bridge]"
              },
              "bridgeDepends": [
                "bridge1",
                "bridge2"
              ],
              "pluginDepends": []
            },
            "/test/lib/plugin2": {
              "name": "plugin2",
              "path": "/test/lib/plugin2",
              "presets": {
                "configTags": "bridge[dialect-bridge]"
              },
              "bridgeDepends": [
                "bridge1",
                "bridge2"
              ],
              "pluginDepends": []
            }
          },
          "bridgeRefs": {
            "/test/lib/bridge1": {
              "name": "bridge1",
              "path": "/test/lib/bridge1"
            },
            "/test/lib/bridge2": {
              "name": "bridge2",
              "path": "/test/lib/bridge2"
            }
          }
        });
      } else {
        assert.deepEqual(output, {
          libRootPaths: ['/test/lib/plugin1', '/test/lib/plugin2'],
          pluginRefs: {
            'plugin1': { name: 'plugin1', path: '/test/lib/plugin1' },
            'plugin2': { name: 'plugin2', path: '/test/lib/plugin2' }
          },
          bridgeRefs: {
            'bridge1': { name: 'bridge1', path: '/test/lib/bridge1' },
            'bridge2': { name: 'bridge2', path: '/test/lib/bridge2' }
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
      if (chores.isUpgradeSupported('presets')) {
        assert.deepEqual(output, {
          libRootPaths: [],
          pluginRefs: {},
          bridgeRefs: {
            '/test/lib/bridge1': {
              name: 'bridge1',
              path: '/test/lib/bridge1'
            },
            '/test/lib/bridge2': {
              name: 'bridge2',
              path: '/test/lib/bridge2'
            }
          }
        });
      } else {
        assert.deepEqual(output, {
          libRootPaths: [],
          pluginRefs: {},
          bridgeRefs: {
            'bridge1': { name: 'bridge1', path: '/test/lib/bridge1' },
            'bridge2': { name: 'bridge2', path: '/test/lib/bridge2' }
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
      output = replaceObjectFields(removeLoggingUtils(output), DEFAULT_CONTEXT);
      false && console.log('expandExtensions(): ', JSON.stringify(output, null, 2));
      if (chores.isUpgradeSupported('presets')) {
        assert.deepEqual(output, {
          "libRootPaths": [
            "/test/lib/plugin1",
            "/test/lib/plugin2",
            "/test/lib/plugin3"
          ],
          "pluginRefs": {
            "/test/lib/plugin1": {
              "name": "plugin1",
              "path": "/test/lib/plugin1",
              "presets": {
                "configTags": "bridge[dialect-bridge]"
              },
              "bridgeDepends": [
                "bridge1",
                "bridge2"
              ],
              "pluginDepends": []
            },
            "/test/lib/plugin2": {
              "name": "plugin2",
              "path": "/test/lib/plugin2",
              "presets": {
                "configTags": "bridge[dialect-bridge]"
              },
              "bridgeDepends": [
                "bridge1",
                "bridge2"
              ],
              "pluginDepends": []
            },
            "/test/lib/plugin3": {
              "name": "plugin3",
              "path": "/test/lib/plugin3",
              "presets": {},
              "bridgeDepends": [],
              "pluginDepends": []
            }
          },
          "bridgeRefs": {
            "/test/lib/bridge1": {
              "name": "bridge1",
              "path": "/test/lib/bridge1"
            },
            "/test/lib/bridge2": {
              "name": "bridge2",
              "path": "/test/lib/bridge2"
            }
          }
        });
      } else {
        assert.deepEqual(output, {
          libRootPaths: ['/test/lib/plugin1', '/test/lib/plugin2', '/test/lib/plugin3'],
          pluginRefs: {
            'plugin1': { name: 'plugin1', path: '/test/lib/plugin1' },
            'plugin2': { name: 'plugin2', path: '/test/lib/plugin2' },
            'plugin3': { name: 'plugin3', path: '/test/lib/plugin3' }
          },
          bridgeRefs: {
            'bridge1': { name: 'bridge1', path: '/test/lib/bridge1' },
            'bridge2': { name: 'bridge2', path: '/test/lib/bridge2' }
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
      output = replaceObjectFields(removeLoggingUtils(output), DEFAULT_CONTEXT);
      false && console.log('expandExtensions(): ', JSON.stringify(output, null, 2));
      if (chores.isUpgradeSupported('presets')) {
        assert.deepEqual(output, {
          "libRootPaths": [
            "/test/lib/sub-plugin1",
            "/test/lib/plugin1",
            "/test/lib/plugin2",
            "/test/lib/sub-plugin2",
            "/test/lib/plugin3"
          ],
          "pluginRefs": {
            "/test/lib/sub-plugin1": {
              "name": "sub-plugin1",
              "path": "/test/lib/sub-plugin1",
              "presets": {},
              "bridgeDepends": [
                "bridge1",
                "bridge2"
              ],
              "pluginDepends": [
                "plugin1",
                "plugin2"
              ]
            },
            "/test/lib/sub-plugin2": {
              "name": "sub-plugin2",
              "path": "/test/lib/sub-plugin2",
              "presets": {},
              "bridgeDepends": [
                "bridge2",
                "bridge3"
              ],
              "pluginDepends": [
                "plugin2",
                "plugin3"
              ]
            },
            "/test/lib/plugin1": {
              "name": "plugin1",
              "path": "/test/lib/plugin1",
              "presets": {
                "configTags": "bridge[dialect-bridge]"
              },
              "bridgeDepends": [
                "bridge1",
                "bridge2"
              ],
              "pluginDepends": []
            },
            "/test/lib/plugin2": {
              "name": "plugin2",
              "path": "/test/lib/plugin2",
              "presets": {
                "configTags": "bridge[dialect-bridge]"
              },
              "bridgeDepends": [
                "bridge1",
                "bridge2"
              ],
              "pluginDepends": []
            },
            "/test/lib/plugin3": {
              "name": "plugin3",
              "path": "/test/lib/plugin3",
              "presets": {},
              "bridgeDepends": [],
              "pluginDepends": []
            }
          },
          "bridgeRefs": {
            "/test/lib/bridge1": {
              "name": "bridge1",
              "path": "/test/lib/bridge1"
            },
            "/test/lib/bridge2": {
              "name": "bridge2",
              "path": "/test/lib/bridge2"
            },
            "/test/lib/bridge3": {
              "name": "bridge3",
              "path": "/test/lib/bridge3"
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
              'sub-plugin1': { name: 'sub-plugin1', path: '/test/lib/sub-plugin1' },
              'sub-plugin2': { name: 'sub-plugin2', path: '/test/lib/sub-plugin2' },
              plugin1: { name: 'plugin1', path: '/test/lib/plugin1' },
              plugin2: { name: 'plugin2', path: '/test/lib/plugin2' },
              plugin3: { name: 'plugin3', path: '/test/lib/plugin3' }
            },
          bridgeRefs:
            {
              bridge1: { name: 'bridge1', path: '/test/lib/bridge1' },
              bridge2: { name: 'bridge2', path: '/test/lib/bridge2' },
              bridge3: { name: 'bridge3', path: '/test/lib/bridge3' }
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
      output = replaceObjectFields(removeLoggingUtils(output), DEFAULT_CONTEXT);
      false && console.log('expandExtensions(): ', JSON.stringify(output, null, 2));
      if (chores.isUpgradeSupported('presets')) {
        assert.deepEqual(output, {
          "libRootPaths": [
            "/test/lib/sub-plugin1",
            "/test/lib/plugin1",
            "/test/lib/plugin2",
            "/test/lib/sub-plugin2",
            "/test/lib/plugin3",
            "/test/lib/plugin4"
          ],
          "pluginRefs": {
            "/test/lib/sub-plugin1": {
              "name": "sub-plugin1",
              "path": "/test/lib/sub-plugin1",
              "presets": {},
              "bridgeDepends": [
                "bridge1",
                "bridge2"
              ],
              "pluginDepends": [
                "plugin1",
                "plugin2"
              ]
            },
            "/test/lib/plugin1": {
              "name": "plugin1",
              "path": "/test/lib/plugin1",
              "presets": {
                "configTags": "bridge[dialect-bridge]"
              },
              "bridgeDepends": [
                "bridge1",
                "bridge2"
              ],
              "pluginDepends": []
            },
            "/test/lib/plugin2": {
              "name": "plugin2",
              "path": "/test/lib/plugin2",
              "presets": {
                "configTags": "bridge[dialect-bridge]"
              },
              "bridgeDepends": [
                "bridge1",
                "bridge2"
              ],
              "pluginDepends": []
            },
            "/test/lib/sub-plugin2": {
              "name": "sub-plugin2",
              "path": "/test/lib/sub-plugin2",
              "presets": {},
              "bridgeDepends": [
                "bridge2",
                "bridge3"
              ],
              "pluginDepends": [
                "plugin2",
                "plugin3"
              ]
            },
            "/test/lib/plugin3": {
              "name": "plugin3",
              "path": "/test/lib/plugin3",
              "presets": {},
              "bridgeDepends": [],
              "pluginDepends": []
            },
            "/test/lib/plugin4": {
              "name": "plugin4",
              "path": "/test/lib/plugin4",
              "presets": {},
              "bridgeDepends": [],
              "pluginDepends": []
            }
          },
          "bridgeRefs": {
            "/test/lib/bridge1": {
              "name": "bridge1",
              "path": "/test/lib/bridge1"
            },
            "/test/lib/bridge2": {
              "name": "bridge2",
              "path": "/test/lib/bridge2"
            },
            "/test/lib/bridge3": {
              "name": "bridge3",
              "path": "/test/lib/bridge3"
            },
            "/test/lib/bridge4": {
              "name": "bridge4",
              "path": "/test/lib/bridge4"
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
              'sub-plugin1': { name: 'sub-plugin1', path: '/test/lib/sub-plugin1' },
              plugin1: { name: 'plugin1', path: '/test/lib/plugin1' },
              plugin2: { name: 'plugin2', path: '/test/lib/plugin2' },
              'sub-plugin2': { name: 'sub-plugin2', path: '/test/lib/sub-plugin2' },
              plugin3: { name: 'plugin3', path: '/test/lib/plugin3' },
              plugin4: { name: 'plugin4', path: '/test/lib/plugin4' }
            },
          bridgeRefs:
            {
              bridge1: { name: 'bridge1', path: '/test/lib/bridge1' },
              bridge2: { name: 'bridge2', path: '/test/lib/bridge2' },
              bridge3: { name: 'bridge3', path: '/test/lib/bridge3' },
              bridge4: { name: 'bridge4', path: '/test/lib/bridge4' }
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
        'profile', 'sandbox', 'texture', 'appName', 'appInfo', 'bridgeRefs', 'pluginRefs'
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
          "path": "/devebot"
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
        'profile', 'sandbox', 'texture', 'appName', 'appInfo', 'bridgeRefs', 'pluginRefs'
      ]);
      // verify appInfo
      assert.equal(cfg.appName, 'fullapp');
      assert.deepEqual(cfg.appInfo, {
        "version": "0.1.0",
        "name": "fullapp",
        "description": "Devebot Demo Application",
        "main": "index.js",
        "author": "devebot",
        "license": "ISC",
        "layerware": [
          {
            "version": "0.1.1",
            "name": "sub-plugin1",
            "description": "",
            "main": "index.js",
            "author": "devebot",
            "license": "ISC"
          },
          {
            "version": "0.1.2",
            "name": "sub-plugin2",
            "description": "",
            "main": "index.js",
            "author": "devebot",
            "license": "ISC"
          },
          {
            "version": "0.1.1",
            "name": "plugin1",
            "description": "",
            "main": "index.js",
            "author": "devebot",
            "license": "ISC"
          },
          {
            "version": "0.1.2",
            "name": "plugin2",
            "description": "",
            "main": "index.js",
            "author": "devebot",
            "license": "ISC"
          },
          {
            "version": "0.1.3",
            "name": "plugin3",
            "description": "",
            "main": "index.js",
            "author": "devebot",
            "license": "ISC"
          }
        ],
        "framework": lab.getFrameworkInfo()
      });
      // verify bridgeRefs
      assert.sameDeepMembers(cfg.bridgeRefs, [
        {
          "type": "bridge",
          "name": "bridge3",
          "path": "/test/lib/bridge3",
          "code": "bridge3",
          "codeInCamel": "bridge3",
          "nameInCamel": "bridge3"
        },
        {
          "type": "bridge",
          "name": "bridge4",
          "path": "/test/lib/bridge4",
          "code": "bridge4",
          "codeInCamel": "bridge4",
          "nameInCamel": "bridge4"
        },
        {
          "type": "bridge",
          "name": "devebot-co-connector1",
          "path": "/test/lib/devebot-co-connector1",
          "code": "connector1",
          "codeInCamel": "connector1",
          "nameInCamel": "devebotCoConnector1"
        },
        {
          "type": "bridge",
          "name": "devebot-co-connector2",
          "path": "/test/lib/devebot-co-connector2",
          "code": "connector2",
          "codeInCamel": "connector2",
          "nameInCamel": "devebotCoConnector2"
        },
        {
          "type": "bridge",
          "name": "bridge1",
          "path": "/test/lib/bridge1",
          "code": "bridge1",
          "codeInCamel": "bridge1",
          "nameInCamel": "bridge1"
        },
        {
          "type": "bridge",
          "name": "bridge2",
          "path": "/test/lib/bridge2",
          "code": "bridge2",
          "codeInCamel": "bridge2",
          "nameInCamel": "bridge2"
        }
      ]);
      // verify pluginRefs
      var expectedPluginRefs = [
        {
          "type": "application",
          "name": "fullapp",
          "path": "/test/app/fullapp"
        },
        {
          "type": "plugin",
          "name": "sub-plugin1",
          "path": "/test/lib/sub-plugin1",
          "presets": {},
          "bridgeDepends": [
            "bridge1",
            "bridge2"
          ],
          "pluginDepends": [
            "plugin1",
            "plugin2"
          ],
          "code": "sub-plugin1",
          "codeInCamel": "subPlugin1",
          "nameInCamel": "subPlugin1"
        },
        {
          "type": "plugin",
          "name": "sub-plugin2",
          "path": "/test/lib/sub-plugin2",
          "presets": {},
          "bridgeDepends": [
            "bridge2",
            "bridge3"
          ],
          "pluginDepends": [
            "plugin2",
            "plugin3"
          ],
          "code": "sub-plugin2",
          "codeInCamel": "subPlugin2",
          "nameInCamel": "subPlugin2"
        },
        {
          "type": "plugin",
          "name": "plugin1",
          "path": "/test/lib/plugin1",
          "presets": {
            "configTags": "bridge[dialect-bridge]"
          },
          "bridgeDepends": [
            "bridge1",
            "bridge2"
          ],
          "pluginDepends": [],
          "code": "plugin1",
          "codeInCamel": "plugin1",
          "nameInCamel": "plugin1"
        },
        {
          "type": "plugin",
          "name": "plugin2",
          "path": "/test/lib/plugin2",
          "presets": {
            "configTags": "bridge[dialect-bridge]"
          },
          "bridgeDepends": [
            "bridge1",
            "bridge2"
          ],
          "pluginDepends": [],
          "code": "plugin2",
          "codeInCamel": "plugin2",
          "nameInCamel": "plugin2"
        },
        {
          "type": "plugin",
          "name": "plugin3",
          "path": "/test/lib/plugin3",
          "presets": {},
          "bridgeDepends": [],
          "pluginDepends": [],
          "code": "plugin3",
          "codeInCamel": "plugin3",
          "nameInCamel": "plugin3"
        },
        {
          "type": "framework",
          "name": "devebot",
          "path": "/devebot"
        }
      ];
      if (!chores.isUpgradeSupported('presets')) {
        expectedPluginRefs = lodash.map(expectedPluginRefs, function(item) {
          return lodash.omit(item, ["presets", "bridgeDepends", "pluginDepends"]);
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
      var pluginStore = removeLoggingUtils(pluginLauncher());
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
      var output = replaceObjectFields(removeLoggingUtils(pluginLauncher()), DEFAULT_CONTEXT);
      false && console.log('pluginLauncher(): ', JSON.stringify(output, null, 2));
      if (chores.isUpgradeSupported('presets')) {
        assert.deepEqual(output, {
          "libRootPaths": [
            "/test/lib/sub-plugin1",
            "/test/lib/plugin1",
            "/test/lib/plugin2",
            "/test/lib/sub-plugin2",
            "/test/lib/plugin3"
          ],
          "pluginRefs": {
            "/test/lib/sub-plugin1": {
              "name": "sub-plugin1",
              "path": "/test/lib/sub-plugin1",
              "presets": {},
              "bridgeDepends": [
                "bridge1",
                "bridge2"
              ],
              "pluginDepends": [
                "plugin1",
                "plugin2"
              ]
            },
            "/test/lib/sub-plugin2": {
              "name": "sub-plugin2",
              "path": "/test/lib/sub-plugin2",
              "presets": {},
              "bridgeDepends": [
                "bridge2",
                "bridge3"
              ],
              "pluginDepends": [
                "plugin2",
                "plugin3"
              ]
            },
            "/test/lib/plugin1": {
              "name": "plugin1",
              "path": "/test/lib/plugin1",
              "presets": {
                "configTags": "bridge[dialect-bridge]"
              },
              "bridgeDepends": [
                "bridge1",
                "bridge2"
              ],
              "pluginDepends": []
            },
            "/test/lib/plugin2": {
              "name": "plugin2",
              "path": "/test/lib/plugin2",
              "presets": {
                "configTags": "bridge[dialect-bridge]"
              },
              "bridgeDepends": [
                "bridge1",
                "bridge2"
              ],
              "pluginDepends": []
            },
            "/test/lib/plugin3": {
              "name": "plugin3",
              "path": "/test/lib/plugin3",
              "presets": {},
              "bridgeDepends": [],
              "pluginDepends": []
            }
          },
          "bridgeRefs": {
            "/test/lib/bridge1": {
              "name": "bridge1",
              "path": "/test/lib/bridge1"
            },
            "/test/lib/bridge2": {
              "name": "bridge2",
              "path": "/test/lib/bridge2"
            },
            "/test/lib/bridge3": {
              "name": "bridge3",
              "path": "/test/lib/bridge3"
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
              'sub-plugin1': { name: 'sub-plugin1', path: '/test/lib/sub-plugin1' },
              'sub-plugin2': { name: 'sub-plugin2', path: '/test/lib/sub-plugin2' },
              plugin1: { name: 'plugin1', path: '/test/lib/plugin1' },
              plugin2: { name: 'plugin2', path: '/test/lib/plugin2' },
              plugin3: { name: 'plugin3', path: '/test/lib/plugin3' }
            },
          bridgeRefs:
            {
              bridge1: { name: 'bridge1', path: '/test/lib/bridge1' },
              bridge2: { name: 'bridge2', path: '/test/lib/bridge2' },
              bridge3: { name: 'bridge3', path: '/test/lib/bridge3' }
            }
        });
      }
    });
  });

  describe('loadManifest()', function() {
    var bootstrap = rewire(lab.getDevebotModule('bootstrap'));
    var loadManifest = bootstrap.__get__('loadManifest');
    assert.isFunction(loadManifest);

    it('load manifest of modules properly', function() {
      var manifest = loadManifest(lab.getAppHome('setting-with-metadata'));
      assert.isObject(lodash.get(manifest, ['sandbox', 'migration']));
      assert.isObject(lodash.get(manifest, ['sandbox', 'validation', 'schema']));
      assert.isFunction(lodash.get(manifest, ['sandbox', 'validation', 'checkConstraints']));
    });

    it('return null if manifest not found', function() {
      var manifest = loadManifest(lab.getAppHome('plugin-reference-alias'));
      assert.isNull(manifest);
    });
  });

  after(function() {
    LogTracer.clearStringifyInterceptors();
    envmask.reset();
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
  var output = p;
  context = context || DEFAULT_CONTEXT;
  context.replacers = context.replacers || [];
  for(var i=0; i<context.replacers.length; i++) {
    var replacer = context.replacers[i];
    if (p.match(replacer.pattern)) {
      output = p.replace(replacer.pattern, replacer.replacement);
      break;
    }
  }
  output = output.replace(/^\/devebot\/devebot/g, '/devebot');
  output = output.replace(/^\/devebot-[0-9].*/g, '/devebot'); // folder /devebot-0.2.1
  return output;
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
  if (chores.isUpgradeSupported('presets')) {
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

var removeLoggingUtils = function(config) {
  return lodash.omit(config, ['logger', 'tracer']);
}
