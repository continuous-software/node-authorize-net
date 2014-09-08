###Global





---

### AuthorizeNet



#### authCaptureTransaction(amount, cardNumber, expirationYear, expirationMonth, other) 

<p> submit a transaction request type authCaptureTransaction. </p>
<ul>
 <li>will resolve with an json object representing the <em>createTransactionResponse</em> xml field of the web service response it the resultCode is <code>"Ok"</code></li>
 <li>will reject with an instance of AuthorizationNetError whose properties will be json version of the xml field <em>createTransactionResponse</em> if the resultCode is not <code>"Ok"</code></li>
 <li>will reject with an instance of HttpError if the http status code of the response is higher or equal to 400</li>
 <li>will reject with an instance of AssertionError if one of the mandatory field is falsy</li>
 <li>will reject with an instance of Error if any other error occurs (parsing, etc)</li>
</ul>

**Parameters**

**amount**: string | number, the amount of the transaction

**cardNumber**: string | number, the card number used for the transaction

**expirationYear**: string | number, a four digits number for the expiration year of the card

**expirationMonth**: string | number, one or two digit for the expiration month of the card

**other**: object, a json object you want to mix with the transactionRequest field before transformation into xml. Note it will override already assigned properties

**Returns**: Promise, 
#### authOnlyTransaction(amount, cardNumber, expirationYear, expirationMonth, other) 

<p> submit a transaction request type authOnlyTransaction. </p>
 <ul>
 <li>will resolve with an json object representing the <em>createTransactionResponse</em> xml field of the web service response it the resultCode is <code>"Ok"</code></li>
 <li>will reject with an instance of AuthorizationNetError whose properties will be json version of the xml field <em>createTransactionResponse</em> if the resultCode is not <code>"Ok"</code></li>
 <li>will reject with an instance of HttpError if the http status code of the response is higher or equal to 400</li>
 <li>will reject with an instance of AssertionError if one of the mandatory field is falsy</li>
 <li>will reject with an instance of Error if any other error occurs (parsing, etc)</li>
</ul>

**Parameters**

**amount**: number, the amount of the transaction

**cardNumber**: string | number, the card number used for the transaction

**expirationYear**: number, a four digits number for the expiration year of the card

**expirationMonth**: one or two digit for the expiration month of the card

**other**: object, a json object you want to mix with the transactionRequest field before transformation into xml. Note it will override already assigned properties

**Returns**: Promise, 
#### priorAuthCaptureTransaction(refTransId, amount, other) 

<p> submit a transaction request type priorAuthCaptureTransaction. </p>
 <ul>
 <li>will resolve with an json object representing the <em>createTransactionResponse</em> xml field of the web service response it the resultCode is <code>"Ok"</code></li>
 <li>will reject with an instance of AuthorizationNetError whose properties will be json version of the xml field <em>createTransactionResponse</em> if the resultCode is not <code>"Ok"</code></li>
 <li>will reject with an instance of HttpError if the http status code of the response is higher or equal to 400</li>
 <li>will reject with an instance of AssertionError if one of the mandatory field is falsy</li>
 <li>will reject with an instance of Error if any other error occurs (parsing, etc)</li>
</ul>

**Parameters**

**refTransId**: String | number, the transaction reference id returned by the web service after the related authorize only transaction

**amount**: number, the amount of the transaction

**other**: object, a json object you want to mix with the transactionRequest field before transformation into xml. Note it will override already assigned properties

**Returns**: Promise, 
#### voidTransaction(refTransId, other) 

<p> submit a transaction request type voidTransaction. </p>
 <ul>
 <li>will resolve with an json object representing the <em>createTransactionResponse</em> xml field of the web service response it the resultCode is <code>"Ok"</code></li>
 <li>will reject with an instance of AuthorizationNetError whose properties will be json version of the xml field <em>createTransactionResponse</em> if the resultCode is not <code>"Ok"</code></li>
 <li>will reject with an instance of HttpError if the http status code of the response is higher or equal to 400</li>
 <li>will reject with an instance of AssertionError if one of the mandatory field is falsy</li>
 <li>will reject with an instance of Error if any other error occurs (parsing, etc)</li>
