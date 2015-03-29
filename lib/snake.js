var _ = require('lodash');

module.exports = Snake;

var INITIAL_GROW_LENGTH = 2;

/**
 * Creates a new Snake.
 * @param {int} x           Initial x-coordinate
 * @param {int} y           Initial x-coordinate
 * @param {int} direction   Initial direction
 * @constructor
 */
function Snake(x, y, direction) {
    this.alive = true;
    this.body = [[x,y]];
    this.direction = direction; // 1=up, 2=down, 3=left, 4=right
    this.growLength = INITIAL_GROW_LENGTH;
}

/**
 * Sets alive to false if snake is outside specified area.
 * @param {int} minX
 * @param {int} minY
 * @param {int} maxX
 * @param {int} maxY
 */
Snake.prototype.dieIfOutside = function(minX, minY, maxX, maxY) {
    var x = this._head()[0];
    var y = this._head()[1];
    if(x < minX || y < minY || x > maxX || y > maxY) {
        this.alive = false;
    }
};

/**
 * Sets alive to false if some part of snake is on the same coordinates than any
 * part of specified snake.
 * @param {Snake} snake
 */
Snake.prototype.dieIfCollision = function(snake) {
    var self = this;
    if(_.some(snake.body, self._head())) {
        self.alive = false;
    }
};

/**
 * Sets alive to false if head of the snake is on the same coordinates than any
 * other part of the snake.
 */
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
    return _.isEqual(this._head(), point);
};

/**
 * Moves snake according to current direction and grow length.
 */
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

/**
 * Gets current length of the snake (might be less than grow length).
 * @returns {Number}
 */
Snake.prototype.length = function() {
    return this.body.length;
};

/**
 * Gets head coordinates of the snake.
 * @returns {Array}     Head coordinates where [0] is x and [1] is y.
 * @private
 */
Snake.prototype._head = function () {
    return this.body[0];
};
