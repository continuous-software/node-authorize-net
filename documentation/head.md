[![build status](https://travis-ci.org/continuous-software/node-authorize-net.svg?branch=master)](https://travis-ci.org/continuous-software/node-authorize-net)

# node-authorize-net

a nodejs sdk to communicate with [authorize.net](http://www.authorize.net/) payment gateway.

## installation

`npm install node-authorize-net`

## test

`npm test`

## usage

```javascript
    var service=require('node-authorize-net')(apiloging,key);

    service.authCaptureTransaction(randomAmount(), 4012888818888, 2016, 10).then(function (transaction) {

        console.log(JSON.stringify(transaction));

        assert.equal(transaction.transactionResponse.responseCode, '1');
    });
```

## api
