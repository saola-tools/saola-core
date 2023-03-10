"use strict";

const lab = require("../index");
const FRWK = lab.getFramework();
const lodash = FRWK.require("lodash");
const debugx = FRWK.require("pinbug")("devteam:tdd:core:logging-factory");
const LoggingFactory = require(lab.getFrameworkModule("backbone/logging-factory"));
const LogAdapter = FRWK.require("logolite").LogAdapter;
const MockLogger = FRWK.require("logolite").MockLogger;
const envcloak = require("envcloak").instance;

const { assert } = require("liberica");

const constx = require(lab.getFrameworkModule("utils/constx"));
const FRAMEWORK_PACKAGE_NAME = constx.FRAMEWORK.PACKAGE_NAME;

describe("tdd:lib:core:logging-factory", function() {
  describe("logging backward compatible", function() {
    let LoggingFactory = lab.acquireFrameworkModule("backbone/logging-factory");
    let transformLoggingLabels = LoggingFactory.__get__("transformLoggingLabels");
    assert.isNotNull(transformLoggingLabels);

    before(function() {
      envcloak.setup({
        LOGOLITE_FULL_LOG_MODE: "false",
        LOGOLITE_ALWAYS_MUTED: "all"
      });
    });

    beforeEach(function() {
      LoggingFactory.reset();
    });

    after(function() {
      envcloak.reset();
    });

    it("transformLoggingLabels() accept null parameter", function() {
      let output = transformLoggingLabels(null);
      false && console.info("transformLoggingLabels(): ", output);
      assert.deepEqual(output, {});
    });

    it("transformLoggingLabels() accept empty parameter", function() {
      let output = transformLoggingLabels({});
      false && console.info("transformLoggingLabels(): ", output);
      assert.deepEqual(output, {});
    });

    it("transformLoggingLabels() transform logging labels correctly", function() {
      let loggerCfg = {
        labels: {
          verbose: {
            level: 6,
            color: "magenta",
            admit: "silly"
          },
          debug: {
            level: 5,
            color: "blue",
            admit: "debug"
          },
          info: {
            level: 4,
            color: "cyan",
            admit: "trace"
          },
          trace: {
            level: 3,
            color: "green",
            admit: "info"
          },
          warn: {
            level: 2,
            color: "yellow",
            admit: "warn"
          },
          error: {
            level: 1,
            color: "red",
            admit: "error"
          },
          fatal: {
            level: 0,
            color: "orange"
          }
        }
      };

      let expected = {
        levels: {
          verbose: 6,
          debug: 5,
          info: 4,
          trace: 3,
          warn: 2,
          error: 1,
          fatal: 0
        },
        colors: {
          verbose: "magenta",
          debug: "blue",
          info: "cyan",
          trace: "green",
          warn: "yellow",
          error: "red",
          fatal: "orange"
        },
        mappings: {
          silly: "verbose",
          debug: "debug",
          trace: "info",
          info: "trace",
          warn: "warn",
          error: "error"
        }
      };

      let output = transformLoggingLabels(loggerCfg.labels);
      false && console.info("transformLoggingLabels(): ", output);
      assert.deepEqual(output, expected);
    });

    it("transformLoggingLabels() transform logging labels + mappings correctly", function() {
      let loggerCfg = {
        labels: {
          verbose: {
            level: 6,
            color: "magenta",
            admit: "silly"
          },
          debug: {
            level: 5,
            color: "blue",
            admit: "debug"
          },
          info: {
            level: 4,
            color: "cyan",
            admit: "trace"
          },
          trace: {
            level: 3,
            color: "green",
            admit: "info"
          },
          warn: {
            level: 2,
            color: "yellow",
            admit: "warn"
          },
          error: {
            level: 1,
            color: "red",
            admit: "error"
          },
          fatal: {
            level: 0,
            color: "orange"
          }
        },
        mappings: {
          info: "text, message",
          trace: ["track", "trail"]
        }
      };

      let expected = {
        levels: {
          verbose: 6,
          debug: 5,
          info: 4,
          trace: 3,
          warn: 2,
          error: 1,
          fatal: 0
        },
        colors: {
          verbose: "magenta",
          debug: "blue",
          info: "cyan",
          trace: "green",
          warn: "yellow",
          error: "red",
          fatal: "orange"
        },
        mappings: {
          silly: "verbose",
          debug: "debug",
          trace: "info",
          info: "trace",
          warn: "warn",
          error: "error",
          text: "info",
          message: "info",
          track: "trace",
          trail: "trace"
        }
      };

      let output = transformLoggingLabels(loggerCfg.labels, loggerCfg.mappings);
      false && console.info("transformLoggingLabels(): ", output);
      assert.deepEqual(output, expected);
    });

    it("old logging messages are mapped to new logging labels", function() {
      let factory = new LoggingFactory({
        profileConfig: {
          logger: {
            labels: {
              level_s: {
                level: 5,
                color: "magenta",
                admit: "silly"
              },
              level_d: {
                level: 4,
                color: "blue",
                admit: "debug"
              },
              level_i: {
                level: 3,
                color: "cyan",
                admit: "info"
              },
              level_t: {
                level: 2,
                color: "green",
                admit: "trace"
              },
              level_w: {
                level: 1,
                color: "yellow",
                admit: "warn"
              },
              level_e: {
                level: 0,
                color: "red",
                admit: ["error", "fatal"]
              }
            },
            mappings: {
              level_i: "text",
              level_t: ["track", "trail"]
            },
            transports: {
              console: {
                type: "console",
                level: "level_d",
                json: false,
                timestamp: true,
                colorize: true
              }
            }
          }
        }
      });

      let rootTracer = factory.getTracer();
      let rootLogger = factory.getLogger();
      let mockLogger = new MockLogger({
        levels: {
          level_s: 5,
          level_d: 4,
          level_i: 3,
          level_t: 2,
          level_w: 1,
          level_e: 0
        },
        level: "level_i"
      });
      LogAdapter.addInterceptor(mockLogger);

      rootLogger.log("silly", "Silly message #1");
      rootLogger.log("error", "Error message #1");
      rootLogger.log("error", "Error message #2");
      rootLogger.log("trace", "Trace message #1");
      rootLogger.log("track", "Track message #1");
      rootLogger.log("trail", "Trail message #1");
      rootLogger.log("fatal", "Error message #3");

      let msgs = mockLogger._reset();
      false && console.info(JSON.stringify(msgs, null, 2));

      assert.deepEqual(msgs, [
        {
          "severity": "level_e",
          "payload": "Error message #1"
        },
        {
          "severity": "level_e",
          "payload": "Error message #2"
        },
        {
          "severity": "level_t",
          "payload": "Trace message #1"
        },
        {
          "severity": "level_t",
          "payload": "Track message #1"
        },
        {
          "severity": "level_t",
          "payload": "Trail message #1"
        },
        {
          "severity": "level_e",
          "payload": "Error message #3"
        }
      ]);
    });
  });

  describe("extend Tracer using branch() method", function() {
    before(function() {
      envcloak.setup({
        LOGOLITE_FULL_LOG_MODE: "false",
        LOGOLITE_DEBUGLOG_ENABLED: "false",
        LOGOLITE_ALWAYS_MUTED: "all"
      });
    });

    beforeEach(function() {
      LoggingFactory.reset();
    });

    after(function() {
      envcloak.reset();
    });

    it("default Tracer must contain framework information", function() {
      let mockLogger = new MockLogger({
        levels: {
          silly: 5,
          debug: 4,
          trace: 3,
          info: 2,
          warn: 1,
          error: 0
        }
      });
      LogAdapter.clearInterceptors().addInterceptor(mockLogger);

      let factory = new LoggingFactory({
        profileConfig: {
          logger: {
            labels: {
              silly: {
                level: 5,
                color: "magenta",
                admit: "silly"
              },
              debug: {
                level: 4,
                color: "blue",
                admit: "debug"
              },
              trace: {
                level: 3,
                color: "cyan",
                admit: "trace"
              },
              info: {
                level: 2,
                color: "green",
                admit: "info"
              },
              warn: {
                level: 1,
                color: "yellow",
                admit: "warn"
              },
              error: {
                level: 0,
                color: "red",
                admit: "error"
              }
            },
            mappings: {
              info: "affix"
            },
            transports: {
              console: {
                type: "console",
                level: "debug",
                json: false,
                timestamp: true,
                colorize: true
              }
            }
          }
        }
      });

      let rootTracer = factory.getTracer();

      let queue = mockLogger._reset();

      debugx.enabled && debugx("Logging messages: %s", JSON.stringify(queue, null, 2));
      /*
      [
        {
          "severity": "info",
          "payload": {
            "instanceId": "dUr6BLK5Sjei7mk_yXlwlQ",
            "message": "Application Information",
            "lib_name": constx.FRAMEWORK.NAMESPACE,
            "lib_version": "0.2.7",
            "os_name": "linux",
            "os_version": "4.4.0-119-generic",
            "os_arch": "x64",
            "_tags_": [
              "logolite-metadata"
            ]
          }
        },
        {
          "severity": "info",
          "payload": {
            "instanceId": "dUr6BLK5Sjei7mk_yXlwlQ",
            "blockId": "4gxTt5E2RKquSPeYXeoIjg",
            "parentKey": "instanceId",
            "parentValue": "dUr6BLK5Sjei7mk_yXlwlQ",
            "blockName": constx.FRAMEWORK.NAMESPACE,
            "_tags_": [
              constx.FRAMEWORK.NAMESPACE + "-metadata"
            ]
          }
        }
      ]
      */
      assert.equal(queue.length, 2);
      queue.forEach(function(item) {
        item.payload = JSON.parse(item.payload);
      });

      assert.equal(lodash.get(queue, [0, "severity"]), "info");
      assert.equal(lodash.get(queue, [0, "payload", "lib_name"]), FRAMEWORK_PACKAGE_NAME);
      assert.containsAllKeys(lodash.get(queue, [0, "payload"]), [
        "instanceId",
        "message",
        "lib_name",
        "lib_version",
        "os_name",
        "os_version",
        "os_arch"
      ]);

      assert.equal(lodash.get(queue, [1, "severity"]), "info");
      assert.equal(lodash.get(queue, [1, "payload", "blockName"]), FRAMEWORK_PACKAGE_NAME);
      assert.containsAllKeys(lodash.get(queue, [1, "payload"]), [
        "instanceId",
        "blockId",
        "blockName",
        "parentKey",
        "parentValue"
      ]);

      assert.equal(
        lodash.get(queue, [0, "payload", "instanceId"]),
        lodash.get(queue, [1, "payload", "instanceId"])
      );

      let logObject_1 = rootTracer.toMessage();
      assert.deepEqual(
        lodash.pick(JSON.parse(logObject_1), ["instanceId", "blockId"]),
        lodash.pick(lodash.get(queue, [1, "payload"]), ["instanceId", "blockId"])
      );
    });

    it("recursive branch() calls will return hierarchical loggingFactory objects", function() {
      let mockLogger = new MockLogger({
        levels: {
          silly: 5,
          debug: 4,
          trace: 3,
          info: 2,
          warn: 1,
          error: 0
        }
      });
      LogAdapter.clearInterceptors().addInterceptor(mockLogger);

      let factory = new LoggingFactory({
        profileConfig: {
          logger: {
            labels: {
              silly: {
                level: 5,
                color: "magenta",
                admit: "silly"
              },
              debug: {
                level: 4,
                color: "blue",
                admit: "debug"
              },
              trace: {
                level: 3,
                color: "cyan",
                admit: "trace"
              },
              info: {
                level: 2,
                color: "green",
                admit: "info"
              },
              warn: {
                level: 1,
                color: "yellow",
                admit: "warn"
              },
              error: {
                level: 0,
                color: "red",
                admit: "error"
              }
            },
            mappings: {
              info: "affix"
            },
            transports: {
              console: {
                type: "console",
                level: "debug",
                json: false,
                timestamp: true,
                colorize: true
              }
            }
          }
        }
      });

      let childFactory1 = factory.branch("child1");
      let childFactory2 = factory.branch("child2");
      let factory_2_1 = childFactory2.branch("grand-child-1");
      let factory_2_2 = childFactory2.branch("grand-child-2");

      let logObject_1 = childFactory1.getTracer().toMessage();

      let queue = mockLogger._reset();

      debugx.enabled && debugx("Logging messages: %s", JSON.stringify(queue, null, 2));
      assert.equal(queue.length, 2 + 4);
      queue.forEach(function(item) {
        item.payload = JSON.parse(item.payload);
      });

      let logObject_2 = childFactory2.getTracer().toMessage();
      let logObject_2_1 = factory_2_1.getTracer().toMessage();
      let logObject_2_2 = factory_2_2.getTracer().toMessage();

      assert.isTrue(factory.getLogger() === factory.getLogger());
      assert.isTrue(factory.getTracer() === factory.getTracer());

      assert.isTrue(factory.getTracer() !== childFactory1.getTracer());
      assert.isTrue(factory.getLogger() !== childFactory1.getLogger());
      assert.isTrue(factory.getTracer() !== factory_2_1.getTracer());
      assert.isTrue(factory.getLogger() !== factory_2_1.getLogger());

      assert.equal(lodash.get(queue, [1, "payload", "blockName"]), FRAMEWORK_PACKAGE_NAME);
      assert.equal(lodash.get(queue, [2, "payload", "blockName"]), "child1");
      assert.equal(lodash.get(queue, [3, "payload", "blockName"]), "child2");
      assert.equal(lodash.get(queue, [4, "payload", "blockName"]), "grand-child-1");
      assert.equal(lodash.get(queue, [5, "payload", "blockName"]), "grand-child-2");

      assert.deepEqual(
        lodash.pick(JSON.parse(logObject_1), ["instanceId", "blockId"]),
        lodash.pick(lodash.get(queue, [2, "payload"]), ["instanceId", "blockId"])
      );

      assert.deepEqual(
        lodash.pick(JSON.parse(logObject_2), ["instanceId", "blockId"]),
        lodash.pick(lodash.get(queue, [3, "payload"]), ["instanceId", "blockId"])
      );
    });
  });
});
