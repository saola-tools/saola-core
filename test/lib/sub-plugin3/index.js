"use strict";

const lab = require("../../index");

module.exports = lab.getFramework().registerLayerware(__dirname, [
  {
    name: "plugin1",
    path: lab.getLibHome("plugin1")
  },
  {
    name: "plugin2",
    path: lab.getLibHome("plugin2")
  }
], [
  {
    name: "bridge1",
    path: lab.getLibHome("bridge1")
  },
  {
    name: "bridge2",
    path: lab.getLibHome("bridge2")
  }
]);

module.exports.manifest = require("./manifest");
