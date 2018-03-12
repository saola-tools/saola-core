'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var loader = Devebot.require('loader');
var chores = Devebot.require('chores');
var debugx = Devebot.require('pinbug')('tdd:devebot:core:plugin-loader');
var assert = require('chai').assert;
var expect = require('chai').expect;
var path = require('path');
var util = require('util');
var LogConfig = require('logolite').LogConfig;
var LogTracer = require('logolite').LogTracer;
var envtool = require('logolite/envtool');
var rewire = require('rewire');
var errorHandlerPath = path.join(lab.getDevebotHome(), 'lib/backbone/error-handler');
var errorHandler = require(errorHandlerPath).instance;

describe('tdd:devebot:core:plugin-loader', function() {
  this.timeout(lab.getDefaultTimeout());
  
  before(function() {
    envtool.setup({
      LOGOLITE_ALWAYS_ENABLED: 'all',
      LOGOLITE_ALWAYS_MUTED: 'all'
    });
    LogConfig.reset();
  });

  describe('loadRoutines()', function() {
    var transformResult = function(originMap) {
      return lodash.mapValues(originMap, function(routine) {
        routine = lodash.cloneDeep(routine);
        if (lodash.isFunction(lodash.get(routine, 'object.handler', null))) {
          routine.object.handler = '[Function]';
        }
        if (lodash.isFunction(lodash.get(routine, 'object.info.validate', null))) {
          lodash.set(routine, 'object.info.validate', '[Function]');
        }
        if (lodash.isString(lodash.get(routine, 'object.info.description', null))) {
          lodash.set(routine, 'object.info.description', '[String]');
        }
        if (lodash.isArray(lodash.get(routine, 'object.info.options', null))) {
          routine.object.info.options = lodash.map(routine.object.info.options, function(opt) {
            if (lodash.isString(opt.description)) {
              opt.description = '[String]'
            }
            return opt;
          });
        }
        return routine;
      });
    }
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
      var routineMap = transformResult(originMap);
      false && console.log('routineMap: ', JSON.stringify(routineMap, null, 2));
      assert.deepEqual(routineMap, {
        "devebot/applica-info": {
          "moduleId": "devebot",
          "name": "applica-info",
          "object": {
            "info": {
              "alias": "app-info",
              "description": "[String]",
              "options": []
            },
            "handler": "[Function]"
          }
        },
        "devebot/logger-info": {
          "moduleId": "devebot",
          "name": "logger-info",
          "object": {
            "info": {
              "alias": "log-info",
              "description": "[String]",
              "options": []
            },
            "handler": "[Function]"
          }
        },
        "devebot/logger-reset": {
          "moduleId": "devebot",
          "name": "logger-reset",
          "object": {
            "info": {
              "alias": "log-reset",
              "description": "[String]",
              "options": []
            },
            "handler": "[Function]"
          }
        },
        "devebot/logger-set": {
          "moduleId": "devebot",
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
        },
        "devebot/sandbox-info": {
          "moduleId": "devebot",
          "name": "sandbox-info",
          "object": {
            "info": {
              "alias": "sb-info",
              "description": "[String]",
              "options": []
            },
            "handler": "[Function]"
          }
        },
        "devebot/system-info": {
          "moduleId": "devebot",
          "name": "system-info",
          "object": {
            "info": {
              "alias": "sys-info",
              "description": "[String]",
              "options": []
            },
            "handler": "[Function]"
          }
        }
      });
    });
    it('load routines from complete application', function() {
      var pluginLoader = lab.createPluginLoader('fullapp');
      var originMap = {};
      pluginLoader.loadRoutines(originMap);
      false && console.log('routineMap: ', JSON.stringify(originMap, null, 2));
      var routineMap = transformResult(originMap);
      false && console.log('routineMap: ', JSON.stringify(routineMap, null, 2));
      assert.deepInclude(routineMap, {
        "fullapp/main-cmd1": {
          "moduleId": "fullapp",
          "name": "main-cmd1",
          "object": {
            "info": {
              "description": "[String]",
              "options": []
            },
            "handler": "[Function]"
          }
        },
        "fullapp/main-cmd2": {
          "moduleId": "fullapp",
          "name": "main-cmd2",
          "object": {
            "info": {
              "description": "[String]",
              "options": []
            },
            "handler": "[Function]"
          }
        },
        "plugin1/plugin1-routine1": {
          "moduleId": "plugin1",
          "name": "plugin1-routine1",
          "object": {
            "info": {
              "description": "[String]",
              "options": []
            },
            "mode": "direct",
            "handler": "[Function]"
          }
        },
        "plugin1/plugin1-routine2": {
          "moduleId": "plugin1",
          "name": "plugin1-routine2",
          "object": {
            "info": {
              "description": "[String]",
              "options": []
            },
            "mode": "remote",
            "handler": "[Function]"
          }
        },
        "plugin2/plugin2-routine1": {
          "moduleId": "plugin2",
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
        },
        "plugin2/plugin2-routine3": {
          "moduleId": "plugin2",
          "name": "plugin2-routine3",
          "object": {
            "info": {
              "description": "[String]",
              "validate": "[Function]",
              "options": []
            },
            "handler": "[Function]"
          }
        },
        "plugin3/plugin3-routine1": {
          "moduleId": "plugin3",
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
        },
        "plugin3/plugin3-routine3": {
          "moduleId": "plugin3",
          "name": "plugin3-routine3",
          "object": {
            "info": {
              "description": "[String]",
              "validate": "[Function]",
              "options": []
            },
            "handler": "[Function]"
          }
        },
        "devebot/applica-info": {
          "moduleId": "devebot",
          "name": "applica-info",
          "object": {
            "info": {
              "alias": "app-info",
              "description": "[String]",
              "options": []
            },
            "handler": "[Function]"
          }
        },
        "devebot/logger-info": {
          "moduleId": "devebot",
          "name": "logger-info",
          "object": {
            "info": {
              "alias": "log-info",
              "description": "[String]",
              "options": []
            },
            "handler": "[Function]"
          }
        },
        "devebot/logger-reset": {
          "moduleId": "devebot",
          "name": "logger-reset",
          "object": {
            "info": {
              "alias": "log-reset",
              "description": "[String]",
              "options": []
            },
            "handler": "[Function]"
          }
        },
        "devebot/logger-set": {
          "moduleId": "devebot",
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
        },
        "devebot/sandbox-info": {
          "moduleId": "devebot",
          "name": "sandbox-info",
          "object": {
            "info": {
              "alias": "sb-info",
              "description": "[String]",
              "options": []
            },
            "handler": "[Function]"
          }
        },
        "devebot/system-info": {
          "moduleId": "devebot",
          "name": "system-info",
          "object": {
            "info": {
              "alias": "sys-info",
              "description": "[String]",
              "options": []
            },
            "handler": "[Function]"
          }
        }
      });
    });
  });

  describe('loadSchemas()', function() {
    it('load schemas from empty application', function() {
      var pluginLoader = lab.createPluginLoader();
      var schemaMap = {};
      pluginLoader.loadSchemas(schemaMap);
      false && console.log('schemaMap: ', JSON.stringify(schemaMap, null, 2));
      assert.deepEqual(schemaMap, {});
    });
    it('load schemas from simplest application', function() {
      var pluginLoader = lab.createPluginLoader('simple');
      var schemaMap = {};
      pluginLoader.loadSchemas(schemaMap);
      false && console.log('schemaMap: ', JSON.stringify(schemaMap, null, 2));
      assert.deepEqual(schemaMap, {});
    });
    it('load all of valid schemas from complete application', function() {
      var pluginLoader = lab.createPluginLoader('fullapp');
      var schemaMap = {};
      pluginLoader.loadSchemas(schemaMap);
      errorHandler.barrier({exitOnError: true});
      false && console.log('schemaMap: ', JSON.stringify(schemaMap, null, 2));
      assert.deepInclude(schemaMap, {
        "fullapp/sandbox": {
          "default": {
            "moduleId": "fullapp",
            "pluginName": "application",
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
        },
        "sub-plugin1/sandbox": {
          "default": {
            "moduleId": "sub-plugin1",
            "pluginName": "subPlugin1",
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
        },
        "sub-plugin2/sandbox": {
          "default": {
            "moduleId": "sub-plugin2",
            "pluginName": "subPlugin2",
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
        }
      });
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
      errorHandler.barrier({exitOnError: true});
      false && console.log('serviceMap: ', util.inspect(originMap, { depth: 5 }));
      var serviceMap = lodash.mapValues(originMap, function(service) {
        return lodash.assign(lodash.pick(service, [
            'construktor.argumentProperties',
            'construktor.argumentSchema'
          ]), lodash.omit(service, ['construktor']));
      });
      false && console.log('serviceMap: ', JSON.stringify(serviceMap, null, 2));
      assert.deepInclude(serviceMap, {
        "fullapp/mainService": {
          "moduleId": "fullapp",
          "name": "mainService",
          "construktor": {
            "argumentSchema": {
              "$id": "mainService",
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
          }
        },
        "sub-plugin1/sublibService": {
          "moduleId": "sub-plugin1",
          "name": "sublibService",
          "construktor": {
            "argumentSchema": {
              "$id": "sublibService",
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
          }
        },
        "sub-plugin2/sublibService": {
          "moduleId": "sub-plugin2",
          "name": "sublibService",
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
              "$id": "sublibService",
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
          }
        },
        "plugin1/plugin1Service": {
          "moduleId": "plugin1",
          "name": "plugin1Service",
          "construktor": {
            "argumentSchema": {
              "$id": "plugin1Service",
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
          }
        },
        "plugin2/plugin2Service": {
          "moduleId": "plugin2",
          "name": "plugin2Service",
          "construktor": {
            "argumentSchema": {
              "$id": "plugin2Service",
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
          }
        },
        "plugin3/plugin3Service": {
          "moduleId": "plugin3",
          "name": "plugin3Service",
          "construktor": {
            "argumentSchema": {
              "$id": "plugin3Service",
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
          }
        }
      });
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
      errorHandler.barrier({exitOnError: true});
      false && console.log('triggerMap: ', util.inspect(originMap, { depth: 5 }));
      var triggerMap = lodash.mapValues(originMap, function(trigger) {
        return lodash.assign(lodash.pick(trigger, [
            'construktor.argumentProperties',
            'construktor.argumentSchema'
          ]), lodash.omit(trigger, ['construktor']));
      });
      false && console.log('triggerMap: ', JSON.stringify(triggerMap, null, 2));
      assert.deepInclude(triggerMap, {
        "fullapp/mainTrigger": {
          "construktor": {
            "argumentSchema": {
              "$id": "mainTrigger",
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
          "moduleId": "fullapp",
          "name": "mainTrigger"
        },
        "sub-plugin1/sublibTrigger": {
          "construktor": {
            "argumentSchema": {
              "$id": "sublibTrigger",
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
          "moduleId": "sub-plugin1",
          "name": "sublibTrigger"
        },
        "sub-plugin2/sublibTrigger": {
          "construktor": {
            "argumentSchema": {
              "$id": "sublibTrigger",
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
          "moduleId": "sub-plugin2",
          "name": "sublibTrigger"
        },
        "plugin1/plugin1Trigger": {
          "construktor": {
            "argumentSchema": {
              "$id": "plugin1Trigger",
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
          "moduleId": "plugin1",
          "name": "plugin1Trigger"
        },
        "plugin2/plugin2Trigger": {
          "construktor": {
            "argumentSchema": {
              "$id": "plugin2Trigger",
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
          "moduleId": "plugin2",
          "name": "plugin2Trigger"
        },
        "plugin3/plugin3Trigger": {
          "construktor": {
            "argumentSchema": {
              "$id": "plugin3Trigger",
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
          "moduleId": "plugin3",
          "name": "plugin3Trigger"
        }
      });
    });
  });

  after(function() {
    LogTracer.clearStringifyInterceptors();
    envtool.reset();
  });
});