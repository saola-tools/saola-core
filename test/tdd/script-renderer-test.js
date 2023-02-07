"use strict";

const lab = require("../index");
const Devebot = lab.getFramework();
const Promise = Devebot.require("bluebird");
const chores = Devebot.require("chores");
const lodash = Devebot.require("lodash");
const LogConfig = Devebot.require("logolite").LogConfig;
const LogTracer = Devebot.require("logolite").LogTracer;
const envcloak = require("envcloak").instance;

const assert = require("chai").assert;
const sinon = require("sinon");

const constx = require(lab.getFrameworkModule("utils/constx"));
const FRAMEWORK_PACKAGE_NAME = constx.FRAMEWORK.PACKAGE_NAME;

describe("tdd:lib:core:script-renderer", function() {
  this.timeout(lab.getDefaultTimeout());

  let issueInspector = lab.getIssueInspector();
  let {loggingFactory, schemaValidator} = lab.createBasicServices();

  before(function() {
    envcloak.setup({
      LOGOLITE_FULL_LOG_MODE: "false",
      LOGOLITE_ALWAYS_ENABLED: "all",
      LOGOLITE_ALWAYS_MUTED: "all",
      DEVEBOT_NODE_ENV: "test",
    });
    LogConfig.reset();
    issueInspector.reset();
  });

  after(function() {
    envcloak.reset();
    issueInspector.reset();
  });

  describe("WebSocketOutlet", function() {
    let ScriptRenderer = lab.acquireFrameworkModule("backbone/script-renderer");
    let WebSocketOutlet = ScriptRenderer.__get__("WebSocketOutlet");
    let ws = { send: function() {} };
    let outlet = new WebSocketOutlet({
        ws: ws,
        logger: loggingFactory.getLogger(),
        tracer: loggingFactory.getTracer(),
        schemaValidator: schemaValidator
      });
    let testSend = function(state, supposed, expected) {
      let wsStub = null;
      let output = new Promise(function(resolve, reject) {
        wsStub = sinon.stub(ws, "send").callsFake(function(message) {
          false && console.info("Received message: %s", message);
          if (lodash.isEqual(JSON.parse(message), expected)) {
            resolve(message);
          } else {
            reject(message);
          }
        });
        outlet.render(state, supposed);
      });
      output.finally(function() {
        wsStub && wsStub.restore();
      });
      return output;
    };
    let loggingStore = {};

    before(function() {
      assert.isNotNull(WebSocketOutlet);
      LogTracer.setupDefaultInterceptors([{
        accumulator: loggingStore,
        mappings: [{
          allTags: [ chores.toFullname(FRAMEWORK_PACKAGE_NAME, "scriptRenderer"), "definition" ],
          storeTo: "definition"
        }]
      }]);
    });

    beforeEach(function() {
      LogTracer.reset().empty(loggingStore);
    });

    it("WebSocketOutlet render states exactly", function() {
      return Promise.mapSeries([
        {
          state: "definition",
          supposed: {
            text: "Any Object"
          },
          expected: {
            state: "definition",
            payload: {
              text: "Any Object"
            }
          }
        },
        {
          state: "error",
          supposed: null,
          expected: {
            state: constx.WEBSOCKET.STATE.ERROR,
            message: constx.WEBSOCKET.MSG_ON.ERROR
          }
        },
        {
          state: "started",
          supposed: null,
          expected: {
            state: constx.WEBSOCKET.STATE.STARTED,
            message: constx.WEBSOCKET.MSG_ON.STARTED
          }
        },
        {
          state: "cancelled",
          supposed: null,
          expected: {
            state: constx.WEBSOCKET.STATE.CANCELLED,
            message: constx.WEBSOCKET.MSG_ON.CANCELLED
          }
        },
        {
          state: "failed",
          supposed: {
            type: "object",
            title: "My Error",
            label: {
              error: "Error",
              value: "Value"
            },
            data: {
              error: true,
              value: 1024
            }
          },
          expected: {
            state: constx.WEBSOCKET.STATE.FAILED,
            message: constx.WEBSOCKET.MSG_ON.FAILED,
            payload: [{
              type: "object",
              title: "My Error",
              label: {
                error: "Error",
                value: "Value"
              },
              data: {
                error: true,
                value: 1024
              }
            }]
          }
        },
        {
          state: "completed",
          supposed: {
            type: "object",
            title: "My Result",
            label: {
              f_int: "Integer",
              f_boolean: "Boolean",
              f_string: "String"
            },
            data: {
              f_int: 1024,
              f_boolean: true,
              f_string: "Hello"
            }
          },
          expected: {
            state: constx.WEBSOCKET.STATE.COMPLETED,
            message: constx.WEBSOCKET.MSG_ON.COMPLETED,
            payload: [{
              type: "object",
              title: "My Result",
              label: {
                f_int: "Integer",
                f_boolean: "Boolean",
                f_string: "String"
              },
              data: {
                f_int: 1024,
                f_boolean: true,
                f_string: "Hello"
              }
            }]
          }
        },
        {
          state: "progress",
          supposed: {
            progress: 57,
            data: {
              msg: "processing (57%)"
            }
          },
          expected: {
            state: constx.WEBSOCKET.STATE.PROGRESS,
            message: constx.WEBSOCKET.MSG_ON.PROGRESS,
            percent: 57,
            payload: {
              msg: "processing (57%)"
            },
            progress: 57,
            data: {
              msg: "processing (57%)"
            }
          }
        },
        {
          state: "done",
          supposed: null,
          expected: {
            state: constx.WEBSOCKET.STATE.DONE
          }
        }
      ], function(item) {
        return testSend(item.state, item.supposed, item.expected);
      });
    });

    after(function() {
      LogTracer.clearInterceptors();
    });
  });

  describe("standardizeOutput()", function() {
    let ScriptRenderer = lab.acquireFrameworkModule("backbone/script-renderer");
    let standardizeOutput = ScriptRenderer.__get__("standardizeOutput");

    let jsonOutput = {
      type: "json",
      title: "JSON format example",
      data: {
        text: "Any JSON object"
      }
    };
    let objectOutput = {
      type: "object",
      title: "Object/Record format example",
      data: {
        error: true,
        value: 1024
      },
      label: {
        error: "Error",
        value: "Value"
      }
    };
    let tableOutput = {
      type: "table",
      title: "Table/Grid format example",
      data: [{
        no: 1,
        id: "unique#1",
        name: "Item 1"
      }, {
        no: 2,
        id: "unique#2",
        name: "Item 2"
      }, {
        no: 3,
        id: "unique#3",
        name: "Item 3"
      }],
      label: {
        no: "No.",
        id: "ID",
        name: "Name"
      }
    };
    let invalidObjectFormat = {
      type: "object",
      title: "Object/Record format example",
      data: {
        error: true,
        value: 1024
      },
      label: "Should be an object"
    };

    it("standardize valid json-type output correctly", function() {
      let expected = [jsonOutput];
      assert.deepEqual(standardizeOutput(schemaValidator,  jsonOutput, true), expected);
      assert.deepEqual(standardizeOutput(schemaValidator, [jsonOutput], true), expected);
    });

    it("standardize valid object-type output correctly", function() {
      let expected = [objectOutput];
      assert.deepEqual(standardizeOutput(schemaValidator,  objectOutput, true), expected);
      assert.deepEqual(standardizeOutput(schemaValidator, [objectOutput], true), expected);
    });

    it("standardize valid table-type output correctly", function() {
      let expected = [tableOutput];
      assert.deepEqual(standardizeOutput(schemaValidator,  tableOutput, true), expected);
      assert.deepEqual(standardizeOutput(schemaValidator, [tableOutput], true), expected);
    });

    it("standardize composed of output formats correctly", function() {
      let mixed = [jsonOutput, tableOutput, objectOutput];
      let expected = [jsonOutput, tableOutput, objectOutput];
      assert.deepEqual(standardizeOutput(schemaValidator,  mixed, true), expected);
    });

    it("standardizing invalid formats will return JSON output", function() {
      let expected = [{
        type: "json",
        title: constx.WEBSOCKET.MSG_ON.FAILED,
        data: invalidObjectFormat
      }];
      assert.deepEqual(standardizeOutput(schemaValidator,  invalidObjectFormat, true), expected);
    });
  });
});
