module.exports = {
  devebot: {
    verbose: false,
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
    bridge1: {
      logoliteEnabled: true
    },
    bridge2: {
      logoliteEnabled: true
    }
  }
}