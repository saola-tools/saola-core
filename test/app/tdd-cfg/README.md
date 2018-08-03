# tdd-cfg

```shell
unset DEVEBOT_CONFIG_PROFILE_ALIASES
unset DEVEBOT_CONFIG_SANDBOX_ALIASES
export DEVEBOT_CONFIG_DIR=$(pwd)/test/app/tdd-cfg/newcfg
export DEVEBOT_CONFIG_ENV=dev
export DEVEBOT_SANDBOX=private1,private2,ev1,ev2
export LOGOLITE_DEBUGLOG_ENABLED=true
export DEBUG=devebot*
node test/app/tdd-cfg/
```
