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
        type: 'console',
        level: 'error',
        json: false,
        timestamp: true,
        colorize: true
      }
    }
  },
  newFeatures: {
    application: {
      logoliteEnabled: true,
      sandboxConfig: true
    },
    connector1: {
      logoliteEnabled: true
    },
    connector2: {
      logoliteEnabled: true
    }
  }
}