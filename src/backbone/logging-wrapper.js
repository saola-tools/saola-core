'use strict';

const lodash = require('lodash');
const LogAdapter = require('logolite').LogAdapter;
const LogTracer = require('logolite').LogTracer;
const chores = require('../utils/chores');
const constx = require('../utils/constx');
const CHECK = constx.LOGGER.INTERNAL_LEVEL;
const FRAMEWORK_METADATA = constx.FRAMEWORK.NAME + '-metadata';

function LoggingWrapper(sectorName) {
  sectorName = sectorName || chores.getBlockRef(__filename);

  let __logger = null;
  this.getLogger = function() {
    return __logger = __logger || LogAdapter.getLogger({
      sector: sectorName,
      target: 'dunce'
    });
  }

  let __tracer = null;
  this.getTracer = function() {
    if (__tracer == null) {
      const parentTracer = LogTracer.ROOT;
      __tracer = parentTracer.branch({
        key: constx.TRACER.SECTOR.ID_FIELD,
        value: LogTracer.getLogID()
      });

      const blockInfo = {
        parentKey: parentTracer.key,
        parentValue: parentTracer.value
      }
      blockInfo[constx.TRACER.SECTOR.NAME_FIELD] = sectorName;

      const rootLogger = this.getLogger();
      rootLogger.has(CHECK) && rootLogger.log(CHECK, __tracer.add(blockInfo)
          .toMessage({ tags: [ FRAMEWORK_METADATA ] }));
    }
    return __tracer;
  }

  return this;
}

module.exports = LoggingWrapper;
