# Development guide

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