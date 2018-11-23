module.exports = {
  application: {
    "host": "0.0.0.0",
    "port": 17700,
    "verbose": false
  },
  plugins: {
    "plugin1": {
      "host": "0.0.0.0",
      "port": 17701,
      "verbose": false,
      "__metadata__": {
        "version": "0.1.1"
      }
    },
    "plugin2": {
      "host": "0.0.0.0",
      "port": 17702,
      "verbose": false,
      "__metadata__": {
        "version": "0.1.1"
      }
    },
    "plugin3": {
      "host": "0.0.0.0",
      "port": 17703,
      "verbose": false,
      "__metadata__": {
        "version": "0.1.1"
      }
    },
    "plugin4": {
      "host": "0.0.0.0",
      "port": 17704,
      "verbose": false,
      "__metadata__": {
        "version": "0.1.1"
      }
    }
  },
  bridges: {
    "bridge4": {
      "application": {
        "instance": {
          "refPath": "sandbox -> bridge1 -> anyname1a",
          "refType": "application",
          "refName": "default"
        }
      }
    }
  }
}