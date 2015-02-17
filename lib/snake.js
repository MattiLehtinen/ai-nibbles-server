var  _ = require('lodash'),
    util = require('util'),
    common = require('./common');

module.exports = Snake;

function Snake(x, y, direction) {
    this.body = [[x,y]];
    this.direction = direction; // 1=down, 2=up, 3=left, 4=right
}

Snake.prototype.move = function() {
    var newHead = this._head();
    switch (this.direction) {
        case 1:
            newHead[1]--;
            break;
        case 2:
            newHead[1]++;
            break;
        case 3:
            newHead[0]--;
            break;
        case 4:
            newHead[0]++;
            break;
    }

    this.body.unshift(newHead);
    this.body.pop();
};


Snake.prototype.y = function() {
    return this._head()[0];
};

Snake.prototype.x = function() {
    return this._head()[1];
};

Snake.prototype.length = function() {
    return this.body.length;
};

Snake.prototype._head = function () {
    return this.body[0];
};
