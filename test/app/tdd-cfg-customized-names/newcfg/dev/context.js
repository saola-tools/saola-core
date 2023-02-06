module.exports = {
  framework: {
    verbose: false,
    mode: "silent"
  },
  logger: {
    transports: {
      console: {
        type: "console",
        level: "info",
        json: false,
        timestamp: true,
        colorize: true
      }
    }
  }
};
