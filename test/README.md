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

### Replace `acquireDevebotModule`

Search pattern:

```regexp
rewire\(lab\.getDevebotModule\('(.*)'\)\)
```

Replace by:

```plain
lab.acquireDevebotModule('$1')
```

## Examples

### Presets the configure values from environment variables

```shell
export LOGOLITE_ALWAYS_MUTED=all
export SETTING_WITH_METADATA_CONFIG_VAL_sandbox_plugins_plugin1_host=localhost
export SETTING_WITH_METADATA_CONFIG_VAL_sandbox_plugins_plugin1_port=27779
node test/app/setting-with-metadata/ --tasks=print-config
```
