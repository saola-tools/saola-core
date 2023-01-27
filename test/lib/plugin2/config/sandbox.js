module.exports = {
  plugins: {
    plugin2: {
      host: "localhost",
      port: 17702,
      tdd: {
        field1: "String 2",
        field2: 10002,
        field3: { foo: "foo", bar: "bar", num: 1002 },
        field4: [ 1, 2, 3, null, "4" ]
      }
    }
  },
  bridges: {
    "anyname1b": {
      "bridge1": {
        "refPath": "sandbox -> bridge1 -> anyname1b",
        "refType": "plugin",
        "refName": "plugin2"
      }
    },
    "anyname1c": {
      "bridge1": {
        "refPath": "sandbox -> bridge1 -> anyname1c",
        "refType": "plugin",
        "refName": "plugin2"
      }
    },
    "anyname2b": {
      "bridge2": {
        "refPath": "sandbox -> bridge2 -> anyname2b",
        "refType": "plugin",
        "refName": "plugin2"
      }
    },
  }
};
