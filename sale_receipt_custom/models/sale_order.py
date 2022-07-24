# -*- coding: utf-8 -*-

from odoo import fields, models, api
import logging
import json
from functools import partial


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
        _log.info("Curency text %s",self.get_currency_to_text(values))
        values.setdefault('currency_text', self.get_currency_to_text(values))
        return values



    @api.onchange('amount_total')
    def get_currency_to_text(self, vals):
        _log.info("Valores %s", vals)
        _log.info(vals['company_id'])
        _log.info(vals['amount_total'])

        company = self.env['res.company'].search([('id', '=', vals['company_id'])])
        _log.info("company %s, currency",company,company.currency_id)
        text = company.currency_id.amount_to_text(vals['amount_total'])
        _log.info("Val text %s",text)
        return text

    @api.model
    def _order_fields(self, ui_order):
        _log.info("### Amount Texts")
        process_line = partial(self.env['pos.order.line']._order_line_fields, session_id=ui_order['pos_session_id'])
        company = self.env['pos.session'].browse(ui_order['pos_session_id']).company_id
        return {
            'user_id': ui_order['user_id'] or False,
            'session_id': ui_order['pos_session_id'],
            'lines': [process_line(l) for l in ui_order['lines']] if ui_order['lines'] else False,
            'pos_reference': ui_order['name'],
            'sequence_number': ui_order['sequence_number'],
            'partner_id': ui_order['partner_id'] or False,
            'date_order': ui_order['creation_date'].replace('T', ' ')[:19],
            'fiscal_position_id': ui_order['fiscal_position_id'],
            'pricelist_id': ui_order['pricelist_id'],
            'amount_paid': ui_order['amount_paid'],
            'amount_total': ui_order['amount_total'],
            'amount_text': company.currency_id.amount_to_text(ui_order['amount_total']),
            'amount_tax': ui_order['amount_tax'],
            'amount_return': ui_order['amount_return'],
            'company_id': self.env['pos.session'].browse(ui_order['pos_session_id']).company_id.id,
            'to_invoice': ui_order['to_invoice'] if "to_invoice" in ui_order else False,
            'to_ship': ui_order['to_ship'] if "to_ship" in ui_order else False,
            'is_tipped': ui_order.get('is_tipped', False),
            'tip_amount': ui_order.get('tip_amount', 0),
        }
