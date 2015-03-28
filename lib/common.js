var crypto = require('crypto');

/**
 * Returns random hex string of the given length.
 * @param {int} length      Length of the generated string.
 * @returns {string}
 */
exports.randomValueHex  = function(length) {
    return crypto.randomBytes(Math.ceil(length/2))
        .toString('hex') // convert to hexadecimal format
        .slice(0,length);   // return required number of characters
};

/**
 * Returns random integer number between specified range (inclusive).
 * @param {int} low     Min value of the random number
 * @param {int} high    Max value of the random number
 * @returns {int}
 */
exports.randomInt = function (low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
};

