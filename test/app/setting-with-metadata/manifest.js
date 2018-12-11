module.exports = {
  "sandbox": {
    "migration": {
      "0.2.2_0.2.3": {
        "from": "0.2.2",
        "to": "0.2.3",
        "transform": function(source) {
          return source;
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
};
