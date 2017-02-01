var conf = require('../config.js');
var assert = require('assert');
var GatewayError = require('42-cent-base').GatewayError;
var AuthorizeGateway = require('../index.js');
var CreditCard = require('42-cent-model').CreditCard;

describe('refund transaction', function () {
  var service;

  beforeEach(function () {
    conf.testMode = true;
    service = AuthorizeGateway(conf);
  });

  xit('should refund an already settled transaction', function () {
    var transId;

    return service.getSettledBatchList(new Date(Date.now() - 30 * 24 * 3600 * 1000), new Date())
      .then(function (response) {
        var batchId = response[0].batchId;
        return service.getTransactionList(batchId);
      })
      .then(function (response) {
        transId = response[0].transaction[0].transId;
        return service.refundTransaction(transId, {expirationMonth: '01', expirationYear: '17'});
      })
      .then(function (result) {
        assert.ok(result._original, '_original should be defined');
        assert.strictEqual(result._original.transactionResponse.refTransId, transId, 'transaction id does not match');
      });
  });

  xit('should support partial refund', function () {
    var transId;

    return service.getSettledBatchList(new Date(Date.now() - 30 * 24 * 3600 * 1000), new Date())
      .then(function (response) {
        var batchId = response[0].batchId;
        return service.getTransactionList(batchId);
      })
      .then(function (response) {
        transId = response[0].transaction[0].transId;
        return service.refundTransaction(transId, {expirationMonth: '01', expirationYear: '17', amount: 2.00});
      })
      .then(function (result) {
        assert.ok(result._original, '_original should be defined');
        assert.strictEqual(result._original.transactionResponse.refTransId, transId, 'transaction id does not match');
      });
  });

  it('should reject the promise if the gateway return error', function () {
    var cc = new CreditCard()
      .withExpirationMonth('01')
      .withExpirationYear('19');

    return service.refundTransaction(666, cc)
      .then(function () {
        throw new Error('Was not rejected.');
      })
      .catch(function (err) {
        assert.ok(err instanceof GatewayError, 'expected instance of GatewayError');
      });
  });

});
