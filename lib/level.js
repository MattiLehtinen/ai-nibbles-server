var _ = require('lodash'),
    common = require('./common');

var MIN_WIDTH = 40;
var MIN_HEIGHT = 40;
var MAX_WIDTH = 120;
var MAX_HEIGHT = 120;

module.exports = Level;

/**
 * Creates a new game level.
 * @constructor
 */
function Level() {
    var self = this;
    this.width = common.randomInt(MIN_WIDTH, MAX_WIDTH);
    this.height = common.randomInt(MIN_HEIGHT, MAX_HEIGHT);

    this.map = _.range(self.height).map(function() {
        return _.range(self.width).map(function() {return 0;})
    });
}
