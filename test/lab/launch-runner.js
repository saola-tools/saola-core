'use strict';

var path = require('path');

var main = require(path.join(__dirname, '../index')).getApp('state-verification');
var mainService = main.runner.getSandboxService('mainService');
var contextManager = main.runner.getSandboxService('contextManager');
console.log('Configuration: %s', JSON.stringify(mainService.getConfig(), null, 2));
console.log('FeatureSupported: %s', contextManager.isFeatureSupported('abc'));