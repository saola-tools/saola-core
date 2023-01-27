"use strict";

const lab = require("../../index");
const devebot = lab.getDevebot();

module.exports = devebot.registerLayerware(__dirname, [], [
  {
    name: "bridge-kebab-case1",
    path: lab.getLibHome("bridge-kebab-case1")
  },
  {
    name: "bridge-kebab-case2",
    path: lab.getLibHome("bridge-kebab-case2")
  },
  {
    name: "devebot-co-connector1",
    path: lab.getLibHome("devebot-co-connector1")
  },
  {
    name: "devebot-co-connector2",
    path: lab.getLibHome("devebot-co-connector2")
  }
]);
