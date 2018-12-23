module.exports = {
  "sandbox": {
    "migration": {
      "0.1.1_0.1.2": {
        "from": "0.1.1",
        "to": "0.1.2",
        "transform": function(source) {
          return { mongodb: source };
        }
      }
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
