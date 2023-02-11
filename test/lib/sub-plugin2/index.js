"use strict";

const lab = require("../../index");

module.exports = lab.getFramework().registerLayerware(__dirname, [
  {
    name: "plugin2",
    path: lab.getLibHome("plugin2")
  },
  {
    name: "plugin3",
    path: lab.getLibHome("plugin3")
  }
], [
  {
    name: "bridge2",
    path: lab.getLibHome("bridge2")
  },
  {
    name: "bridge3",
    path: lab.getLibHome("bridge3")
  }
]);
