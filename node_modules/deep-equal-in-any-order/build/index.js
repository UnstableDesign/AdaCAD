'use strict';

var _lodash = require('lodash.mapvalues');

var _lodash2 = _interopRequireDefault(_lodash);

var _sortAny = require('sort-any');

var _sortAny2 = _interopRequireDefault(_sortAny);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const sortDeep = object => {
  if (object instanceof Set) {
    return (0, _sortAny2.default)([...object]);
  }
  if (object instanceof Map) {
    return (0, _sortAny2.default)([...object]);
  }
  if (!Array.isArray(object)) {
    if (typeof object !== 'object' || object === null || object instanceof Date) {
      return object;
    }

    return (0, _lodash2.default)(object, sortDeep);
  }

  return (0, _sortAny2.default)(object.map(sortDeep));
};

module.exports = (chai, utils) => {
  const { Assertion } = chai;
  utils.addMethod(Assertion.prototype, 'equalInAnyOrder', function equalInAnyOrder(b, m) {
    const a = utils.flag(this, 'object');
    utils.flag(this, 'object', sortDeep(a));
    this.equal(sortDeep(b), m);
  });

  chai.assert.deepEqualInAnyOrder = (actual, expected, message) => chai.expect(actual).to.deep.equalInAnyOrder(expected, message);
  chai.assert.notDeepEqualInAnyOrder = (actual, expected, message) => chai.expect(actual).to.not.deep.equalInAnyOrder(expected, message);
};