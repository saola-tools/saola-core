var lodash = require('lodash');

var x = {
  a: {
    x: {
      msg: 'tring'
    }
  },
  b: 100
};

console.log('lodash.pick: %s', JSON.stringify(lodash.pick(x, ['a.x', 'b'])));

lodash.forEach(x, function(obj) {
  console.log(JSON.stringify(obj));
})
