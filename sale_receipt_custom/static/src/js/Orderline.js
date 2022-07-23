odoo.define('sale_receipt_custom.Orderline', function (require) {
    "use strict";

    const models = require('point_of_sale.models');
    var exports = {};

    models.PosModel = models.PosModel.extend({

        get_currency_text: async function(amount) {
            console.log("##Order##");
            const params = {
                model: 'sale.order',
                method:'get_currency_to_text',
                args: [{'amount':amount}],
            };

            const text_currency = await this.rpc(params);
            console.log('RESPUESTA:: ');
            console.log(text_currency);
            console.log(text_currency['text']);
            return text_currency

        },
    });

});