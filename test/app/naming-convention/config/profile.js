module.exports = {
  devebot: {
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
    bridgeKebabCase1: {
      logoliteEnabled: true
    },
    bridgeKebabCase2: {
      logoliteEnabled: true
    },
    connector1: {
      logoliteEnabled: true
    },
    connector2: {
      logoliteEnabled: true
    }
  }
};
