module.exports = {
  schema: {
    "type": "object",
    "properties": {
      "refPath": {
        "type": "string"
      },
      "refType": {
        "type": "string"
      },
      "refName": {
        "type": "string"
      }
    },
    "required": ["refName", "refType"]
  }
};
