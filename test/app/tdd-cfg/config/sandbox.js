module.exports = {
  application: {
    "host": "0.0.0.0",
    "port": 17700,
    "verbose": true
  },
  bridges: {
    "bridge1": {
      "plugin1": {
        "anyname1a": {
          "refPath": "sandbox -> bridge1 -> plugin1 -> anyname1a"
        },
        "anyname1c": {
          "refPath": "sandbox -> bridge1 -> plugin1 -> anyname1c"
        }
      }
    },
    "bridge2": {
      "plugin2": {
        "anyname2b": {
          "refPath": "sandbox -> bridge2 -> plugin2 -> anyname2b"
        }
      }
    }
  },
  plugins: {
    "plugin1": {
      "host": "0.0.0.0",
      "port": 17701
    },
    "plugin2": {
      "host": "0.0.0.0",
      "port": 17702
    }
  }
}