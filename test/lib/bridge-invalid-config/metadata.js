module.exports = {
  schema: {
    "type": "object",
    "properties": {
      "host": {
        "type": "string"
      },
      "port": {
        "type": "number"
      },
      "enabled": {
        "type": "boolean"
      }
    },
    "required": ["host", "port"]
  }
};
