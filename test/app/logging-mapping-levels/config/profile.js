module.exports = {
  framework: {
    verbose: false,
    jobqueue: {
      enabled: true
    }
  },
  logger: {
    labels: {
      silly: {
        level: 5,
        color: "gray",
        admit: ["info", "silly"]
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
        admit: "nothing"
      },
      warn: {
        level: 1,
        color: "yellow",
        admit: "warn"
      },
      error: {
        level: 0,
        color: "red",
        admit: ["error", "fatal"]
      }
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
  },
  newFeatures: {
    application: {
      logoliteEnabled: false,
      sandboxConfig: false
    },
    bridge1: {
      sandboxConfig: false
    },
    bridge2: {
      sandboxConfig: false
    }
  }
};
