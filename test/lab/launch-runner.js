'use strict';

var path = require('path');

var main = require(path.join(__dirname, '../index')).getApp('state-verification');
var mainService = main.runner.getSandboxService('mainService');
console.log('Configuration: %s', JSON.stringify(mainService.getConfig(), null, 2));

var contextManager = main.runner.getSandboxService('contextManager');
var featureName = 'abc';
console.log('isFeatureSupported("%s"): %s', featureName, contextManager.isFeatureSupported(featureName));
