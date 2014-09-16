![node-authorize-net](http://ignitiondeck.com/id/wp-content/uploads/2013/08/authorize-net.png)

[![build status](https://travis-ci.org/continuous-software/node-authorize-net.svg?branch=master)](https://travis-ci.org/continuous-software/node-authorize-net)

## Installation

`npm install node-authorize-net`

## Test

`npm test`

## Usage

1. Create a service by passing your apiLogin and your transaction key.
2. You can then call any method listed on the api. These methods return Promises. See API documentation for further details.

```javascript
    var service=require('node-authorize-net')(apiloging,key);

    service.authCaptureTransaction(amount, cardNumber, expirationYear, expirationMonth).then(function (transaction) {
        
        //process the response
        
        assert.equal(transaction.transactionResponse.responseCode, '1');
    });
```

## API
