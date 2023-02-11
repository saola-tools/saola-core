module.exports = {
  framework: {
    verbose: false,
    mode: "heartbeat",
    jobqueue: {
      enabled: true
    }
  },
  logger: {
    transports: {
      console: {
        type: "console",
        level: "debug",
        json: false,
        timestamp: true,
        colorize: false
      }
    }
  }
};
