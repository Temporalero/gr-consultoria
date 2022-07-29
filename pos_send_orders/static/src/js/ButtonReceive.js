odoo.define('pos_send_orders.ButtonReceive', function (require) {
    'use strict';

    const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
    const Registries = require('point_of_sale.Registries');
    const SaleOrderFetcher = require('pos_sale.SaleOrderFetcher');
    const { useState, useRef } = owl.hooks;
    class ButtonReceive extends AbstractAwaitablePopup {
        constructor() {
            super(...arguments);
            console.log("EN EL CONSTRUCTOR.. ")
            this.state = useState({ inputValue: '',name: '', pagado: false});
            this.inputRef = useRef('session');
        }
        selection(event){
            this.state.name = event.target.getAttribute('sname');
            this.state.inputValue = event.target.getAttribute('orderid');
            this.state.pagado = event.target.getAttribute('orderp');
        }
        exist_order(name){
            let orders = SaleOrderFetcher.get();
            console.log(" ORDENES FETCH.. ");
            console.log(orders);
            let new_order = false;
            orders.forEach(o => {
                if(name === o.name){
                    new_order = o;
                }
            });
            return new_order;
        }
        async GetOrder() {
            if(this.state.pagado==='1'){
                let name = this.state.name;
                console.log(" get order name :: ");
                console.log(name);
                this.showScreen('OrderManagementScreen');
                setTimeout(() => {
                    let order = this.exist_order(name);
                    if(order){
                        let targ = 'div.name:contains('+name+')';
                        $(targ).click();
                    }
                }, 500);
                this.trigger('close-popup');
                return
            }
            var orders = await this.rpc({
                model: 'pos.session',
                method: 'recibe',
                args: [this.env.pos.pos_session.id, this.state.inputValue]
            });
            if (orders && orders.length>0) {
                orders.forEach(order => {
                    this.env.pos.import_orders(order);
                });
                let eti = $("div[badge]");
                eti[0].setAttribute('badge', this.env.pos.get_order_list().length);
                this.playSound('/pos_send_orders/static/src/sound/rin.wav');
            }
            this.trigger('close-popup');
            return orders
        }

        name_filter(event){
            console.log("Filtrando... xD ");
            var search_input = document.getElementById("search_order_input");
            var filter = search_input.value.toUpperCase();
            var orders_table = document.getElementById("received_orders_table");
            var tr = orders_table.getElementsByTagName("tr");
            
            var td_client_name, td_order_name, i, txtValue_client, txtValue_order;
            for (i = 0; i < tr.length; i++) {
                td_client_name = tr[i].getElementsByTagName("td")[2];
                td_order_name = tr[i].getElementsByTagName("td")[0];
                if (td_client_name && td_order_name ) {
                  txtValue_client = td_client_name.textContent || td_client_name.innerText;
                  txtValue_order = td_order_name.textContent || td_order_name.innerText;
                  if (txtValue_client.toUpperCase().indexOf(filter) > -1 || txtValue_order.toUpperCase().indexOf(filter) > -1) {
                    tr[i].style.display = "";
                  } else {
                    tr[i].style.display = "none";
                  }
                }
            }
        }
    }

    //Create products popup
    ButtonReceive.template = 'ButtonReceive';
    ButtonReceive.defaultProps = {
        confirmText: 'Recibir',
        cancelText: 'Cancelar',
        title: 'Pedidos Disponibles',
        body: '',
    };
    Registries.Component.add(ButtonReceive);
    return ButtonReceive;
});