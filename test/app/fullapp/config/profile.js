module.exports = {
  framework: {
    verbose: true,
    jobqueue: {
      enabled: true
    }
  },
  logger: {
    transports: {
      console: {
        type: "console",
        level: "error",
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
