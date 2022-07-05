odoo.define("pos_send_orders.PosButtonPay", function (require) {
    "use strict";

    const Registries = require('point_of_sale.Registries');
    const ActionpadWidget = require('point_of_sale.ActionpadWidget')
    var exports = require("point_of_sale.models");

    exports.load_fields("pos.config", ["is_cashbox"]);

    const ActionpadWidget2 = (ActionpadWidget) =>
        class extends ActionpadWidget {
            get is_paybox() {
//                return this.env.pos.user.user_pay;
                console.log(" CALCULANDO SI SE PUEDE O NO MOSTRAR EL BOTON");
                console.log(this.env.pos.env.pos.config.is_cashbox);
                return this.env.pos.env.pos.config.is_cashbox;
            }
        }

    Registries.Component.extend(ActionpadWidget, ActionpadWidget2);
});
