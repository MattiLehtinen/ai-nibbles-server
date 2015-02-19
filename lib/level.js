var _ = require('lodash');

module.exports = Level;

function Level() {
    var self = this;
    this.width = 192;
    this.height = 108;

    this.map = _.range(self.height).map(function() {
        return _.range(self.width).map(function() {return 0;})
    });
}
