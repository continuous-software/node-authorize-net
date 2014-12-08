var conf = require('./config.js');
var auth = require('./index.js');
var assert = require('assert');
var AuthorizeNetError = require('./lib/errors.js').AuthorizeNetError;

describe('AuthorizeNet service', function () {

    var service;

    //to avoid duplicate transaction we change the amoung
    function randomAmount() {
        return Math.ceil(Math.random() * 100);
    }

    beforeEach(function () {
        service = auth(conf.API_LOGIN_ID, conf.TRANSACTION_KEY);
    });

    describe('authorizationCapture', function () {

        it('should submit authorizationCapture request', function (done) {
            service.authCaptureTransaction(randomAmount(), 4012888818888, 2017, 1).then(function (transaction) {
                assert.equal(transaction.transactionResponse.responseCode, '1');
                done();
            }, function(rejection){
                done(JSON.stringify(rejection));
            });
        });

        it('should submit authorizationCapture request with some extra params', function (done) {
            service.authCaptureTransaction(randomAmount(), 4012888818888, 2016, 10, {
                transactionRequest: {
                    payment: {creditCard: {cardCode: 999}},
                    lineItems : [
                        {lineItem: {itemId:1, name: 'Test Item', quantity:2, unitPrice: 4.99}},
                        {lineItem: {itemId:2, name: 'Test Item2', quantity:3, unitPrice: 5.99}}
                    ],
                    tax : {
                      amount: 2.13,
                      name: 'city tax',
                      description: 'some text here'
                    },
                    duty : {
                      amount: 1.21,
                      name: 'duty name',
                      description: 'duty description'
                    },
                    shipping : {
                      amount: 12.99,
                      name: '2 Day Shipping',
                      description: 'UPS'
                    },
                    poNumber : 'abcd-1234',
                    billTo: {firstName: 'bob', lastName: 'Eponge'},
                    customer : {
                      id : 12345678
                    },
                    userFields : [
                        {userField: {name: 'cartId', value: 'xyx1234'}},
                        {userField: {name: 'discountCode', value: 'xcxcx'}}
                    ]
                }
            }).then(function (transaction) {
                assert.equal(transaction.transactionResponse.responseCode, '1');
                done();
            }, function(rejection){
                done(JSON.stringify(rejection));
            });
          });

        it('should reject the promise when web service send an error code', function (done) {
            service.authCaptureTransaction(randomAmount(), 234234, 2016, 10).then(function () {
                throw new Error('should not get here');
            }, function (rejection) {
                var response = rejection.transactionResponse;
                assert(rejection instanceof AuthorizeNetError);
                assert.equal(response.errors.error.errorCode, 6);
                assert.equal(response.errors.error.errorText, 'The credit card number is invalid.');
                done();
            });
        });

        it('should reject the promise if any error happens', function (done) {
            service.authCaptureTransaction(undefined, 4007000000027, 2016, 10).then(function () {
                throw new Error('should not get here');
            }, function (rejection) {
                assert(rejection instanceof assert.AssertionError);
                assert.equal(rejection.message, 'amount is required');
                done();
            });
        });
    });

    describe('authorization only', function () {

        it('should submit authorization only request', function (done) {
            service.authOnlyTransaction(randomAmount(), 4007000000027, 2016, 2).then(function (transaction) {
                assert.equal(transaction.transactionResponse.responseCode, '1');
                done();
            }).catch(function(rejection){
              done(JSON.stringify(rejection));
            })
        });

        it('should submit authorization only request with extra params', function (done) {
            service.authOnlyTransaction(randomAmount(), 4007000000027, 2017, 11, {transactionRequest: {payment: {creditCard: {cardCode: 666}}}}).then(function (transaction) {
                assert.equal(transaction.transactionResponse.responseCode, '1');
                done();
            }).catch(function(rejection){
              done(JSON.stringify(rejection));
            });
        });

        it('should reject the promise when web service send an error code', function (done) {
            service.authOnlyTransaction(randomAmount(), 234234, 2016, 10).then(function () {
                throw new Error('should not get here');
            }, function (rejection) {
                var response = rejection.transactionResponse;
                assert(rejection instanceof AuthorizeNetError);
                assert.equal(response.errors.error.errorCode, 6);
                assert.equal(response.errors.error.errorText, 'The credit card number is invalid.');
                done();
            });
        });

        it('should reject the promise if any error happens', function (done) {
            service.authOnlyTransaction(undefined, 4007000000027, 2016, 10).then(function () {
                throw new Error('should not get here');
            }, function (rejection) {
                assert(rejection instanceof assert.AssertionError);
                assert.equal(rejection.message, 'amount is required');
                done();
            });
        });
    });

    describe('capture only', function () {

        it('should submit capture only request', function (done) {

            var amount = randomAmount();
            service.authOnlyTransaction(amount, 4007000000027, 2016, 2)
                .then(function (transaction) {
                    return service.priorAuthCaptureTransaction(transaction.transactionResponse.transId, amount);
                })
                .then(function (trans) {
                    assert.equal(trans.transactionResponse.responseCode, '1');
                    done();
                })
                .catch(function (rejection) {
                    done(JSON.stringify(rejection));
                });
        });

        it('should reject the promise when web service send an error code', function (done) {
            service.priorAuthCaptureTransaction(987, 100).then(function () {
                throw new Error('should not get here');
            }, function (rejection) {
                assert(rejection instanceof AuthorizeNetError);
                assert.equal(rejection.transactionResponse.errors.error.errorCode, 16);
                assert.equal(rejection.transactionResponse.errors.error.errorText, 'The transaction cannot be found.');
                done();
            });
        });

        it('should reject the promise if any error happens', function (done) {
            service.priorAuthCaptureTransaction(undefined, 100).then(function () {
                throw new Error('should not get here');
            }, function (rejection) {
                assert(rejection instanceof assert.AssertionError);
                assert.equal(rejection.message, 'refTransId is required');
                done();
            });
        });
    });

    xdescribe('refund transaction', function () {

        it('should submit refund transaction request', function () {

            //todo can not be tested as the settlement happens only once a day
        });

        it('should reject the promise when web service send an error code', function (done) {
            service.refundTransaction(666, 100, 4007000000027, 2016, 1).then(function () {
                throw new Error('should not get here');
            }, function (rejection) {
                assert(rejection instanceof AuthorizeNetError);
                assert.equal(rejection.transactionResponse.errors.error.errorCode, 16);
                assert.equal(rejection.transactionResponse.errors.error.errorText, 'The transaction cannot be found.');
                done();
            });
        });

        it('should reject the promise if any error happens', function (done) {
            service.refund(undefined, 100).then(function () {
                throw new Error('should not get here');
            }, function (rejection) {
                assert(rejection instanceof assert.AssertionError);
                assert.equal(rejection.message, 'refTransId is required');
                done();
            });
        });
    });

    describe('void transaction', function () {
        it('should void a transaction request', function (done) {

            service.authOnlyTransaction(randomAmount(), 4007000000027, 2016, 2)
                .then(function (transaction) {
                    return service.voidTransaction(transaction.transactionResponse.transId);
                })
                .then(function (trans) {
                    assert.equal(trans.transactionResponse.responseCode, '1');
                    done();
                })
                .catch(function(rejection){
                  done(JSON.stringify(rejection));
                });
        });

        it('should reject the promise when web service send an error code', function (done) {
            service.voidTransaction(666).then(function () {
                throw new Error('should not get here');
            }, function (rejection) {
                assert(rejection instanceof AuthorizeNetError);
                assert.equal(rejection.transactionResponse.errors.error.errorCode, 16);
                assert.equal(rejection.transactionResponse.errors.error.errorText, 'The transaction cannot be found.');
                done();
            });
        });

        it('should reject the promise if any error happens', function (done) {
            service.voidTransaction(undefined).then(function () {
                throw new Error('should not get here');
            }, function (rejection) {
                assert(rejection instanceof assert.AssertionError);
                assert.equal(rejection.message, 'refTransId is required');
                done();
            });
        });
    });

    describe('get transaction detail', function () {

        it('should get transaction details', function (done) {

            var amount = randomAmount();
            var transId;
            service.authOnlyTransaction(amount, 4007000000027, 2016, 2)
                .then(function (transaction) {
                    transId = transaction.transactionResponse.transId;
                    return service.getTransactionDetails(transId);
                })
                .then(function (trans) {
                    assert.equal(trans.transaction.responseCode, '1');
                    assert.equal(trans.transaction.transId, transId);
                    done();
                })
                .catch(function(rejection){
                  done(JSON.stringify(rejection));
                });
        });

        it('should reject the promise when web service return error code', function (done) {
            service.getTransactionDetails(666).then(function () {
                throw new Error('should not get here');
            }, function (rejection) {
                assert(rejection instanceof AuthorizeNetError);
                assert.equal(rejection.messages.message.code, 'E00040');
                assert.equal(rejection.messages.message.text, 'The record cannot be found.');
                done();
            });
        });

        it('should reject the promise if any error happens', function (done) {
            service.getTransactionDetails(undefined).then(function () {
                throw new Error('should not get here');
            }, function (rejection) {
                assert(rejection instanceof assert.AssertionError);
                assert.equal(rejection.message, 'refTransId is required');
                done();
            });
        });

    });

    describe('get Unsettled transaction list', function () {

        it('should get the list of unsettled transaction list', function (done) {
            service.getUnsettledTransactionList().then(function (response) {
                assert(response.transactions, 'transactions field should be defined');
                done();
            }).catch(function(rejection){
              done(JSON.stringify(rejection));
            });
        });

    });

    describe('get settled batch list', function () {

        it('should get the list of batched list based on a window of time', function (done) {
            service.getSettledBatchList(true, new Date(Date.now() - 7 * 24 * 3600 * 1000), new Date()).then(function (response) {
                assert(response.batchList, 'batchList should be defined');
                done();
            }).catch(function(rejection){
              done(JSON.stringify(rejection));
            });
        });

    });

    describe('get batch statistics', function () {
        it('should get the batch statistics', function (done) {
            service.getSettledBatchList(true, new Date(Date.now() - 7 * 24 * 3600 * 1000), new Date()).then(function (response) {
                assert(response.batchList, 'batchList should be defined');
                var batchId = response.batchList.batch.length ? response.batchList.batch[0].batchId : response.batchList.batch.batchId;
                return service.getBatchStatistics(batchId);
            })
            .then(function (response) {
                assert(response.batch, 'batch should be defined');
                done();
            }).catch(function(rejection){
              done(JSON.stringify(rejection));
            });
        });

        it('should reject the promise if any error happens', function (done) {
            service.getBatchStatistics().then(function () {
                throw new Error('should not get here');
            }, function (rejection) {
                assert(rejection instanceof assert.AssertionError);
                assert.equal(rejection.message, 'batchId is mandatory');
                done();
            });
        });
    });

    describe('get transactions list', function () {

        it('should get the transaction list of a given batch', function (done) {
            service.getSettledBatchList(true, new Date(Date.now() - 7 * 24 * 3600 * 1000), new Date()).then(function (response) {
                assert(response.batchList, 'batchList should be defined');
                var batchId = response.batchList.batch.length ? response.batchList.batch[0].batchId : response.batchList.batch.batchId;
                return service.getTransactionList(batchId);
            })
            .then(function (response) {
                assert(response.transactions.transaction, 'it should have a list of transactions');
                done();
            }).catch(function(rejection){
              done(JSON.stringify(rejection));
            });
        });
    });

});
