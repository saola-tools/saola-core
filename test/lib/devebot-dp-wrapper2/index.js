'use strict';

var lab = require('../../index');
var devebot = lab.getDevebot();

module.exports = devebot.registerLayerware(__dirname, [], []);
