module.exports = {
  "config": {
    "migration": {
      "0.0.1_0.1.0": {
        "from": "0.0.1",
        "transform": function(source) {
          return { server: source };
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
          "server": {
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
        },
        "required": ["server"],
      }
    }
  }
};
