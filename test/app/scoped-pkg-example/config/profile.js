module.exports = {
  framework: {
    verbose: true,
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
