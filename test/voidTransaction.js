var conf = require('../config.js');
var assert = require('assert');
var AuthorizeGateway = require('../index.js');
var CreditCard = require('42-cent-model').CreditCard;
var randomAmount = require('./fixtures/utils.js').randomAmount;

describe('void transaction', function () {
  var service;

  beforeEach(function () {
    conf.testMode = true;
    service = AuthorizeGateway(conf);
  });

  it('should submit transaction request', function () {
    var cc = new CreditCard()
      .withCreditCardNumber('4012888818888')
      .withExpirationMonth('1')
      .withExpirationYear(2019)
      .withCvv2('666');

    var transId;
    return service.submitTransaction({amount: randomAmount()}, cc)
      .then(function (result) {
        transId = result.transactionId;
        return service.voidTransaction(transId);
      })
      .then(function (result) {
        assert.ok(result._original, '_original should be defined');
      });
  });

  it('should reject a promise if gateway return errored message', function () {
    return service.voidTransaction(666)
      .then(function (err) {
        throw new Error('Was not rejected.');
      })
      .catch(function (err) {
        assert.ok(err._original, '_original should be defined');
        assert.strictEqual(err.message, 'The transaction cannot be found.', 'should have the proper error message');
      });
  });

});
