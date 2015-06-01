var conf = require('../config.js');
var assert = require('assert');
var GatewayError = require('42-cent-base').GatewayError;
var AuthorizeGateway = require('../index.js');
var SubscriptionPlan = require('42-cent-model').SubscriptionPlan;
var CreditCard = require('42-cent-model').CreditCard;
var Prospect = require('42-cent-model').Prospect;
var Order = require('42-cent-model').Order;
var casual = require('casual');

describe('AuthorizeNet service', function () {

  var service;

  //to avoid duplicate transaction we change the amount
  function randomAmount () {
    return Math.ceil(Math.random() * 300);
  }

  beforeEach(function () {
    conf.testMode = true;
    service = AuthorizeGateway(conf);
  });

  describe('authorizationCapture', function () {

    it('should submit transaction request', function (done) {
      var cc = new CreditCard()
        .withCreditCardNumber('4012888818888')
        .withExpirationYear(2017)
        .withExpirationMonth('1')
        .withCvv2('666');

      var order = new Order()
        .withAmount(randomAmount());

      service.submitTransaction(order, cc).then(function (result) {
        assert.equal(result.authCode, result._original.authCode);
        assert.equal(result.transactionId, result._original.transId);
        done();
      }).catch(function (err) {
        done(err);
      });
    });

    it('should support prospect avs fields', function (done) {
      var cc = new CreditCard()
        .withCreditCardNumber('4012888818888')
        .withExpirationYear('2017')
        .withExpirationMonth('1')
        .withCvv2('666');

      var prospect = new Prospect()
        .withBillingLastName(casual.last_name)
        .withBillingFirstName(casual.first_name)
        .withBillingAddress1(casual.address)
        .withBillingCity(casual.city)
        .withBillingPostalCode(casual.zip)
        .withBillingState(casual.state)
        .withBillingCountry(casual.country_code)
        .withShippingLastName(casual.last_name)
        .withShippingFirstName(casual.first_name)
        .withShippingAddress1(casual.address)
        .withShippingCity(casual.city)
        .withShippingPostalCode(casual.zip)
        .withShippingState(casual.state)
        .withShippingCountry(casual.country_code);

      service.submitTransaction({amount: randomAmount()}, cc, prospect).then(function (result) {
        assert.equal(result.authCode, result._original.authCode);
        assert.equal(result.transactionId, result._original.transId);
        done();
      });
    });

    it('should reject the promise when web service send an error code', function (done) {

      var cc = new CreditCard()
        .withCreditCardNumber('234234')
        .withExpirationYear('2016')
        .withExpirationMonth('10')
        .withCvv2('666');

      var order = new Order()
        .withAmount(randomAmount());

      service.submitTransaction(order, cc).then(function () {
        done(new Error('should not get here'));
      }, function (rejection) {
        assert(rejection instanceof GatewayError, 'should be an instance of GatewayError');
        assert.equal(rejection.message, 'The credit card number is invalid.');
        assert(rejection._original, 'original should be defined');
        done();
      });
    });
  });

  describe('authorize only', function () {

    it('should submit transaction request', function (done) {
      var cc = new CreditCard()
        .withCreditCardNumber('4012888818888')
        .withExpirationYear(2017)
        .withExpirationMonth('1')
        .withCvv2('666');

      var order = new Order()
        .withAmount(randomAmount());

      service.authorizeTransaction(order, cc).then(function (result) {
        assert.equal(result.authCode, result._original.authCode);
        assert.equal(result.transactionId, result._original.transId);
        done();
      }).catch(function (err) {
        done(err)
      });
    });

    it('should support prospect avs fields', function (done) {
      var cc = new CreditCard()
        .withCreditCardNumber('4012888818888')
        .withExpirationYear(2017)
        .withExpirationMonth('1')
        .withCvv2('666');

      var prospect = new Prospect()
        .withBillingLastName(casual.last_name)
        .withBillingFirstName(casual.first_name)
        .withBillingAddress1(casual.address)
        .withBillingCity(casual.city)
        .withBillingPostalCode(casual.zip)
        .withBillingState(casual.state)
        .withBillingCountry(casual.country_code)
        .withShippingLastName(casual.last_name)
        .withShippingFirstName(casual.first_name)
        .withShippingAddress1(casual.address)
        .withShippingCity(casual.city)
        .withShippingPostalCode(casual.zip)
        .withShippingState(casual.state)
        .withShippingCountry(casual.country_code);

      var order = new Order()
        .withAmount(randomAmount());

      service.authorizeTransaction(order, cc, prospect).then(function (result) {
        assert.equal(result.authCode, result._original.authCode);
        assert.equal(result.transactionId, result._original.transId);
        done();
      });
    });

    it('should reject the promise when web service send an error code', function (done) {

      var cc = new CreditCard()
        .withCreditCardNumber('234234')
        .withExpirationMonth('10')
        .withExpirationYear('2010')
        .withCvv2('666');

      var order = new Order()
        .withAmount(randomAmount());

      service.authorizeTransaction(order, cc).then(function () {
        done(new Error('should not get here'));
      }, function (rejection) {
        assert(rejection instanceof GatewayError, 'should be an instance of GatewayError');
        assert.equal(rejection.message, 'The credit card number is invalid.');
        assert(rejection._original, 'original should be defined');
        done();
      });
    });
  });

  describe('refund transaction', function () {

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

  describe('void transaction', function () {

    it('should submit transaction request', function (done) {

      var cc = new CreditCard()
        .withCreditCardNumber('4012888818888')
        .withExpirationMonth('1')
        .withExpirationYear(2017)
        .withCvv2('666')

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
          assert(err.message == 'The transaction cannot be found.', 'should have the proper error message');
          done();
        })

    });
  });

  describe('create subscription', function () {
    it('should create a subscription', function (done) {
      var subscription = new SubscriptionPlan({
        amount: Math.floor(Math.random() * 100),
        trialCount: 1,
        trialAmount: '10'
      })
        .withIterationCount('12')
        .withPeriodLength(1)
        .withPeriodUnit('months')
        .withStartingDate(new Date(Date.now() + 7 * 3600 * 24 * 1000));

      var creditCard = new CreditCard()
        .withCreditCardNumber('4111111111111111')
        .withCvv2('123')
        .withExpirationMonth('01')
        .withExpirationYear('2018');

      var prospect = new Prospect()
        .withBillingFirstName('bob')
        .withBillingLastName('leponge');

      service.createSubscription(creditCard, prospect, subscription)
        .then(function (res) {
          assert(res.subscriptionId, 'subscriptionId should be defined');
          assert(res._original, 'original should be defined');
          done();
        })
        .catch(function (err) {
          console.log(err);
        });
    });

    it('should create a subscription without trial period', function (done) {
      var subscription = new SubscriptionPlan({
        amount: Math.floor(Math.random() * 300)
      })
        .withIterationCount('12')
        .withPeriodLength(1)
        .withPeriodUnit('months')
        .withStartingDate(new Date(Date.now() + 7 * 3600 * 24 * 1000));

      var creditCard = new CreditCard()
        .withCreditCardNumber('4111111111111111')
        .withCvv2('123')
        .withExpirationMonth('01')
        .withExpirationYear('2018');

      var prospect = new Prospect()
        .withBillingLastName(casual.last_name)
        .withBillingFirstName(casual.first_name)
        .withBillingAddress1(casual.address)
        .withBillingCity(casual.city)
        .withBillingPostalCode(casual.zip)
        .withBillingState(casual.state)
        .withBillingCountry(casual.country_code)
        .withShippingLastName(casual.last_name)
        .withShippingFirstName(casual.first_name)
        .withShippingAddress1(casual.address)
        .withShippingCity(casual.city)
        .withShippingPostalCode(casual.zip)
        .withShippingState(casual.state)
        .withShippingCountry(casual.country_code);

      service.createSubscription(creditCard, prospect, subscription)
        .then(function (res) {
          assert(res.subscriptionId, 'subscriptionId should be defined');
          assert(res._original, 'original should be defined');
          done();
        })
        .catch(function (err) {
          console.log(err);
        });
    });

    it('should reject the promise', function (done) {
      var subscription = new SubscriptionPlan({amount: Math.floor(Math.random() * 100)})
        .withIterationCount('12')
        .withPeriodLength(1)
        .withPeriodUnit('months')
        .withStartingDate(new Date(Date.now() + 7 * 3600 * 24 * 1000));

      var creditCard = new CreditCard()
        .withCreditCardNumber('4111111111111111')
        .withCvv2('123')
        .withExpirationMonth('01')
        .withExpirationYear('2009');

      var prospect = new Prospect()
        .withBillingLastName(casual.last_name)
        .withBillingFirstName(casual.first_name)
        .withBillingAddress1(casual.address)
        .withBillingCity(casual.city)
        .withBillingPostalCode(casual.zip)
        .withBillingState(casual.state)
        .withBillingCountry(casual.country_code)
        .withShippingLastName(casual.last_name)
        .withShippingFirstName(casual.first_name)
        .withShippingAddress1(casual.address)
        .withShippingCity(casual.city)
        .withShippingPostalCode(casual.zip)
        .withShippingState(casual.state)
        .withShippingCountry(casual.country_code);

      service.createSubscription(creditCard, prospect, subscription)
        .then(function (res) {
          throw new Error('it should not get here');
        }, function (err) {

          assert(err.message, '- The credit card has expired.- Credit Card expires before the start of the subscription.');
          assert(err._original, '_original should be defined');
          done();
        })
        .catch(function (err) {
          console.log(err);
        });
    });
  });

  describe('create customer profile', function () {

    var random = Math.floor(Math.random() * 1000);

    it('should create a customer profile', function (done) {

      var cc = new CreditCard()
        .withCreditCardNumber('4111111111111111')
        .withExpirationMonth('12')
        .withExpirationYear('2017')
        .withCvv2('123');

      var prospect = new Prospect()
        .withBillingEmailAddress(casual.email)
        .withBillingLastName(casual.last_name)
        .withBillingFirstName(casual.first_name)
        .withBillingAddress1(casual.address)
        .withBillingCity(casual.city)
        .withBillingPostalCode(casual.zip)
        .withBillingState(casual.state)
        .withBillingCountry(casual.country_code)
        .withShippingLastName(casual.last_name)
        .withShippingFirstName(casual.first_name)
        .withShippingAddress1(casual.address)
        .withShippingCity(casual.city)
        .withShippingPostalCode(casual.zip)
        .withShippingState(casual.state)
        .withShippingCountry(casual.country_code);


      var options = {
        description: 'TEST at: ' + Date.now()
      };

      service.createCustomerProfile(cc, prospect, prospect, options)
        .then(function (result) {
          assert(result.profileId, ' profileId Should be defined');
          assert(result._original, '_original should be defined');
          done();
        })
        .catch(function (err) {
          console.log(err);
        });
    });

    it('should reject the promise when the gateway return an error', function (done) {
      var cc = new CreditCard()
        .withCreditCardNumber('2323455')
        .withExpirationMonth('12')
        .withExpirationYear('2017')
        .withCvv2('123');

      var prospect = new Prospect()
        .withBillingEmailAddress(casual.email)
        .withBillingLastName(casual.last_name)
        .withBillingFirstName(casual.first_name)
        .withBillingAddress1(casual.address)
        .withBillingCity(casual.city)
        .withBillingPostalCode(casual.zip)
        .withBillingState(casual.state)
        .withBillingCountry(casual.country_code)
        .withShippingLastName(casual.last_name)
        .withShippingFirstName(casual.first_name)
        .withShippingAddress1(casual.address)
        .withShippingCity(casual.city)
        .withShippingPostalCode(casual.zip)
        .withShippingState(casual.state)
        .withShippingCountry(casual.country_code);

      service.createCustomerProfile(cc, prospect)
        .then(function (result) {
          throw new Error('it should not get here');
        }, function (err) {
          assert(err instanceof GatewayError);
          assert(err._original, '_original should be defined');
          assert(err.message.indexOf('- The field length is invalid for Card Number.') != -1);
          done();
        });
    });
  });

  describe('get customer info', function () {

    it('should get the info related to a customer', function (done) {

      var random = Math.floor(Math.random() * 10000);

      var cc = new CreditCard()
        .withCreditCardNumber('4111111111111111')
        .withExpirationMonth('12')
        .withExpirationYear('2017')
        .withCvv2('123');

      var prospect = new Prospect()
        .withBillingEmailAddress(casual.email)
        .withBillingLastName(casual.last_name)
        .withBillingFirstName(casual.first_name)
        .withBillingAddress1(casual.address)
        .withBillingCity(casual.city)
        .withBillingPostalCode(casual.zip)
        .withBillingState(casual.state)
        .withBillingCountry(casual.country_code)
        .withShippingLastName(casual.last_name)
        .withShippingFirstName(casual.first_name)
        .withShippingAddress1(casual.address)
        .withShippingCity(casual.city)
        .withShippingPostalCode(casual.zip)
        .withShippingState(casual.state)
        .withShippingCountry(casual.country_code);

      var profId;

      var options = {
        description: 'TEST at: ' + Date.now()
      };

      service.createCustomerProfile(cc, prospect, prospect, options)
        .then(function (result) {
          profId = result.profileId;
          assert(profId, ' profileId Should be defined');
          assert(result._original, '_original should be defined');
          return service.getCustomerProfile(result.profileId);
        })
        .then(function (res) {
          assert.equal(res._original.profile[0].customerProfileId[0], profId);
          done();
        });
    });
  });

  describe('charge customer profile', function () {


    it('should charge a existing customer', function (done) {

      var random = Math.floor(Math.random() * 1000);


      var cc = new CreditCard()
        .withCreditCardNumber('4111111111111111')
        .withExpirationMonth('12')
        .withExpirationYear('2017')
        .withCvv2('123');

      var prospect = new Prospect()
        .withBillingEmailAddress(casual.email)
        .withBillingLastName(casual.last_name)
        .withBillingFirstName(casual.first_name)
        .withBillingAddress1(casual.address)
        .withBillingCity(casual.city)
        .withBillingPostalCode(casual.zip)
        .withBillingState(casual.state)
        .withBillingCountry(casual.country_code)
        .withShippingLastName(casual.last_name)
        .withShippingFirstName(casual.first_name)
        .withShippingAddress1(casual.address)
        .withShippingCity(casual.city)
        .withShippingPostalCode(casual.zip)
        .withShippingState(casual.state)
        .withShippingCountry(casual.country_code);

      var options = {
        description: 'TEST at: ' + Date.now()
      };

      service.createCustomerProfile(cc, prospect, prospect, options)
        .then(function (result) {
          var randomAmount = Math.floor(Math.random() * 300);
          assert(result.profileId, ' profileId Should be defined');
          assert(result._original, '_original should be defined');

          return service.chargeCustomer({amount: randomAmount}, {profileId: result.profileId});
        })
        .then(function (res) {
          assert.equal(res.transactionId, res._original.transId[0]);
          assert(res._original, '_original should be defined');
          done();
        })
        .catch(function (err) {
          console.log(err);
        });
    });

    it('should reject the promise when the gateway return an error', function (done) {
      return service.chargeCustomer({amount: 234}, {profileId: '1234'})
        .then(function () {
          throw new Error('should not get here');
        }, function (err) {
          assert(err._original, '_original should be defined');
          assert.equal(err.message, '- The record cannot be found.');
          done();
        }
      );
    });
  });
});
