var conf = require('../config.js');
var assert = require('assert');
var AuthorizeGateway = require('../index.js');
var SubscriptionPlan = require('42-cent-model').SubscriptionPlan;
var CreditCard = require('42-cent-model').CreditCard;
var Prospect = require('42-cent-model').Prospect;
var casual = require('casual');
var GatewayError = require('42-cent-base').GatewayError;
var randomAmount = require('./fixtures/utils.js').randomAmount;

describe('create subscription', function () {
  var service;

  beforeEach(function () {
    conf.testMode = true;
    service = AuthorizeGateway(conf);
  });

  it('should create a subscription', function () {
    var subscription = new SubscriptionPlan({
      amount: randomAmount(100),
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
      .withBillingFirstName(casual.first_name)
      .withBillingLastName(casual.first_name);

    return service.createSubscription(creditCard, prospect, subscription)
      .then(function (result) {
        assert.ok(result.subscriptionId, 'subscriptionId should be defined');
        assert.ok(result._original, '_original should be defined');
      });
  });

  it('should create a subscription without trial period', function () {
    var subscription = new SubscriptionPlan({
      amount: randomAmount(100)
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
      .withBillingAddress1(casual.address.substr(0, 30))
      .withBillingCity(casual.city)
      .withBillingPostalCode(casual.zip)
      .withBillingState(casual.state)
      .withBillingCountry(casual.country_code)
      .withShippingLastName(casual.last_name)
      .withShippingFirstName(casual.first_name)
      .withShippingAddress1(casual.address.substr(0, 30))
      .withShippingCity(casual.city)
      .withShippingPostalCode(casual.zip)
      .withShippingState(casual.state)
      .withShippingCountry(casual.country_code);

    return service.createSubscription(creditCard, prospect, subscription)
      .then(function (result) {
        assert.ok(result.subscriptionId, 'subscriptionId should be defined');
        assert.ok(result._original, '_original should be defined');
      });
  });

  it('should reject the promise', function () {
    var subscription = new SubscriptionPlan({amount: randomAmount(100) })
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
      .withBillingAddress1(casual.address.substr(0, 30))
      .withBillingCity(casual.city)
      .withBillingPostalCode(casual.zip)
      .withBillingState(casual.state)
      .withBillingCountry(casual.country_code)
      .withShippingLastName(casual.last_name)
      .withShippingFirstName(casual.first_name)
      .withShippingAddress1(casual.address.substr(0, 30))
      .withShippingCity(casual.city)
      .withShippingPostalCode(casual.zip)
      .withShippingState(casual.state)
      .withShippingCountry(casual.country_code);

    return service.createSubscription(creditCard, prospect, subscription)
      .then(function () {
        throw new Error('Was not rejected.');
      })
      .catch(function (err) {
        const EXPIRED_ERROR = 'The credit card has expired';
        const EXPIRES_BEFORE_SUBSCRIPTION = 'Credit Card expires before the start of the subscription';
        assert.ok(~err.message.indexOf(EXPIRED_ERROR) || ~err.message.indexOf(EXPIRES_BEFORE_SUBSCRIPTION));
        assert.ok(err._original, '_original should be defined');
      });
  });

});
