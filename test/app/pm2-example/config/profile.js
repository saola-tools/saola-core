module.exports = {
  devebot: {
    verbose: true,
    mode: "tictac",
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
  }
};
