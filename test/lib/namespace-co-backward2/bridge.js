"use strict";

const lodash = FRWK.require("lodash");

const Service = function(params = {}) {
  this.getConfig = function() {
    return lodash.cloneDeep(params);
  };
};

module.exports = Service;
