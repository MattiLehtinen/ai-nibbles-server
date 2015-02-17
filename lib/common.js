var crypto = require('crypto');

exports.randomValueHex  = function(len) {
    return crypto.randomBytes(Math.ceil(len/2))
        .toString('hex') // convert to hexadecimal format
        .slice(0,len);   // return required number of characters
};


exports.randomInt = function (low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
};

