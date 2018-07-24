'use strict';

var path = require('path');

var main = require(path.join(__dirname, '../index')).getApp('state-verification');
var mainService = main.runner.getSandboxService('mainService');
console.log('Configuration: %s', JSON.stringify(mainService.getConfig(), null, 2));

var contextManager = main.runner.getSandboxService('contextManager');
var featureNames = ['abc', 'def'];
console.log("isFeatureSupported(%s): %s",
    JSON.stringify(featureNames), contextManager.isFeatureSupported(featureNames));
