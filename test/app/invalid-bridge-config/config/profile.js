module.exports = {
  framework: {
    verbose: true,
  },
  logger: {
    transports: {
      console: {
        type: "console",
        level: "silly",
        json: false,
        timestamp: true,
        colorize: true
      }
    }
  }
};
