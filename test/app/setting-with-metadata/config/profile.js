module.exports = {
  devebot: {
    mode: "tictac",
    verbose: false,
    jobqueue: {
      enabled: false
    }
  },
  decorator: {
    logging: {
      streamIdExtractor: function(appInfo, instanceId) {
        return instanceId + "@" + appInfo.version;
      }
    }
  },
  logger: {
    transports: {
      console: {
        type: "console",
        level: "debug",
        json: false,
        timestamp: true,
        colorize: true
      }
    }
  }
};
