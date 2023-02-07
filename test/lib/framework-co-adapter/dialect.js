"use strict";

const lodash = Devebot.require("lodash");

function Dialect (params = {}) {
  this.getConfig = function() {
    return lodash.cloneDeep(params);
  };
};

Dialect.manifest = require("./manifest");

module.exports = Dialect;
