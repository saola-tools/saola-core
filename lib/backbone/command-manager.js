'use strict';

var events = require('events');
var util = require('util');
var lodash = require('lodash');

var Validator = require('jsonschema').Validator;
var validator = new Validator();

var chores = require('../utils/chores.js');
var constx = require('../utils/constx.js');

var debuglog = require('../utils/debug.js')('devebot:commandManager');

var Service = function(params) {
  debuglog(' + constructor start ...');
  Service.super_.call(this);

  params = params || {};
  
  var self = this;

  var generalconfig = params.generalconfig || {};
  var profileconfig = params.profileconfig || {};

  self.logger = params.loggingFactory.getLogger();

  var commandInstance = lodash.pick(params, [
    'appinfo',
    'loggingFactory',
    'sandboxManager'
  ]);

  var commandMap = {};

  self.getCommands = function() {
    return (commandMap[constx.COMMAND.ROOT_KEY] || {});
  };

  self.getDefinitions = function() {
    var commands = this.getCommands();
    var defs = [];
    lodash.forOwn(commands, function(value, key) {
      defs.push(lodash.assign({name: key}, value.info));
    });
    return defs;
  };

  self.isAvailable = function(name) {
    var commands = this.getCommands();
    return (lodash.isObject(commands[name]));
  };

  self.execute = function(cmddef, commandContext) {
    commandContext = commandContext || {};
    self.logger.debug(' + Execute command: %s', JSON.stringify(cmddef));
    var commands = this.getCommands();
    var cmdobj = commands[cmddef.command];
    if (!cmdobj) {
      throw new Error('command_not_found');
    }
    return cmdobj.handler.call(commandInstance, cmddef.options, commandContext);
  };

  params.pluginLoader.loadCommands(commandMap, {});

  debuglog(' - validate commands:');
  var result = {};
  lodash.forOwn(self.getCommands(), function(command, name) {
    var output = validate(command);
    if (!output.valid) {
      result[name] = output;  
    }
  });
  debuglog(' . validation result: %s', JSON.stringify(result, null, 2));
  
  debuglog(' - constructor has finished');
};

Service.argumentSchema = {
  "id": "commandManager",
  "type": "object",
  "properties": {
    "appinfo": {
      "type": "object"
    },
    "pluginLoader": {
      "type": "object"
    },
    "profileconfig": {
      "type": "object"
    },
    "generalconfig": {
      "type": "object"
    },
    "loggingFactory": {
      "type": "object"
    },
    "sandboxManager": {
      "type": "object"
    }
  }
};

util.inherits(Service, events.EventEmitter);

module.exports = Service;

var validate = function(target) {
  target = target || {};
  var results = [];
  
  var targetProps = lodash.pick(target, lodash.keys(constx.COMMAND.SCHEMA.OBJECT.properties));
  results.push(validator.validate(targetProps, constx.COMMAND.SCHEMA.OBJECT));
  
  if (!lodash.isFunction(target.handler)) {
    results.push({
      valid: false,
      errors: [{
        message: 'handler has wrong type: ' + typeof(target.handler)
      }]
    });
  }
  
  return results.reduce(function(output, result) {
    output.valid = output.valid && (result.valid != false);
    output.errors = output.errors.concat(result.errors);
    return output;
  }, { valid: true, errors: [] });
};