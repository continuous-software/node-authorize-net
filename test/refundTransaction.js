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

  xit('should refund an already settled transaction', function (done) {
    var transId;

    service.getSettledBatchList(new Date(Date.now() - 30 * 24 * 3600 * 1000), new Date())
      .then(function (response) {
        var batchId = response[0].batchId;
        return service.getTransactionList(batchId);
      })
      .then(function (response) {
        transId = response[0].transaction[0].transId;
        return service.refundTransaction(transId, {expirationMonth: '01', expirationYear: '17'});
      })
      .then(function (resp) {
        assert(resp._original.transactionResponse.refTransId == transId, '_original should be defined');
        done();
      })
      .catch(function (err) {
        console.log(err);
      });

  });

  xit('should support partial refund', function (done) {
    var transId;

    service.getSettledBatchList(new Date(Date.now() - 30 * 24 * 3600 * 1000), new Date())
      .then(function (response) {
        var batchId = response[0].batchId;
        return service.getTransactionList(batchId);
      })
      .then(function (response) {
        transId = response[0].transaction[0].transId;
        return service.refundTransaction(transId, {expirationMonth: '01', expirationYear: '17', amount: 2.00});
      })
      .then(function (resp) {
        assert(resp._original.transactionResponse.refTransId == transId, '_original should be defined');
        done();
      })
      .catch(function (err) {
        console.log(err);
      });
  });

  it('should reject the promise if the gateway return error', function (done) {
    var cc = new CreditCard()
      .withExpirationMonth('01')
      .withExpirationYear('17');

    return service.refundTransaction(666, cc)
      .then(function () {
        throw new Error('it should not get here');
      }, function (err) {
        assert(err instanceof GatewayError, 'should be an instance of GatewayError');
        done();
      });
  });

});
