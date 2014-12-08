//xsd schema expects a sequence of fields, Javascript json object (map) does not ensure an order in the keys, we have to use arrays

var transactionRequestSchema = [
    {node: 'merchantAuthentication', value: [
        {node: 'name'},
        {node: 'transactionKey'}
    ]},
    {node: 'transactionRequest', value: [
        {node: 'transactionType'},
        {node: 'amount'},
        {node: 'refTransId'},
        {node: 'payment', value: [
            {node: 'trackData', value: [
                {node: 'track1'},
                {node: 'track2'}
            ]},
            {node: 'creditCard', value: [
                {node: 'cardNumber'},
                {node: 'expirationDate'},
                {node: 'cardCode'}
            ]}
        ]},
        {node : 'profile', value : [
            {node: 'createProfile'},
            {node: 'customerProfileId'},
            {node: 'paymentProfile', value: [
                {node: 'paymentProfileId'},
                {node: 'cardCode'},
                {node: 'shippingProfileId'}
          ]}
        ]},
        {node: 'order', value : [
            {node: 'invoiceNumber'},
            {node: 'description'}
        ]},
        {node : 'lineItems', value: [
            [{node: 'lineItem', value: [
                {node: 'itemId'},
                {node: 'name'},
                {node: 'description'},
                {node: 'quantity'},
                {node: 'unitPrice'}
            ]}]
        ]},
        {node: 'tax', value: [
            {node: 'amount'},
            {node: 'name'},
            {node: 'description'}
        ]},
        {node: 'duty', value: [
            {node: 'amount'},
            {node: 'name'},
            {node: 'description'}
        ]},
        {node: 'shipping', value: [
            {node: 'amount'},
            {node: 'name'},
            {node: 'description'},
            {node: 'taxExempt'},
        ]},
        {node: 'poNumber'},
        {node : 'customer', value: [
            {node: 'type'},
            {node: 'id'},
            {node: 'email'}
        ]},
        {node: 'billTo', value: [
            {node: 'firstName'},
            {node: 'lastName'},
            {node: 'company'},
            {node: 'address'},
            {node: 'city'},
            {node: 'state'},
            {node: 'zip'},
            {node: 'country'},
            {node: 'phoneNumber'},
            {node: 'faxNumber'}
        ]},
        {node: 'shipTo', value: [
            {node: 'firstName'},
            {node: 'lastName'},
            {node: 'company'},
            {node: 'address'},
            {node: 'city'},
            {node: 'state'},
            {node: 'zip'},
            {node: 'country'},
            {node: 'customerIP'}
        ]},
        {node: 'cardholderAuthentication', value: [
            {node: 'Authentication Indicator'},
            {node: 'Cardholder Authentication Value'}
        ]},
        {node: 'retail', value: [
            {node: 'marketType'},
            {node: 'deviceType'}
        ]},
        {node: 'transactionSettings', value: [
            [{node: 'setting', value: [
              {node: 'settingName'},
              {node: 'settingValue'}

            ]}]
        ]},
        {node: 'userFields', value: [
            [{node: 'userField', value: [
                {node: 'name'},
                {node: 'value'}
            ]}]
        ]}
    ]}
];

function applySchema(schema, obj) {
    var out = [];
    schema.forEach(function (val, index) {
        var key = val.node;
        var value = val.value;
        var node = {};

        if (!value || !(value.constructor === Array && value.length > 1)) {
            //leaf
            if (obj[key]) {
                node[key] = obj[key];
                out.push(node);
            }
        } else if (obj[key]) {
            //branch
            node[key] = applySchema(value, obj[key]);
            out.push(node);
        }
    });

    return out;
}

module.exports = {
    transactionRequest: applySchema.bind(null, transactionRequestSchema)
};
