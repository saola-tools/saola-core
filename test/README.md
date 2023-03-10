# Development guide

## Editor

### Remove `[]`

Search pattern:

```regexp
chores\.isUpgradeSupported\(\[('[a-zA-Z-]*')\]\)
```

Replace by:

```plain
chores.isUpgradeSupported($1)
```

### Replace `acquireFrameworkModule`

Search pattern:

```regexp
rewire\(lab\.getFrameworkModule\('(.*)'\)\)
```

Replace by:

```plain
lab.acquireFrameworkModule('$1')
```

## Examples

### state-verification

```
export SAOLA_TASKS=print-config,check-config
DEBUG=none node test/app/state-verification/
```

### tdd-cfg

```shell
unset SAOLA_CONFIG_PROFILE_ALIASES
unset SAOLA_CONFIG_SANDBOX_ALIASES
export SAOLA_CONFIG_DIR=$(pwd)/test/app/tdd-cfg/newcfg
export SAOLA_CONFIG_ENV=dev
export SAOLA_SANDBOX=private1,private2,ev1,ev2
export LOGOLITE_DEBUGLOG_ENABLED=true
export DEBUG=devteam*
node test/app/tdd-cfg/
```

### tdd-cfg-customized-names

```shell
export SAOLA_CONFIG_PROFILE_ALIASES=context
export SAOLA_CONFIG_SANDBOX_ALIASES=setting
export SAOLA_CONFIG_DIR=$(pwd)/test/app/tdd-cfg-customized-names/newcfg
export SAOLA_CONFIG_ENV=dev
export SAOLA_SANDBOX=bs1,bs2
export LOGOLITE_DEBUGLOG_ENABLED=true
export DEBUG=devteam*
node test/app/tdd-cfg-customized-names/
```

### Presets the configure values from environment variables

```shell
export LOGOLITE_ALWAYS_MUTED=all
export SETTING_WITH_METADATA_CONFIG_VAL_sandbox_plugins_plugin1_host=localhost
export SETTING_WITH_METADATA_CONFIG_VAL_sandbox_plugins_plugin1_port=27779
node test/app/setting-with-metadata/ --tasks=print-config
```

```shell
export DEBUG=devteam*,app*
export LOGOLITE_DEBUGLOG_ENABLED=true
```

### Turns on/off the features

```shell
SAOLA_UPGRADE_ENABLED=metadata-refiner \
SAOLA_UPGRADE_DISABLED=manifest-refiner \
npm run test
```
