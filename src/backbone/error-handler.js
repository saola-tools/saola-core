'use strict';

var lodash = require('lodash');
var chores = require('../utils/chores.js');
var LoggingWrapper = require('./logging-wrapper');

function ErrorHandler(params) {
  var self = this;
  params = params || {};

  var componentID = chores.getBlockRef(__filename);
  var loggingWrapper = new LoggingWrapper(componentID);
  var LX = loggingWrapper.getLogger();
  var LT = loggingWrapper.getTracer();

  LX.has('silly') && LX.log('silly', LT.toMessage({
    tags: [ componentID, 'constructor-begin' ],
    text: ' + constructor start ...'
  }));

  var opStates = [];

  this.init = function() {
    return this.reset();
  }

  this.collect = function(info) {
    if (info instanceof Array) {
      opStates.push.apply(opStates, info);
    } else {
      opStates.push(info);
    }
    return this;
  }

  this.examine = function(options) {
    options = options || {};
    var summary = lodash.reduce(opStates, function(store, item) {
      if (item.hasError) {
        store.numberOfErrors += 1;
        store.failedServices.push(item);
      }
      return store;
    }, { numberOfErrors: 0, failedServices: [] });
    LX.has('silly') && LX.log('silly', LT.add({
      invoker: options.invoker,
      totalOfErrors: summary.numberOfErrors,
      errors: summary.failedServices
    }).toMessage({
      tags: [ componentID, 'examine' ],
      text: ' - Total of errors: ${totalOfErrors}'
    }));
    return summary;
  }

  this.barrier = function(options) {
    options = options || {};
    var silent = chores.isSilentForced('error-handler', options);
    var summary = this.examine(options);
    if (summary.numberOfErrors > 0) {
      if (!silent) {
        console.log('[x] Failed to load %s script file(s):', summary.numberOfErrors);
        lodash.forEach(summary.failedServices, function(fsv) {
          if (fsv.stage == 'config/schema') {
            switch(fsv.type) {
              case 'application':
              case 'plugin':
              case 'devebot':
              console.log('--> [%s:%s] sandbox config is invalid, reasons:\n%s', fsv.type, fsv.name, fsv.stack);
              break;
            }
            return;
          }
          if (fsv.stage == 'instantiating') {
            switch(fsv.type) {
              case 'ROUTINE':
              case 'SERVICE':
              case 'TRIGGER':
              console.log(' -  [%s:%s] new() is failed:\n   %s', fsv.type, fsv.name, fsv.stack);
              break;
              case 'DIALECT':
              console.log(' -  [%s:%s/%s] new() is failed:\n   %s', fsv.type, fsv.code, fsv.name, fsv.stack);
              break;
              default:
              console.log(' -  %s', JSON.stringify(fsv));
            }
            return;
          }
          switch(fsv.type) {
            case 'CONFIG':
            console.log(' -  [%s] in (%s):\n   %s', fsv.type, fsv.file, fsv.stack);
            break;
            case 'ROUTINE':
            case 'SERVICE':
            case 'TRIGGER':
            console.log(' -  [%s:%s] - %s in (%s%s):\n   %s', fsv.type, fsv.name, fsv.file, fsv.pathDir, fsv.subDir, fsv.stack);
            break;
            case 'DIALECT':
            console.log(' -  [%s:%s/%s] in (%s):\n   %s', fsv.type, fsv.code, fsv.name, fsv.path, fsv.stack);
            break;
            case 'application':
            console.log(' -  [%s:%s/%s] in (%s):\n   %s', fsv.type, fsv.name, fsv.code, fsv.path, fsv.stack);
            break;
            default:
            console.log(' -  %s', JSON.stringify(fsv));
          }
        });
      }
      LX.has('silly') && LX.log('silly', LT.add({
        invoker: options.invoker,
        silent: silent,
        exitOnError: (options.exitOnError !== false)
      }).toMessage({
        tags: [ componentID, 'barrier' ],
        text: ' - Program will be exited? (${exitOnError})'
      }));
      if (options.exitOnError !== false) {
        if (!silent) {
          console.log('==@ The program will exit now.');
          console.log('... Please fix the issues and then retry again.');
        }
        this.exit(1);
      }
    }
  }

  this.exit = function(code) {
    code = lodash.isNumber(code) ? code : 0;
    LX.has('silly') && LX.log('silly', LT.add({
      exitCode: code
    }).toMessage({
      tags: [ componentID, 'exit' ],
      text: 'process.exit(${exitCode}) is invoked'
    }));
    if (!chores.skipProcessExit()) {
      process.exit(code);
    }
  }

  this.reset = function() {
    opStates.splice(0, opStates.length);
    return this;
  }

  LX.has('silly') && LX.log('silly', LT.toMessage({
    tags: [ componentID, 'constructor-end' ],
    text: ' - constructor has finished'
  }));
}

ErrorHandler.argumentSchema = {
  "$id": "errorHandler",
  "type": "object",
  "properties": {}
};

module.exports = ErrorHandler;

var errorHandler;

Object.defineProperty(ErrorHandler, 'instance', {
  get: function() {
    return (errorHandler = errorHandler || new ErrorHandler());
  },
  set: function(value) {}
});
