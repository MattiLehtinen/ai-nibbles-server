var _ = require('lodash');

module.exports = Snake;

var INITIAL_LENGTH = 2;

function Snake(x, y, direction) {
    this.alive = true;
    this.body = [[x,y]];
    this.direction = direction; // 1=up, 2=down, 3=left, 4=right
    this.growLength = INITIAL_LENGTH;
}

Snake.prototype.dieIfOutside = function(minX, minY, maxX, maxY) {
    var x = this._head()[0];
    var y = this._head()[1];
    if(x < minX || y < minY || x > maxX || y > maxY) {
        this.alive = false;
    }
};

Snake.prototype.dieIfCollision = function(snake) {
    var self = this;
    if(_.some(snake.body, self._head())) {
        self.alive = false;
    }
};

Snake.prototype.dieIfCollidingItself = function() {
    var self = this;
    var bodyWithoutHead = _.slice(self.body, 1);
    if(_.some(bodyWithoutHead, self._head())) {
        self.alive = false;
    }
};

/**
 * Returns whether the specified point overlaps with the body (including head) of the snake.
 * @param x
 * @param y
 * @returns {boolean}
 */
Snake.prototype.collides = function(x,y) {
    return _.some(this.body, [x,y]);
};

/**
 * Returns whether the specified point overlaps with the head of the snake.
 * @param point {Array} Point as [x, y]
 * @returns {boolean}
 */
Snake.prototype.headCollides = function(point) {
    console.log("HEAD: " + this._head() + " POINT: " + point);
    return _.isEqual(this._head(), point);
};


Snake.prototype.move = function() {
    var newHead = _.clone(this._head());
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
    if(this.length() > this.growLength) {
        this.body.pop();
    }
};

Snake.prototype.length = function() {
    return this.body.length;
};

Snake.prototype._head = function () {
    return this.body[0];
};
