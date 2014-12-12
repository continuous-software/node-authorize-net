var AuthorizeGateway = require('./lib/AuthorizeNetGateway.js');

module.exports = function gatewayFactory(conf) {
    return new AuthorizeGateway(conf);
};
