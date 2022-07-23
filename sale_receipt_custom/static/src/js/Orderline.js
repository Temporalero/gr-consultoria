odoo.define('sale_receipt_custom.Orderline', function (require) {
    "use strict";

    const models = require('point_of_sale.models');
    var exports = {};

    models.PosModel = models.PosModel.extend({

        get_currency_text: function(amount) {
            console.log("##Order##");
            const params = {
                model: 'sale.order',
                method:'get_currency_to_text',
                args: [{'amount':amount}],
            };

            var text_currency = this.rpc(params).then(
                function(vals){
                    console.log('RESPUESTA:: ');
                    console.log(vals);
                    console.log(vals['text']);
                    return vals
                }
            );

            return text_currency

        },
    });

});