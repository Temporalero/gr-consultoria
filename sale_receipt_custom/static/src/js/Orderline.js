odoo.define('sale_receipt_custom.Orderline', function (require) {
    "use strict";

    const models = require('point_of_sale.models');
    var rpc = require('web.rpc')

    const exports = require("point_of_sale.models");

    var modelos = exports.PosModel.prototype.models;

    modelos.find(e => e.model == "res.company").fields.push('street_name','street_number','street2','city','state_id','zip');


    models.PosModel = models.PosModel.extend({

        amount_to_letter: function(amount){

            function Unidades(num){

                switch(num)
                {
                    case 1: return "UN";
                    case 2: return "DOS";
                    case 3: return "TRES";
                    case 4: return "CUATRO";
                    case 5: return "CINCO";
                    case 6: return "SEIS";
                    case 7: return "SIETE";
                    case 8: return "OCHO";
                    case 9: return "NUEVE";
                }

                return "";
            }//Unidades()

            function Decenas(num){

                var decena = Math.floor(num/10);
                var unidad = num - (decena * 10);

                switch(decena)
                {
                    case 1:
                        switch(unidad)
                        {
                            case 0: return "DIEZ";
                            case 1: return "ONCE";
                            case 2: return "DOCE";
                            case 3: return "TRECE";
                            case 4: return "CATORCE";
                            case 5: return "QUINCE";
                            default: return "DIECI" + Unidades(unidad);
                        }
                    case 2:
                        switch(unidad)
                        {
                            case 0: return "VEINTE";
                            default: return "VEINTI" + Unidades(unidad);
                        }
                    case 3: return DecenasY("TREINTA", unidad);
                    case 4: return DecenasY("CUARENTA", unidad);
                    case 5: return DecenasY("CINCUENTA", unidad);
                    case 6: return DecenasY("SESENTA", unidad);
                    case 7: return DecenasY("SETENTA", unidad);
                    case 8: return DecenasY("OCHENTA", unidad);
                    case 9: return DecenasY("NOVENTA", unidad);
                    case 0: return Unidades(unidad);
                }
            }//Unidades()

            function DecenasY(strSin, numUnidades) {
                if (numUnidades > 0)
                return strSin + " Y " + Unidades(numUnidades)

                return strSin;
            }//DecenasY()

            function Centenas(num) {
                var centenas = Math.floor(num / 100);
                var decenas = num - (centenas * 100);

                switch(centenas)
                {
                    case 1:
                        if (decenas > 0)
                            return "CIENTO " + Decenas(decenas);
                        return "CIEN";
                    case 2: return "DOSCIENTOS " + Decenas(decenas);
                    case 3: return "TRESCIENTOS " + Decenas(decenas);
                    case 4: return "CUATROCIENTOS " + Decenas(decenas);
                    case 5: return "QUINIENTOS " + Decenas(decenas);
                    case 6: return "SEISCIENTOS " + Decenas(decenas);
                    case 7: return "SETECIENTOS " + Decenas(decenas);
                    case 8: return "OCHOCIENTOS " + Decenas(decenas);
                    case 9: return "NOVECIENTOS " + Decenas(decenas);
                }

                return Decenas(decenas);
            }//Centenas()

            function Seccion(num, divisor, strSingular, strPlural) {
                var cientos = Math.floor(num / divisor)
                var resto = num - (cientos * divisor)

                var letras = "";

                if (cientos > 0)
                    if (cientos > 1)
                        letras = Centenas(cientos) + " " + strPlural;
                    else
                        letras = strSingular;

                if (resto > 0)
                    letras += "";

                return letras;
            }//Seccion()

            function Miles(num) {
                var divisor = 1000;
                var cientos = Math.floor(num / divisor)
                var resto = num - (cientos * divisor)

                var strMiles = Seccion(num, divisor, "UN MIL", "MIL");
                var strCentenas = Centenas(resto);

                if(strMiles == "")
                    return strCentenas;

                return strMiles + " " + strCentenas;
            }//Miles()

            function Millones(num) {
                var divisor = 1000000;
                var cientos = Math.floor(num / divisor)
                var resto = num - (cientos * divisor)

                var strMillones = Seccion(num, divisor, "UN MILLON DE", "MILLONES DE");
                var strMiles = Miles(resto);

                if(strMillones == "")
                    return strMiles;

                return strMillones + " " + strMiles;
            }//Millones()

            function NumeroALetras(num) {
                var data = {
                    numero: num,
                    enteros: Math.floor(num),
                    centavos: (((Math.round(num * 100)) - (Math.floor(num) * 100))),
                    letrasCentavos: "",
                    letrasMonedaPlural: 'Pesos',//"PESOS", 'Dólares', 'Bolívares', 'etcs'
                    letrasMonedaSingular: 'Pesos', //"PESO", 'Dólar', 'Bolivar', 'etc'

                    letrasMonedaCentavoPlural: "CENTAVOS",
                    letrasMonedaCentavoSingular: "CENTAVO"
                };

                if (data.centavos > 0) {
                    data.letrasCentavos = "CON " + (function (){
                        if (data.centavos == 1)
                            return Millones(data.centavos) + " " + data.letrasMonedaCentavoSingular;
                        else
                            return Millones(data.centavos) + " " + data.letrasMonedaCentavoPlural;
                        })();
                };

                if(data.enteros == 0)
                    return "CERO " + data.letrasMonedaPlural + " " + data.letrasCentavos;
                if (data.enteros == 1)
                    return Millones(data.enteros) + " " + data.letrasMonedaSingular + " " + data.letrasCentavos;
                else
                    return Millones(data.enteros) + " " + data.letrasMonedaPlural + " " + data.letrasCentavos;
            }//

            var cent = (amount+"").split('.')[1].substring(0,2)

            var num_entero = Math.trunc(amount);
            console.log(num_entero);

            return NumeroALetras(num_entero) + cent + "/100 M.N.";

        },

    });
     models.Order = models.Order.extend({


        export_for_printing: function(){
            var orderlines = [];
            var self = this;

            this.orderlines.each(function(orderline){
                orderlines.push(orderline.export_for_printing());
            });

            // If order is locked (paid), the 'change' is saved as negative payment,
            // and is flagged with is_change = true. A receipt that is printed first
            // time doesn't show this negative payment so we filter it out.
            var paymentlines = this.paymentlines.models
                .filter(function (paymentline) {
                    return !paymentline.is_change;
                })
                .map(function (paymentline) {
                    return paymentline.export_for_printing();
                });
            var client  = this.get('client');
            var cashier = this.pos.get_cashier();
            var company = this.pos.company;
            var date    = new Date();


            function is_html(subreceipt){
                return subreceipt ? (subreceipt.split('\n')[0].indexOf('<!DOCTYPE QWEB') >= 0) : false;
            }

            function render_html(subreceipt){
                if (!is_html(subreceipt)) {
                    return subreceipt;
                } else {
                    subreceipt = subreceipt.split('\n').slice(1).join('\n');
                    var qweb = new QWeb2.Engine();
                        qweb.debug = config.isDebug();
                        qweb.default_dict = _.clone(QWeb.default_dict);
                        qweb.add_template('<templates><t t-name="subreceipt">'+subreceipt+'</t></templates>');

                    return qweb.render('subreceipt',{'pos':self.pos,'order':self, 'receipt': receipt}) ;
                }
            }

            var receipt = {
                orderlines: orderlines,
                paymentlines: paymentlines,
                subtotal: this.get_subtotal(),
                total_with_tax: this.get_total_with_tax(),
                total_rounded: this.get_total_with_tax() + this.get_rounding_applied(),
                total_without_tax: this.get_total_without_tax(),
                total_tax: this.get_total_tax(),
                total_paid: this.get_total_paid(),
                total_discount: this.get_total_discount(),
                rounding_applied: this.get_rounding_applied(),
                tax_details: this.get_tax_details(),
                change: this.locked ? this.amount_return : this.get_change(),
                name : this.get_name(),
                client: client ? client : null ,
                invoice_id: null,   //TODO
                cashier: cashier ? cashier.name : null,
                precision: {
                    price: 2,
                    money: 2,
                    quantity: 3,
                },
                date: {
                    year: date.getFullYear(),
                    month: date.getMonth(),
                    date: date.getDate(),       // day of the month
                    day: date.getDay(),         // day of the week
                    hour: date.getHours(),
                    minute: date.getMinutes() ,
                    isostring: date.toISOString(),
                    localestring: this.formatted_validation_date,
                    validation_date: this.validation_date,
                },
                company:{
                    email: company.email,
                    website: company.website,
                    company_registry: company.company_registry,
                    contact_address: company.partner_id[1],
                    vat: company.vat,
                    vat_label: company.country && company.country.vat_label || _t('Tax ID'),
                    name: company.name,
                    phone: company.phone,
                    logo:  this.pos.company_logo_base64,
                    city_state: company.city + ', ' + company.state_id[1] + ' CP ' + company.zip,
                    street: company.street_name + ' ' +company.street_number,
                },
                currency: this.pos.currency,
            };

            if (is_html(this.pos.config.receipt_header)){
                receipt.header = '';
                receipt.header_html = render_html(this.pos.config.receipt_header);
            } else {
                receipt.header = this.pos.config.receipt_header || '';
            }

            if (is_html(this.pos.config.receipt_footer)){
                receipt.footer = '';
                receipt.footer_html = render_html(this.pos.config.receipt_footer);
            } else {
                receipt.footer = this.pos.config.receipt_footer || '';
            }


            return receipt;
        },
    });



});