# Development guide

### Remove `[]`

Search pattern:

```regexp
chores\.isUpgradeSupported\(\[('[a-zA-Z-]*')\]\)
```

Replace by:

```regexp
chores.isUpgradeSupported($1)
```
