odoo.define('sale_receipt_custom.Orderline', function (require) {
    "use strict";

    const models = require('point_of_sale.models');
    var exports = {};

    models.PosModel = models.PosModel.extend({

        get_currency_text: function(amount) {
            console.log("##Order##");
            console.log(this.order);
            console.log(amount);
            return amount

        },
    });

});