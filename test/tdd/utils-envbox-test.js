'use strict';

var lab = require('../index');
var Devebot = lab.getDevebot();
var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');
var debugx = Devebot.require('pinbug')('tdd:devebot:utils:envbox');
var assert = require('chai').assert;
var envmask = require('envmask').instance;
var envbox = require(lab.getDevebotModule('utils/envbox'));

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
      envmask.setup({
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
      envmask.reset();
    });
  });

  describe('setNamespace() & occupySystemVariables', function() {
    beforeEach(function() {
      envmask.setup({
        ENV_PRESETS_STRING: "hello world",
        DEVEBOT_PRESETS_STRING: "hello devebot",
        ENV_EMPTY_ARRAY1: "",
        ENV_EMPTY_ARRAY2: ", ,",
        DEVEBOT_NORMAL_ARRAY: "value 1, value 2, value 3",
        ENV_TRUE: "true",
        ENV_FALSE: "false"
      });
    });

    it("set namespace and occupy system variables with specified ownershipLabel", function() {
      var myOwnershipLabel = '<ownership-here>';
      var privateEnvbox = envbox.new(lodash.pick(ENV_DESCRIPTOR, ['definition']));
      privateEnvbox.setNamespace('ENV', {
        occupyValues: true,
        ownershipLabel: myOwnershipLabel
      });
      assert.isUndefined(privateEnvbox.getEnv("UNDEFINED_STRING"));
      assert.equal(privateEnvbox.getEnv("DEFAULT_STRING"), "default");
      assert.equal(privateEnvbox.getEnv("PRESETS_STRING"), "hello world");
      assert.sameMembers(privateEnvbox.getEnv("EMPTY_ARRAY1"), []);
      assert.sameMembers(privateEnvbox.getEnv("EMPTY_ARRAY2"), []);
      assert.sameMembers(privateEnvbox.getEnv("NORMAL_ARRAY"), ["value 1", "value 2", "value 3"]);
      assert.equal(process.env.ENV_PRESETS_STRING, myOwnershipLabel);
      assert.equal(process.env.DEVEBOT_PRESETS_STRING, "hello devebot");
      assert.equal(process.env.ENV_EMPTY_ARRAY1, myOwnershipLabel);
      assert.equal(process.env.ENV_EMPTY_ARRAY2, myOwnershipLabel);
      assert.equal(process.env.DEVEBOT_NORMAL_ARRAY, "value 1, value 2, value 3");
      assert.equal(process.env.ENV_TRUE, "true");
      assert.equal(process.env.ENV_FALSE, "false");
    });

    it("set namespace and occupy system variables without ownershipLabel", function() {
      var privateEnvbox = envbox.new(lodash.pick(ENV_DESCRIPTOR, ['definition']));
      privateEnvbox.setNamespace('ENV', {
        occupyValues: true
      });
      assert.isUndefined(privateEnvbox.getEnv("UNDEFINED_STRING"));
      assert.equal(privateEnvbox.getEnv("DEFAULT_STRING"), "default");
      assert.equal(privateEnvbox.getEnv("PRESETS_STRING"), "hello world");
      assert.sameMembers(privateEnvbox.getEnv("EMPTY_ARRAY1"), []);
      assert.sameMembers(privateEnvbox.getEnv("EMPTY_ARRAY2"), []);
      assert.sameMembers(privateEnvbox.getEnv("NORMAL_ARRAY"), ["value 1", "value 2", "value 3"]);
      assert.isUndefined(process.env.ENV_PRESETS_STRING);
      assert.equal(process.env.DEVEBOT_PRESETS_STRING, "hello devebot");
      assert.isUndefined(process.env.ENV_EMPTY_ARRAY1);
      assert.isUndefined(process.env.ENV_EMPTY_ARRAY2);
      assert.equal(process.env.DEVEBOT_NORMAL_ARRAY, "value 1, value 2, value 3");
      assert.equal(process.env.ENV_TRUE, "true");
      assert.equal(process.env.ENV_FALSE, "false");
    });

    afterEach(function() {
      envmask.reset();
    });
  });

  describe('printEnvList()', function() {
    before(function() {
      envmask.setup({
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
        '[+] Environment variables:',
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
      envmask.reset();
    });
  });
});
