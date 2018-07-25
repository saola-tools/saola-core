'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');
var loader = Devebot.require('loader');
var debugx = Devebot.require('pinbug')('tdd:devebot:utils:envbox');
var assert = require('chai').assert;
var path = require('path');
var util = require('util');
var LogConfig = require('logolite').LogConfig;
var LogTracer = require('logolite').LogTracer;
var envtool = require('logolite/envtool');
var rewire = require('rewire');
var sinon = require('sinon');
var envbox = require('../../lib/utils/envbox');

describe('tdd:devebot:utils:envbox', function() {
  this.timeout(lab.getDefaultTimeout());

  var ENV_DESCRIPTOR = {
    namespace: 'ENV',
    definition: [
      {
        name: "UNDEFINED_STRING",
        type: "string",
        description: "undefined string example"
      },
      {
        name: "DEFAULT_STRING",
        type: "string",
        description: "default string example",
        defaultValue: "default"
      },
      {
        name: "PRESETS_STRING",
        type: "string",
        description: "string example",
        defaultValue: "empty"
      },
      {
        name: "EMPTY_ARRAY1",
        type: "array",
        description: "empty array example 1"
      },
      {
        name: "EMPTY_ARRAY2",
        type: "array",
        description: "empty array example 2"
      },
      {
        name: "NORMAL_ARRAY",
        type: "array",
        description: "normal array example"
      }
    ]
  };

  describe('getEnv()', function() {
    before(function() {
      envtool.setup({
        ENV_PRESETS_STRING: "hello world",
        DEVEBOT_PRESETS_STRING: "hello devebot",
        ENV_EMPTY_ARRAY1: "",
        ENV_EMPTY_ARRAY2: ", ,",
        DEVEBOT_NORMAL_ARRAY: "value 1, value 2, value 3",
        ENV_TRUE: "true",
        ENV_FALSE: "false"
      });
    });

    it("get environment variable's value correctly", function() {
      // defining the envbox object
      var privateEnvbox = envbox.new(ENV_DESCRIPTOR);
      // asserting the results
      assert.isUndefined(privateEnvbox.getEnv("UNDEFINED_STRING"));
      assert.equal(privateEnvbox.getEnv("DEFAULT_STRING"), "default");
      assert.equal(privateEnvbox.getEnv("PRESETS_STRING"), "hello world");
      assert.sameMembers(privateEnvbox.getEnv("EMPTY_ARRAY1"), []);
      assert.sameMembers(privateEnvbox.getEnv("EMPTY_ARRAY2"), []);
      assert.sameMembers(privateEnvbox.getEnv("NORMAL_ARRAY"), ["value 1", "value 2", "value 3"]);
    });

    after(function() {
      envtool.reset();
    });
  });

  describe('printEnvList()', function() {
    before(function() {
      envtool.setup({
        ENV_PRESETS_STRING: "hello devebot",
        ENV_EMPTY_ARRAY1: "",
        ENV_EMPTY_ARRAY2: ", ,",
        ENV_NORMAL_ARRAY: "value 1, value 2, value 3",
        ENV_TRUE: "true",
        ENV_FALSE: "false"
      });
    });

    it("print environment variables correctly", function() {
      // defining the envbox object
      var privateEnvbox = envbox.new(ENV_DESCRIPTOR);
      // display
      var expected = [
        '[+] Display environment variables:',
        ' |> ENV_UNDEFINED_STRING: undefined string example',
        '    - current value: undefined',
        ' |> ENV_DEFAULT_STRING: default string example (default: "default")',
        '    - current value: "default"',
        ' |> ENV_PRESETS_STRING: string example (default: "empty")',
        '    - current value: "hello devebot"',
        ' |> ENV_EMPTY_ARRAY1: empty array example 1',
        '    - format: (comma-separated-string)',
        '    - current value: []',
        ' |> ENV_EMPTY_ARRAY2: empty array example 2',
        '    - format: (comma-separated-string)',
        '    - current value: []',
        ' |> ENV_NORMAL_ARRAY: normal array example',
        '    - format: (comma-separated-string)',
        '    - current value: ["value 1","value 2","value 3"]'
      ]
      var output = privateEnvbox.printEnvList({ muted: true });
      false && console.log(JSON.stringify(output, null, 2));
      assert.sameMembers(output, expected);
    });

    after(function() {
      envtool.reset();
    });
  });
});
