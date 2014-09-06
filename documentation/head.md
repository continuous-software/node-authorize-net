[![build status](https://travis-ci.org/continuous-software/node-authorize-net.svg?branch=master)](https://travis-ci.org/continuous-software/node-authorize-net)

# node-authorize-net

a nodejs sdk to communicate with [authorize.net](http://www.authorize.net/) payment gateway.

## installation

`npm install node-authorize-net`

## test

`npm test`

## usage

1. create a service by passing your apiLogin and your transaction key
2. You can then call any method listed on the api. These methods return Promises. See API documentation for further details

```javascript
    var service=require('node-authorize-net')(apiloging,key);

    service.authCaptureTransaction(amount, cardNumber, expirationYear, expirationMonth).then(function (transaction) {
        
        //process the response
        
        assert.equal(transaction.transactionResponse.responseCode, '1');
    });
```

## api
