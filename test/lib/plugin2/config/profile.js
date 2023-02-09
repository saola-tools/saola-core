"use strict";

const lab = require("../../index");
const chores = lab.getFramework().require("chores");
const constx = require(lab.getFrameworkModule("utils/constx"));

const profileConfig = {
  newFeatures: {
    plugin2: {
      logoliteEnabled: true
    }
  }
};

const profileConfigFramework = {
  hashtags: {
    plugin2: 2,
    framework: 2
  }
};

if (chores.isUpgradeSupported("profile-config-field-framework")) {
  profileConfig.framework = profileConfigFramework;
} else {
  profileConfig[constx.LEGACY.PROFILE_CONFIG_FRAMEWORK_FIELD] = profileConfigFramework;
}

module.exports = profileConfig;
