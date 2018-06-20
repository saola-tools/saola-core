'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');
var loader = Devebot.require('loader');
var debugx = Devebot.require('pinbug')('tdd:devebot:base:envbox');
var assert = require('chai').assert;
var path = require('path');
var util = require('util');
var LogConfig = require('logolite').LogConfig;
var LogTracer = require('logolite').LogTracer;
var envtool = require('logolite/envtool');
var rewire = require('rewire');
var sinon = require('sinon');
var EnvBox = require('../../lib/utils/envbox');

describe('tdd:devebot:base:envbox', function() {
  this.timeout(lab.getDefaultTimeout());

  describe('getEnv()', function() {
    it("get environment variable's value correctly", function() {
      process.env.ENV_PRESETS_STRING = "hello world";
      process.env.ENV_EMPTY_ARRAY1 = "";
      process.env.ENV_EMPTY_ARRAY2 = ", ,";
      process.env.ENV_NORMAL_ARRAY = "value 1, value 2, value 3";
      process.env.ENV_TRUE = "true";
      process.env.ENV_FALSE = "false";
      // defining the envbox object
      var envbox = new EnvBox({
        namespace: 'ENV',
        definition: [
          {
            name: "ENV_UNDEFINED_STRING",
            type: "string",
            description: "undefined string example"
          },
          {
            name: "ENV_DEFAULT_STRING",
            type: "string",
            description: "default string example",
            defaultValue: "default"
          },
          {
            name: "ENV_PRESETS_STRING",
            type: "string",
            description: "string example",
            defaultValue: "empty"
          },
          {
            name: "ENV_EMPTY_ARRAY1",
            type: "array",
            description: "empty array example 1"
          },
          {
            name: "ENV_EMPTY_ARRAY2",
            type: "array",
            description: "empty array example 2"
          },
          {
            name: "ENV_NORMAL_ARRAY",
            type: "array",
            description: "normal array example"
          }
        ]
      });
      // asserting the results
      assert.isUndefined(envbox.getEnv("ENV_UNDEFINED_STRING"));
      assert.equal(envbox.getEnv("ENV_DEFAULT_STRING"), "default");
      assert.equal(envbox.getEnv("ENV_PRESETS_STRING"), "hello world");
      assert.sameMembers(envbox.getEnv("ENV_EMPTY_ARRAY1"), []);
      assert.sameMembers(envbox.getEnv("ENV_EMPTY_ARRAY2"), []);
      assert.sameMembers(envbox.getEnv("ENV_NORMAL_ARRAY"), ["value 1", "value 2", "value 3"]);
      // display
      false && envbox.printEnvList();
    });
  });
});