</ul>

**Parameters**

**refTransId**: String | number, the transaction reference id (you want to void) returned by the web service.

**other**: object, a json object you want to mix with the transactionRequest field before transformation into xml. Note it will override already assigned properties

**Returns**: Promise, 
#### getTransactionDetails(refTransId) 

<p> submit a getTransactionDetails request </p>
 <ul>
 <li>will resolve with an json object representing the <em>getTransactionDetailResponse</em> xml field of the web service response it the resultCode is <code>"Ok"</code></li>
 <li>will reject with an instance of AuthorizationNetError whose properties will be json version of the xml field <em>createTransactionResponse</em> if the resultCode is not <code>"Ok"</code></li>
 <li>will reject with an instance of HttpError if the http status code of the response is higher or equal to 400</li>
 <li>will reject with an instance of AssertionError if one of the mandatory field is falsy</li>
 <li>will reject with an instance of Error if any other error occurs (parsing, etc)</li>
</ul>

**Parameters**

**refTransId**: String | number, the transaction reference id (you want to void) returned by the web service.

**Returns**: Promise, 
#### getUnsettledTransactionList() 

<p> submit a getTransactionDetails request </p>
 <ul>
 <li>will resolve with an json object representing the <em>getUnsettledTransactionListResponse</em> xml field of the web service response it the resultCode is <code>"Ok"</code></li>
 <li>will reject with an instance of AuthorizationNetError whose properties will be json version of the xml field <em>createTransactionResponse</em> if the resultCode is not <code>"Ok"</code></li>
 <li>will reject with an instance of HttpError if the http status code of the response is higher or equal to 400</li>
 <li>will reject with an instance of AssertionError if one of the mandatory field is falsy</li>
 <li>will reject with an instance of Error if any other error occurs (parsing, etc)</li>
</ul>

**Returns**: Promise, 
#### getSettledBatchList(withStats, startDate, lastDate) 

<p> get a batch list of already settled transactions </p>
 <ul>
 <li>will resolve with an json object representing the <em>getBatchListResponse</em> xml field of the web service response it the resultCode is <code>"Ok"</code></li>
 <li>will reject with an instance of AuthorizationNetError whose properties will be json version of the xml field <em>createTransactionResponse</em> if the resultCode is not <code>"Ok"</code></li>
 <li>will reject with an instance of HttpError if the http status code of the response is higher or equal to 400</li>
 <li>will reject with an instance of AssertionError if one of the mandatory field is falsy</li>
 <li>will reject with an instance of Error if any other error occurs (parsing, etc)</li>
</ul>

**Parameters**

**withStats**: boolean, if true the response will include detailed view of the statistics

**startDate**: Date, a date object to define the lower bound of the time window requested

**lastDate**: Date, a date object to define the higher bound of the time window requested

**Returns**: Promise, 
#### getBatchStatistics(batchId) 

<p> get statistics for a particular batch </p>
 <ul>
 <li>will resolve with an json object representing the <em>getBatchStatisticsResponse</em> xml field of the web service response it the resultCode is <code>"Ok"</code></li>
 <li>will reject with an instance of AuthorizationNetError whose properties will be json version of the xml field <em>createTransactionResponse</em> if the resultCode is not <code>"Ok"</code></li>
 <li>will reject with an instance of HttpError if the http status code of the response is higher or equal to 400</li>
 <li>will reject with an instance of AssertionError if one of the mandatory field is falsy</li>
 <li>will reject with an instance of Error if any other error occurs (parsing, etc)</li>
</ul>

**Parameters**

**batchId**: string | number, the batch id requested

**Returns**: Promise, 


---








