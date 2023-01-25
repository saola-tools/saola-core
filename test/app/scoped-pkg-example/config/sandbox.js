module.exports = {
  application: {
    "host": "0.0.0.0",
    "port": 17770,
    "verbose": true
  },
  bridges: {
    bridgeCase0: {
      application: {
        default: {
          apiToken: "plugin-case0/bridge-case0",
          apiSecret: "fl3aezk10xgldbho1xc"
        }
      }
    },
    bridgeCase1: {
      application: {
        default: {
          key: "application/bridge-case1#default"
        }
      }
    },
    bridgeCase2: {
      application: {
        default: {
          key: "application/bridge-case2#default"
        }
      }
    },
  },
  plugins: {
    pluginCase0: {
      "host": "0.0.0.0",
      "port": 17700,
      "verbose": true
    },
  }
};
