"use strict";

const lodash = FRWK.require("lodash");

function Dialect (params = {}) {
  this.getConfig = function() {
    return lodash.cloneDeep(params);
  };
};

Dialect.manifest = require("./manifest");

module.exports = Dialect;
