module.exports = {
  devebot: {
    mode: 'tictac',
    verbose: false,
    jobqueue: {
      enabled: false
    }
  },
  logger: {
    transports: {
      console: {
        type: 'console',
        level: 'debug',
        json: false,
        timestamp: true,
        colorize: true
      }
    }
  }
}