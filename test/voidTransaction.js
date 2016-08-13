var conf = require('../config.js');
var assert = require('assert');
var AuthorizeGateway = require('../index.js');
var CreditCard = require('42-cent-model').CreditCard;

//to avoid duplicate transaction we change the amount
function randomAmount () {
  return Math.ceil(Math.random() * 300);
}

describe('void transaction', function () {
  var service;

  beforeEach(function () {
    conf.testMode = true;
    service = AuthorizeGateway(conf);
  });

  it('should submit transaction request', function (done) {

    var cc = new CreditCard()
      .withCreditCardNumber('4012888818888')
      .withExpirationMonth('1')
      .withExpirationYear(2017)
      .withCvv2('666');

    var transId;
    service.submitTransaction({amount: randomAmount()}, cc).then(function (result) {
      transId = result.transactionId;
      return service.voidTransaction(transId);
    })
      .then(function (result) {
        assert(result._original, 'original should be defined');
        done();
      })
      .catch(function (err) {
        console.log(err);
      });
  });

  it('should reject a promise if gateway return errored message', function (done) {
    service.voidTransaction(666)
      .then(function (err) {
        throw new Error('should not get here');
      }, function (err) {
        assert(err._original, '_original should be defined');
        assert(err.message === 'The transaction cannot be found.', 'should have the proper error message');
        done();
      });
  });

});
