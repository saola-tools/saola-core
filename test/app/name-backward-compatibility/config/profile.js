module.exports = {
  framework: {
    verbose: false,
    jobqueue: {
      enabled: false
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
    }
  }
};
