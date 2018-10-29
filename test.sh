#!/usr/bin/env bash

npm test
DEVEBOT_UPGRADE_DISABLED=presets npm test
DEVEBOT_UPGRADE_DISABLED=bridge-full-ref npm test
DEVEBOT_UPGRADE_DISABLED=bridge-full-ref,presets npm test
DEVEBOT_UPGRADE_DISABLED=standardizing-config npm test
DEVEBOT_UPGRADE_DISABLED=standardizing-config,bridge-full-ref npm test
DEVEBOT_UPGRADE_DISABLED=standardizing-config,bridge-full-ref,presets npm test
DEVEBOT_UPGRADE_DISABLED=gadget-around-log npm test
