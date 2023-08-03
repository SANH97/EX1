var crypto = require('crypto');

module.exports = function(password){
    return crypto.createHash('sha512').update( password).digest('base64');
};