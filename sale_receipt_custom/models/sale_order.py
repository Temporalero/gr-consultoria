# -*- coding: utf-8 -*-

from odoo import fields, models, api
import logging
import json


_log = logging.getLogger("TextAmount:: ")


class SaleOrderTextAmount(models.Model):
    _inherit = "sale.order"

    is_cashbox = fields.Boolean(string="Es caja")

    @api.model
    def get_currency_to_text(self, vals):
        _log.info("Valores %s", vals)
        _log.info(vals)
        text = self.env.user.company_id.currency_id.amount_to_text(vals['amount'])
        _log.info("Val text %s",text)
        return text

class PosOrderTextAmount(models.Model):
    _inherit = "pos.order"

    currency_text = fields.Char(string="Cantidad en texto")

    @api.model
    def _complete_values_from_session(self, session, values):
        _log.info("Completando desde complete values")
        _log.info(values)
        _log.info('Session %s',session)
        if values.get('state') and values['state'] == 'paid':
            values['name'] = self._compute_order_name()
        values.setdefault('pricelist_id', session.config_id.pricelist_id.id)
        values.setdefault('fiscal_position_id', session.config_id.default_fiscal_position_id.id)
        values.setdefault('company_id', session.config_id.company_id.id)
        _log.info("Curency text %s",self.get_currency_to_text(values['amount_total']))
        values.setdefault('currency_text', self.get_currency_to_text(values['amount_total']))
        return values



    @api.onchange('amount_total')
    def get_currency_to_text(self, vals):
        _log.info("Valores %s", vals)
        _log.info(vals)
        company = self.env['res.company'].search([('id','=',vals['company_id'])])
        _log.info("company %s, currency",company,company.currency_id)
        text = company.currency_id.amount_to_text(vals['amount'])
        _log.info("Val text %s",text)
        return text

