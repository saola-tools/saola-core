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
    "anyname1a": {
      "bridge1": {
        "refPath": "sandbox -> bridge1 -> anyname1a",
        "refType": "application",
        "refName": "default"
      }
    },
    "anyname1b": {
      "bridge1": {
        "refPath": "sandbox -> bridge1 -> anyname1b",
        "refType": "application",
        "refName": "default"
      }
    },
    "anyname2a": {
      "bridge2": {
        "refPath": "sandbox -> bridge2 -> anyname2a",
        "refType": "application",
        "refName": "default"
      }
    },
    "anyname2b": {
      "bridge2": {
        "refPath": "sandbox -> bridge2 -> anyname2b",
        "refType": "application",
        "refName": "default"
      }
    },
    "anyname2c": {
      "bridge2": {
        "refPath": "sandbox -> bridge2 -> anyname2c",
        "refType": "application",
        "refName": "default"
      }
    }
  }
}