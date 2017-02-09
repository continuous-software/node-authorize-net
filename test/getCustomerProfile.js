var conf = require('../config.js');
var assert = require('assert');
var AuthorizeGateway = require('../index.js');
var CreditCard = require('42-cent-model').CreditCard;
var Prospect = require('42-cent-model').Prospect;
var casual = require('casual');

describe('get customer info', function () {
  var service;

  beforeEach(function () {
    conf.testMode = true;
    service = AuthorizeGateway(conf);
  });

  it('should get the info related to a customer', function () {
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

    var profId;

    var options = {
      description: 'TEST at: ' + Date.now()
    };

    return service.createCustomerProfile(cc, prospect, prospect, options)
      .then(function (result) {
        profId = result.profileId;
        assert.ok(profId, 'profileId should be defined');
        assert.ok(result._original, '_original should be defined');
        return service.getCustomerProfile(result.profileId);
      })
      .then(function (result) {
        assert.equal(result._original.profile[0].customerProfileId[0], profId);
      });
  });

});
