'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var lodash = Devebot.require('lodash');
var chores = Devebot.require('chores');
var debugx = Devebot.require('pinbug')('tdd:devebot:core:plugin-loader');
var assert = require('chai').assert;
var path = require('path');
var util = require('util');
var LogConfig = require('logolite').LogConfig;
var LogTracer = require('logolite').LogTracer;
var envmask = require('envmask').instance;

describe('tdd:devebot:core:plugin-loader', function() {
  this.timeout(lab.getDefaultTimeout());

  var issueInspector = lab.getIssueInspector();

  before(function() {
    envmask.setup({
      LOGOLITE_ALWAYS_ENABLED: 'all',
      LOGOLITE_ALWAYS_MUTED: 'all'
    });
    LogConfig.reset();
  });

  describe('loadRoutines()', function() {
    it('load routines from empty application', function() {
      var pluginLoader = lab.createPluginLoader();
      var routineMap = {};
      pluginLoader.loadRoutines(routineMap);
      false && console.log('routineMap: ', JSON.stringify(routineMap, null, 2));
      assert.deepEqual(routineMap, {});
    });
    it('load routines from simplest application', function() {
      var pluginLoader = lab.createPluginLoader('simple');
      var originMap = {};
      pluginLoader.loadRoutines(originMap);
      false && console.log('routineMap: ', JSON.stringify(originMap, null, 2));
      var routineMap = lab.simplifyRoutines(originMap);
      false && console.log('routineMap: ', JSON.stringify(routineMap, null, 2));
      var expectedMap = {};
      expectedMap[chores.toFullname("devebot", "applica-info")] = {
        "crateScope": "devebot",
        "name": "applica-info",
        "object": {
          "info": {
            "alias": "app-info",
            "description": "[String]",
            "options": []
          },
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname("devebot", "logger-info")] = {
        "crateScope": "devebot",
        "name": "logger-info",
        "object": {
          "info": {
            "alias": "log-info",
            "description": "[String]",
            "options": []
          },
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname("devebot", "logger-reset")] = {
        "crateScope": "devebot",
        "name": "logger-reset",
        "object": {
          "info": {
            "alias": "log-reset",
            "description": "[String]",
            "options": []
          },
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname("devebot", "logger-set")] = {
        "crateScope": "devebot",
        "name": "logger-set",
        "object": {
          "info": {
            "alias": "log-set",
            "description": "[String]",
            "options": [
              {
                "abbr": "t",
                "name": "transports",
                "description": "[String]",
                "required": false
              },
              {
                "abbr": "e",
                "name": "enabled",
                "description": "[String]",
                "required": false
              },
              {
                "abbr": "l",
                "name": "level",
                "description": "[String]",
                "required": false
              }
            ]
          },
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname("devebot", "sandbox-info")] = {
        "crateScope": "devebot",
        "name": "sandbox-info",
        "object": {
          "info": {
            "alias": "sb-info",
            "description": "[String]",
            "options": []
          },
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname("devebot", "system-info")] = {
        "crateScope": "devebot",
        "name": "system-info",
        "object": {
          "info": {
            "alias": "sys-info",
            "description": "[String]",
            "options": []
          },
          "handler": "[Function]"
        }
      };
      assert.deepEqual(routineMap, expectedMap);
    });
    it('load routines from complete application', function() {
      var pluginLoader = lab.createPluginLoader('fullapp');
      var originMap = {};
      pluginLoader.loadRoutines(originMap);
      false && console.log('routineMap: ', JSON.stringify(originMap, null, 2));
      var routineMap = lab.simplifyRoutines(originMap);
      false && console.log('routineMap: ', JSON.stringify(routineMap, null, 2));
      var expectedMap = {};
      expectedMap[chores.toFullname("fullapp", "main-cmd1")] = {
        "crateScope": "application",
        "name": "main-cmd1",
        "object": {
          "info": {
            "description": "[String]",
            "options": []
          },
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname("fullapp", "main-cmd2")] = {
        "crateScope": "application",
        "name": "main-cmd2",
        "object": {
          "info": {
            "description": "[String]",
            "options": []
          },
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname("plugin1", "plugin1-routine1")] = {
        "crateScope": "plugin1",
        "name": "plugin1-routine1",
        "object": {
          "info": {
            "description": "[String]",
            "options": []
          },
          "mode": "direct",
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname("plugin1", "plugin1-routine2")] = {
        "crateScope": "plugin1",
        "name": "plugin1-routine2",
        "object": {
          "info": {
            "description": "[String]",
            "options": []
          },
          "mode": "remote",
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname("plugin2", "plugin2-routine1")] = {
        "crateScope": "plugin2",
        "name": "plugin2-routine1",
        "object": {
          "info": {
            "description": "[String]",
            "schema": {
              "type": "object",
              "properties": {
                "number": {
                  "type": "number",
                  "minimum": 0,
                  "maximum": 100
                }
              }
            },
            "options": []
          },
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname("plugin2", "plugin2-routine3")] = {
        "crateScope": "plugin2",
        "name": "plugin2-routine3",
        "object": {
          "info": {
            "description": "[String]",
            "validate": "[Function]",
            "options": []
          },
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname("plugin3", "plugin3-routine1")] = {
        "crateScope": "plugin3",
        "name": "plugin3-routine1",
        "object": {
          "info": {
            "description": "[String]",
            "schema": {
              "type": "object",
              "properties": {
                "number": {
                  "type": "number",
                  "minimum": 0,
                  "maximum": 100
                }
              }
            },
            "options": []
          },
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname("plugin3", "plugin3-routine3")] = {
        "crateScope": "plugin3",
        "name": "plugin3-routine3",
        "object": {
          "info": {
            "description": "[String]",
            "validate": "[Function]",
            "options": []
          },
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname("devebot", "applica-info")] = {
        "crateScope": "devebot",
        "name": "applica-info",
        "object": {
          "info": {
            "alias": "app-info",
            "description": "[String]",
            "options": []
          },
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname("devebot", "logger-info")] = {
        "crateScope": "devebot",
        "name": "logger-info",
        "object": {
          "info": {
            "alias": "log-info",
            "description": "[String]",
            "options": []
          },
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname("devebot", "logger-reset")] = {
        "crateScope": "devebot",
        "name": "logger-reset",
        "object": {
          "info": {
            "alias": "log-reset",
            "description": "[String]",
            "options": []
          },
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname("devebot", "logger-set")] = {
        "crateScope": "devebot",
        "name": "logger-set",
        "object": {
          "info": {
            "alias": "log-set",
            "description": "[String]",
            "options": [
              {
                "abbr": "t",
                "name": "transports",
                "description": "[String]",
                "required": false
              },
              {
                "abbr": "e",
                "name": "enabled",
                "description": "[String]",
                "required": false
              },
              {
                "abbr": "l",
                "name": "level",
                "description": "[String]",
                "required": false
              }
            ]
          },
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname("devebot", "sandbox-info")] = {
        "crateScope": "devebot",
        "name": "sandbox-info",
        "object": {
          "info": {
            "alias": "sb-info",
            "description": "[String]",
            "options": []
          },
          "handler": "[Function]"
        }
      };
      expectedMap[chores.toFullname("devebot", "system-info")] = {
        "crateScope": "devebot",
        "name": "system-info",
        "object": {
          "info": {
            "alias": "sys-info",
            "description": "[String]",
            "options": []
          },
          "handler": "[Function]"
        }
      };
      assert.deepInclude(routineMap, expectedMap);
    });
  });

  describe('loadMetadata()', function() {
    it('load schemas from empty application', function() {
      var pluginLoader = lab.createPluginLoader();
      var metadataMap = {};
      pluginLoader.loadMetadata(metadataMap);
      false && console.log('metadataMap: ', JSON.stringify(metadataMap, null, 2));
      assert.deepEqual(metadataMap, {});
    });
    it('load schemas from simplest application', function() {
      var pluginLoader = lab.createPluginLoader('simple');
      var metadataMap = {};
      pluginLoader.loadMetadata(metadataMap);
      false && console.log('metadataMap: ', JSON.stringify(metadataMap, null, 2));
      assert.deepEqual(metadataMap, {});
    });
    it('load all of valid schemas from complete application', function() {
      var pluginLoader = lab.createPluginLoader('fullapp');
      var metadataMap = {};
      pluginLoader.loadMetadata(metadataMap);
      issueInspector.barrier({exitOnError: true});
      false && console.log('metadataMap: ', JSON.stringify(metadataMap, null, 2));
      var expectedMap = {};
      expectedMap[chores.toFullname("fullapp", "sandbox")] = {
        "default": {
          "crateScope": "application",
          "pluginCode": "application",
          "type": "sandbox",
          "subtype": "default",
          "schema": {
            "type": "object",
            "properties": {
              "host": {
                "type": "string"
              },
              "port": {
                "type": "number"
              },
              "verbose": {
                "type": "boolean"
              }
            },
            "required": ["host", "port"]
          }
        }
      };
      expectedMap[chores.toFullname("sub-plugin1", "sandbox")] = {
        "default": {
          "crateScope": "sub-plugin1",
          "pluginCode": "subPlugin1",
          "type": "sandbox",
          "subtype": "default",
          "schema": {
            "type": "object",
            "properties": {
              "host": {
                "type": "string"
              },
              "port": {
                "type": "number"
              }
            }
          }
        }
      };
      expectedMap[chores.toFullname("sub-plugin2", "sandbox")] = {
        "default": {
          "crateScope": "sub-plugin2",
          "pluginCode": "subPlugin2",
          "type": "sandbox",
          "subtype": "default",
          "schema": {
            "type": "object",
            "properties": {
              "host": {
                "type": "string"
              },
              "port": {
                "type": "number"
              }
            }
          }
        }
      };
      assert.deepInclude(metadataMap, expectedMap);
    });
  });

  describe('loadServices()', function() {
    it('load services from empty application', function() {
      var pluginLoader = lab.createPluginLoader();
      var serviceMap = {};
      pluginLoader.loadServices(serviceMap);
      false && console.log('serviceMap: ', JSON.stringify(serviceMap, null, 2));
      assert.deepEqual(serviceMap, {});
    });
    it('load services from simplest application', function() {
      var pluginLoader = lab.createPluginLoader('simple');
      var serviceMap = {};
      pluginLoader.loadServices(serviceMap);
      false && console.log('serviceMap: ', JSON.stringify(serviceMap, null, 2));
      assert.deepEqual(serviceMap, {});
    });
    it('load all of valid services from complete application', function() {
      var pluginLoader = lab.createPluginLoader('fullapp');
      var originMap = {};
      pluginLoader.loadServices(originMap);
      issueInspector.barrier({exitOnError: true});
      false && console.log('serviceMap: ', util.inspect(originMap, { depth: 5 }));
      var serviceMap = lodash.mapValues(originMap, function(service) {
        return lodash.assign(lodash.pick(service, [
            'construktor.argumentProperties',
            'construktor.argumentSchema'
          ]), lodash.omit(service, ['construktor']));
      });
      false && console.log('serviceMap: ', JSON.stringify(serviceMap, null, 2));
      var mainServiceField = chores.toFullname('fullapp', 'mainService');
      var expectedMap = {};
      expectedMap[mainServiceField] = {
        "construktor": {
          "argumentProperties": [
            "sandboxName",
            "sandboxConfig",
            "profileName",
            "profileConfig",
            "loggingFactory",
            chores.toFullname("bridge1#anyname1z"),
            chores.toFullname("application", "bridge1#anyname1z"),
            chores.toFullname("plugin1", "bridge1#anyname1a"),
            chores.toFullname("plugin1", "bridge2#anyname2a")
          ],
          "argumentSchema": {
            "$id": mainServiceField,
            "type": "object",
            "properties": {
              "sandboxName": {
                "type": "string"
              },
              "sandboxConfig": {
                "type": "object"
              },
              "profileName": {
                "type": "string"
              },
              "profileConfig": {
                "type": "object"
              },
              "loggingFactory": {
                "type": "object"
              },
              "bridge1#anyname1z": {
                "type": "object"
              },
              "application/bridge1#anyname1z": {
                "type": "object"
              },
              "plugin1/bridge1#anyname1a": {
                "type": "object"
              },
              "plugin1/bridge2#anyname2a": {
                "type": "object"
              }
            }
          }
        },
        "crateScope": "application",
        "name": "mainService"
      };
      lodash.forEach([
        ["application", "bridge1#anyname1z"],
        ["bridge1#anyname1z"],
        ["plugin1", "bridge1#anyname1a"],
        ["plugin1", "bridge2#anyname2a"]
      ], function(eles) {
        var oldField = eles.join('/');
        delete expectedMap[mainServiceField]["construktor"]["argumentSchema"]["properties"][oldField];
        var newField = chores.toFullname.apply(chores, eles);
        expectedMap[mainServiceField]["construktor"]["argumentSchema"]["properties"][newField] = {
          "type": "object"
        }
      })
      expectedMap[chores.toFullname("sub-plugin1", "sublibService")] = {
        "construktor": {
          "argumentSchema": {
            "$id": chores.toFullname("sub-plugin1", "sublibService"),
            "type": "object",
            "properties": {
              "sandboxName": {
                "type": "string"
              },
              "sandboxConfig": {
                "type": "object"
              },
              "profileName": {
                "type": "string"
              },
              "profileConfig": {
                "type": "object"
              },
              "loggingFactory": {
                "type": "object"
              },
              "sublibTrigger": {
                "type": "object"
              }
            }
          }
        },
        "crateScope": "sub-plugin1",
        "name": "sublibService"
      };
      expectedMap[chores.toFullname("sub-plugin2", "sublibService")] = {
        "construktor": {
          "argumentProperties": [
            "sandboxName",
            "sandboxConfig",
            "profileName",
            "profileConfig",
            "loggingFactory",
            "sublibTrigger"
          ],
          "argumentSchema": {
            "$id": chores.toFullname("sub-plugin2", "sublibService"),
            "type": "object",
            "properties": {
              "sandboxName": {
                "type": "string"
              },
              "sandboxConfig": {
                "type": "object"
              },
              "profileName": {
                "type": "string"
              },
              "profileConfig": {
                "type": "object"
              },
              "loggingFactory": {
                "type": "object"
              },
              "sublibTrigger": {
                "type": "object"
              }
            }
          }
        },
        "crateScope": "sub-plugin2",
        "name": "sublibService"
      };
      expectedMap[chores.toFullname("plugin1", "plugin1Service")] = {
        "construktor": {
          "argumentSchema": {
            "$id": chores.toFullname("plugin1", "plugin1Service"),
            "type": "object",
            "properties": {
              "sandboxName": {
                "type": "string"
              },
              "sandboxConfig": {
                "type": "object"
              },
              "profileName": {
                "type": "string"
              },
              "profileConfig": {
                "type": "object"
              },
              "loggingFactory": {
                "type": "object"
              }
            }
          }
        },
        "crateScope": "plugin1",
        "name": "plugin1Service"
      };
      expectedMap[chores.toFullname("plugin2", "plugin2Service")] = {
        "construktor": {
          "argumentSchema": {
            "$id": chores.toFullname("plugin2", "plugin2Service"),
            "type": "object",
            "properties": {
              "sandboxName": {
                "type": "string"
              },
              "sandboxConfig": {
                "type": "object"
              },
              "profileName": {
                "type": "string"
              },
              "profileConfig": {
                "type": "object"
              },
              "loggingFactory": {
                "type": "object"
              }
            }
          }
        },
        "crateScope": "plugin2",
        "name": "plugin2Service"
      };
      expectedMap[chores.toFullname("plugin3", "plugin3Service")] = {
        "construktor": {
          "argumentSchema": {
            "$id": chores.toFullname("plugin3", "plugin3Service"),
            "type": "object",
            "properties": {
              "sandboxName": {
                "type": "string"
              },
              "sandboxConfig": {
                "type": "object"
              },
              "profileName": {
                "type": "string"
              },
              "profileConfig": {
                "type": "object"
              },
              "loggingFactory": {
                "type": "object"
              }
            }
          }
        },
        "crateScope": "plugin3",
        "name": "plugin3Service"
      };
      if (!chores.isUpgradeSupported('bridge-full-ref')) {
        delete expectedMap[mainServiceField]['construktor']['argumentProperties'];
        delete expectedMap[mainServiceField]['construktor']['argumentSchema']["properties"][chores.toFullname("bridge1#anyname1z")];
        delete expectedMap[mainServiceField]['construktor']['argumentSchema']["properties"][chores.toFullname("application", "bridge1#anyname1z")];
        delete expectedMap[mainServiceField]['construktor']['argumentSchema']["properties"][chores.toFullname("plugin1", "bridge1#anyname1a")];
        delete expectedMap[mainServiceField]['construktor']['argumentSchema']["properties"][chores.toFullname("plugin1", "bridge2#anyname2a")];
      }
      assert.deepInclude(serviceMap, expectedMap);
    });
  });

  describe('loadTriggers()', function() {
    it('load triggers from empty application', function() {
      var pluginLoader = lab.createPluginLoader();
      var triggerMap = {};
      pluginLoader.loadTriggers(triggerMap);
      false && console.log('triggerMap: ', JSON.stringify(triggerMap, null, 2));
      assert.deepEqual(triggerMap, {});
    });
    it('load triggers from simplest application', function() {
      var pluginLoader = lab.createPluginLoader('simple');
      var triggerMap = {};
      pluginLoader.loadTriggers(triggerMap);
      false && console.log('triggerMap: ', JSON.stringify(triggerMap, null, 2));
      assert.deepEqual(triggerMap, {});
    });
    it('load all of valid triggers from complete application', function() {
      var pluginLoader = lab.createPluginLoader('fullapp');
      var originMap = {};
      pluginLoader.loadTriggers(originMap);
      issueInspector.barrier({exitOnError: true});
      false && console.log('triggerMap: ', util.inspect(originMap, { depth: 5 }));
      var triggerMap = lodash.mapValues(originMap, function(trigger) {
        return lodash.assign(lodash.pick(trigger, [
            'construktor.argumentProperties',
            'construktor.argumentSchema'
          ]), lodash.omit(trigger, ['construktor']));
      });
      false && console.log('triggerMap: ', JSON.stringify(triggerMap, null, 2));
      var mainTriggerField = chores.toFullname('fullapp', 'mainTrigger');
      var expectedMap = {};
      expectedMap[mainTriggerField] = {
        "construktor": {
          "argumentProperties": [
            "sandboxName",
            "sandboxConfig",
            "profileName",
            "profileConfig",
            "loggingFactory",
            chores.toFullname("application", "bridge1#anyname1z"),
            chores.toFullname("application", "bridge2#anyname2z"),
            chores.toFullname("connector1#wrapper"),
            chores.toFullname("connector2#wrapper"),
            chores.toFullname("plugin2", "bridge1#anyname1b"),
            chores.toFullname("plugin2", "bridge2#anyname2b")
          ],
          "argumentSchema": {
            "$id": mainTriggerField,
            "type": "object",
            "properties": {
              "sandboxName": {
                "type": "string"
              },
              "sandboxConfig": {
                "type": "object"
              },
              "profileName": {
                "type": "string"
              },
              "profileConfig": {
                "type": "object"
              },
              "loggingFactory": {
                "type": "object"
              },
              "application/bridge1#anyname1z": {
                "type": "object"
              },
              "application/bridge2#anyname2z": {
                "type": "object"
              },
              "connector1#wrapper": {
                "type": "object"
              },
              "connector2#wrapper": {
                "type": "object"
              },
              "plugin2/bridge1#anyname1b": {
                "type": "object"
              },
              "plugin2/bridge2#anyname2b": {
                "type": "object"
              }
            }
          }
        },
        "crateScope": "application",
        "name": "mainTrigger"
      };
      lodash.forEach([
        ["application", "bridge1#anyname1z"],
        ["application", "bridge2#anyname2z"],
        ["connector1#wrapper"],
        ["connector2#wrapper"],
        ["plugin2", "bridge1#anyname1b"],
        ["plugin2", "bridge2#anyname2b"]
      ], function(eles) {
        var oldField = eles.join('/');
        delete expectedMap[mainTriggerField]["construktor"]["argumentSchema"]["properties"][oldField];
        var newField = chores.toFullname.apply(chores, eles);
        expectedMap[mainTriggerField]["construktor"]["argumentSchema"]["properties"][newField] = {
          "type": "object"
        }
      })
      expectedMap[chores.toFullname("sub-plugin1", "sublibTrigger")] = {
        "construktor": {
          "argumentSchema": {
            "$id": chores.toFullname("sub-plugin1", "sublibTrigger"),
            "type": "object",
            "properties": {
              "sandboxName": {
                "type": "string"
              },
              "sandboxConfig": {
                "type": "object"
              },
              "profileName": {
                "type": "string"
              },
              "profileConfig": {
                "type": "object"
              },
              "loggingFactory": {
                "type": "object"
              }
            }
          }
        },
        "crateScope": "sub-plugin1",
        "name": "sublibTrigger"
      };
      expectedMap[chores.toFullname("sub-plugin2", "sublibTrigger")] = {
        "construktor": {
          "argumentSchema": {
            "$id": chores.toFullname("sub-plugin2", "sublibTrigger"),
            "type": "object",
            "properties": {
              "sandboxName": {
                "type": "string"
              },
              "sandboxConfig": {
                "type": "object"
              },
              "profileName": {
                "type": "string"
              },
              "profileConfig": {
                "type": "object"
              },
              "loggingFactory": {
                "type": "object"
              }
            }
          }
        },
        "crateScope": "sub-plugin2",
        "name": "sublibTrigger"
      };
      expectedMap[chores.toFullname("plugin1", "plugin1Trigger")] = {
        "construktor": {
          "argumentSchema": {
            "$id": chores.toFullname("plugin1", "plugin1Trigger"),
            "type": "object",
            "properties": {
              "sandboxName": {
                "type": "string"
              },
              "sandboxConfig": {
                "type": "object"
              },
              "profileName": {
                "type": "string"
              },
              "profileConfig": {
                "type": "object"
              },
              "loggingFactory": {
                "type": "object"
              }
            }
          }
        },
        "crateScope": "plugin1",
        "name": "plugin1Trigger"
      };
      expectedMap[chores.toFullname("plugin2", "plugin2Trigger")] = {
        "construktor": {
          "argumentSchema": {
            "$id": chores.toFullname("plugin2", "plugin2Trigger"),
            "type": "object",
            "properties": {
              "sandboxName": {
                "type": "string"
              },
              "sandboxConfig": {
                "type": "object"
              },
              "profileName": {
                "type": "string"
              },
              "profileConfig": {
                "type": "object"
              },
              "loggingFactory": {
                "type": "object"
              }
            }
          }
        },
        "crateScope": "plugin2",
        "name": "plugin2Trigger"
      };
      expectedMap[chores.toFullname("plugin3", "plugin3Trigger")] = {
        "construktor": {
          "argumentSchema": {
            "$id": chores.toFullname("plugin3", "plugin3Trigger"),
            "type": "object",
            "properties": {
              "sandboxName": {
                "type": "string"
              },
              "sandboxConfig": {
                "type": "object"
              },
              "profileName": {
                "type": "string"
              },
              "profileConfig": {
                "type": "object"
              },
              "loggingFactory": {
                "type": "object"
              }
            }
          }
        },
        "crateScope": "plugin3",
        "name": "plugin3Trigger"
      };
      if (!chores.isUpgradeSupported('bridge-full-ref')) {
        delete expectedMap[mainTriggerField]['construktor']['argumentProperties'];
        delete expectedMap[mainTriggerField]['construktor']['argumentSchema']["properties"][chores.toFullname("connector1#wrapper")];
        delete expectedMap[mainTriggerField]['construktor']['argumentSchema']["properties"][chores.toFullname("connector2#wrapper")];
        delete expectedMap[mainTriggerField]['construktor']['argumentSchema']["properties"][chores.toFullname("application", "bridge1#anyname1z")];
        delete expectedMap[mainTriggerField]['construktor']['argumentSchema']["properties"][chores.toFullname("application", "bridge2#anyname2z")];
        delete expectedMap[mainTriggerField]['construktor']['argumentSchema']["properties"][chores.toFullname("plugin2", "bridge1#anyname1b")];
        delete expectedMap[mainTriggerField]['construktor']['argumentSchema']["properties"][chores.toFullname("plugin2", "bridge2#anyname2b")];
      }
      assert.deepInclude(triggerMap, expectedMap);
    });
  });

  after(function() {
    LogTracer.clearStringifyInterceptors();
    envmask.reset();
  });
});