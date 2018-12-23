module.exports = {
  "sandbox": {
    "migration": {
      "0.1.0_0.1.1": {
        "from": "0.1.0",
        "to": "0.1.1",
        "transform": function(source) {
          return { couchdb: source };
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
          "couchdb": {
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
