module.exports = {
  "config": {
    "migration": {
      "0.1.0_0.1.2": {
        "enabled": false,
        "from": "0.1.0",
        "transform": function(source) {
          return { mariadb: source };
        }
      },
      "0.1.1_0.1.2": {
        "from": "0.1.1",
        "transform": function(source) {
          return { mongodb: source };
        }
      },
    },
    "validation": {
      "checkConstraints": function(mixedConfig) {
        return true;
      },
      "schema": {
        "type": "object",
        "properties": {
          "mongodb": {
            "type": "object",
            "properties": {
              "host": {
                "type": "string"
              },
              "port": {
                "type": "number"
              },
              "verbose": {
                "type": "boolean"
              }
            },
            "required": ["host", "port"]
          }
        }
      }
    }
  }
};
