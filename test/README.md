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
DEVEBOT_UPGRADE_ENABLED=metadata-refiner \
DEVEBOT_UPGRADE_DISABLED=manifest-refiner \
npm run test
```
