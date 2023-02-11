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
      "schema": "invalid json schema object"
    }
  }
};
