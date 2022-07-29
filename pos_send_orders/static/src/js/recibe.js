odoo.define("pos_send_orders.ResOrder", function (require) {
    "use strict";
    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');
    const Chrome = require('point_of_sale.Chrome');
    const {useListener} = require('web.custom_hooks');
    const exports = require("point_of_sale.models");
    var models = exports.PosModel.prototype.models;

    /*models.find(e => e.model == "hr.employee").domain = function(self){return [['company_id', '=', self.config.company_id[0]]];};
    models.find(e => e.model == "hr.employee").loaded = function(self, employees) {
        if (self.config.module_pos_hr) {
            self.employees = employees.filter(e => self.config.employee_ids.includes(e.id));
            self.employee_by_id = {};
            employees.forEach(function (employee) {
                self.employee_by_id[employee.id] = employee;
            });
            self.employees.forEach(function (employee) {
                var hasUser = self.users.some(function (user) {
                    if (user.id === employee.user_id[0]) {
                        employee.role = user.role;
                        return true;
                    }
                    return false;
                });
                if (!hasUser) {
                    employee.role = 'cashier';
                }
            });
        }
    }
*/
    class ResOrder extends PosComponent {
        constructor() {
            super(...arguments);
            useListener('onClick', this.onClick);
            this._start();
        }
        _start() {
            const self = this;
            async function loop() {
                if (self.env && self.env.pos && self.env.pos.pos_session) {
                    if(!self.env.pos.config.es_caja){
//                        console.log("no es caja, no recibir");
                        return
                    }
                    try {
                        self.ReceiveOrders();
                    } catch (error) {
                        console.log(error);
                    }
                }
                setTimeout(loop, 10000);
            }
            loop();
        }
        async ReceiveOrders() {
            var orders = await this.rpc({
                model: 'pos.session',
                method: 'recibe',
                args: [this.env.pos.pos_session.id]
            });
            if (orders && orders.length>0) {
                orders.forEach(order => {
                    this.env.pos.import_orders(order);
                });
                let eti = $("div[badge]");
                eti[0].setAttribute('badge', this.env.pos.get_order_list().length);
                this.playSound('/pos_pay_control/static/src/sound/rin.wav');
                return orders
            }
            return orders
        }
        async SeeOrders(){
//            console.log("Viendo ordenes a recibir")
            return await this.rpc({
                model: 'pos.session',
                method: 'ver',
                args: [this.env.pos.pos_session.id]
            });
        }
        async onClick(event) {
//            console.log(" recibe click ... ")
            let orders = await this.SeeOrders();
            // Filtrar aquí las que ya están pagadas si no se desean ver.
//            console.log(" Ordenes recibidas ::: ");
//            console.log(orders);
            await this.showPopup("ButtonReceive", {'orders':orders});
        }

    }

    ResOrder.template = 'ResOrder';

    Registries.Component.add(ResOrder);

    const Chrome2 = (Chrome) =>
        class extends Chrome {
            _onPlaySound({detail: name}) {
                let src;
                if (name === 'error') {
                    src = "/point_of_sale/static/src/sounds/error.wav";
                } else if (name === 'bell') {
                    src = "/point_of_sale/static/src/sounds/bell.wav";
                } else {
                    src = name;
                }
                this.state.sound.src = src;
            }
        }

    Registries.Component.extend(Chrome, Chrome2);

    return ResOrder;
});
