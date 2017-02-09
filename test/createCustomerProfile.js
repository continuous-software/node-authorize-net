var conf = require('../config.js');
var assert = require('assert');
var GatewayError = require('42-cent-base').GatewayError;
var AuthorizeGateway = require('../index.js');
var CreditCard = require('42-cent-model').CreditCard;
var Prospect = require('42-cent-model').Prospect;
var casual = require('casual');

describe('create customer profile', function () {
  var service;

  beforeEach(function () {
    conf.testMode = true;
    service = AuthorizeGateway(conf);
  });

  it('should create a customer profile', function () {
    var cc = new CreditCard()
      .withCreditCardNumber('4111111111111111')
      .withExpirationMonth('12')
      .withExpirationYear('2019')
      .withCvv2('123');

    var prospect = new Prospect()
      .withBillingEmailAddress(casual.email)
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


    var options = {
      description: 'TEST at: ' + Date.now()
    };

    return service.createCustomerProfile(cc, prospect, prospect, options)
      .then(function (result) {
        assert.ok(result.profileId, 'profileId should be defined');
        assert.ok(result._original, '_original should be defined');
      });
  });

  it('should reject the promise when the gateway return an error', function () {
    var cc = new CreditCard()
      .withCreditCardNumber('2323455')
      .withExpirationMonth('12')
      .withExpirationYear('2019')
      .withCvv2('123');

    var prospect = new Prospect()
      .withBillingEmailAddress(casual.email)
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

    return service.createCustomerProfile(cc, prospect)
      .then(function () {
        throw new Error('Was not rejected.');
      })
      .catch(function (err) {
        assert.ok(err instanceof GatewayError, 'expected instance of GatewayError');
        assert.ok(err._original, '_original should be defined');
        assert.ok(err.message.indexOf('- The field length is invalid for Card Number.') != -1);
      });
  });

});
