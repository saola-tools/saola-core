module.exports = {
  framework: {
    verbose: false,
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
    }
  }
};
