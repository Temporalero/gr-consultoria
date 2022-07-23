odoo.define('sale_receipt_custom.Orderline', function (require) {
    "use strict";

    const models = require('point_of_sale.models');
    var exports = {};

    models.PosModel = models.PosModel.extend({

        get_currency_text:  function(amount) {
            console.log("##Order##");
            const params = {
                model: 'sale.order',
                method:'get_currency_to_text',
                args: [{'amount':amount}],
            };

            return this.rpc(params).then( value => {
                console.log(value) //log the returned value
                return value; // returning the value from a then function returns a new promise, so the spell function also returns a promise which you can handle similarly
              });



        },
    });

});