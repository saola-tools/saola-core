module.exports = {
  plugins: {
    pluginCase0: {
      host: "localhost",
      port: 17704
    }
  },
  bridges: {
    bridgeCase0: {
      pluginCase0: {
        default: {
          apiToken: "plugin-case0/bridge-case0",
          apiSecret: "lf3aezk10xgldbho1xb"
        }
      }
    }
  }
};
