odoo.define('sale_receipt_custom.Orderline', function (require) {
    "use strict";

    const models = require('point_of_sale.models');
    var rpc = require('web.rpc')
    var BarcodeParser = require('barcodes.BarcodeParser');
    var BarcodeReader = require('point_of_sale.BarcodeReader');
    var PosDB = require('point_of_sale.DB');
    var devices = require('point_of_sale.devices');
    var concurrency = require('web.concurrency');
    var config = require('web.config');
    var core = require('web.core');
    var field_utils = require('web.field_utils');
    var time = require('web.time');
    var utils = require('web.utils');
    var { Gui } = require('point_of_sale.Gui');

    var QWeb = core.qweb;
    var _t = core._t;
    var Mutex = concurrency.Mutex;
    var round_di = utils.round_decimals;
    var round_pr = utils.round_precision;
    var exports = {};
    

    models.PosModel = models.PosModel.extend({

        load_server_data: function(){
            var self = this;
            var progress = 0;
            var progress_step = 1.0 / self.models.length;

            for (let value of self.models) {
              if(value.model == 'res.company'){
              console.log("AGREGAMOS CAMPOS EN COMPANY")
                value.fields = [ 'currency_id', 'email', 'website', 'company_registry', 'vat', 'name', 'phone', 'partner_id' , 'country_id', 'state_id', 'tax_calculation_rounding_method','street_name','street_number','street2','l10n','l10n_mx_edi_colony','l10n_mx_edi_colony_code','city','state_id','zip']
              }

            }
            var tmp = {}; // this is used to share a temporary state between models loaders

            var loaded = new Promise(function (resolve, reject) {
                async function load_model(index) {
                    if (index >= self.models.length) {
                        resolve();
                    } else {
                        var model = self.models[index];
                        self.setLoadingMessage(_t('Loading')+' '+(model.label || model.model || ''), progress);

                        var cond = typeof model.condition === 'function'  ? model.condition(self,tmp) : true;
                        if (!cond) {
                            load_model(index+1);
                            return;
                        }

                        var fields =  typeof model.fields === 'function'  ? model.fields(self,tmp)  : model.fields;
                        var domain =  typeof model.domain === 'function'  ? await model.domain(self,tmp)  : model.domain;
                        var context = typeof model.context === 'function' ? model.context(self,tmp) : model.context || {};
                        var ids     = typeof model.ids === 'function'     ? model.ids(self,tmp) : model.ids;
                        var order   = typeof model.order === 'function'   ? model.order(self,tmp):    model.order;
                        progress += progress_step;

                        if(model.model ){
                            var params = {
                                model: model.model,
                                context: _.extend(context, self.session.user_context || {}),
                            };

                            if (model.ids) {
                                params.method = 'read';
                                params.args = [ids, fields];
                            } else {
                                params.method = 'search_read';
                                params.domain = domain;
                                params.fields = fields;
                                params.orderBy = order;
                            }

                            self.rpc(params).then(function (result) {
                                try { // catching exceptions in model.loaded(...)
                                    Promise.resolve(model.loaded(self, result, tmp))
                                        .then(function () { load_model(index + 1); },
                                            function (err) { reject(err); });
                                } catch (err) {
                                    console.error(err.message, err.stack);
                                    reject(err);
                                }
                            }, function (err) {
                                reject(err);
                            });
                        } else if (model.loaded) {
                            try { // catching exceptions in model.loaded(...)
                                Promise.resolve(model.loaded(self, tmp))
                                    .then(function () { load_model(index +1); },
                                        function (err) { reject(err); });
                            } catch (err) {
                                reject(err);
                            }
                        } else {
                            load_model(index + 1);
                        }
                    }
                }

                try {
                    return load_model(0);
                } catch (err) {
                    return Promise.reject(err);
                }
            });

            return loaded;
        },

        get_currency_text: async function(amount) {
            console.log("##Order##");
            const params = {
                model: 'sale.order',
                method:'get_currency_to_text',
                args: [{'amount':amount}],
            };

            const valor = await this.rpc(params);

            return valor

        },
    });
     models.Order = models.Order.extend({

        get_currency_text: function(amount) {
            console.log("##Order##");
            console.log(amount);

            const params = {
                model: 'sale.order',
                method:'get_currency_to_text',
                args: [{'amount':amount}],
            };


            return rpc.query(params)
                .then(function (backend_result) {
                    console.log(backend_result)
                    return Promise.resolve(backend_result);
                });

        },

        export_for_printing: function(){
            console.log("REDER TICKET")
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

            console.log('Company')
            console.log(company)

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
            
            receipt.text_amount = this.get_currency_text(this.get_total_with_tax());
            console.log(receipt.text_amount)

            return receipt;
        },
    });



});