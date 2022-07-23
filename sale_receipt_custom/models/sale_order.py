# -*- coding: utf-8 -*-

from odoo import fields, models, api
from openerp.tools.amount_to_text_en import amount_to_text
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
        currency_id = self.env.user.company_id.currency_id.id
        text = self._amount_to_text(vals['amount'], currency_id)
        _log.info("Val text %s",text)
        return text

    def _amount_to_text(self, amount, currency_id):
        # Currency complete name is not available in res.currency model
        # Exceptions done here (EUR, USD, BRL) cover 75% of cases
        # For other currencies, display the currency code
        currency = self.env['res.currency'].browse(currency_id)
        if currency.name.upper() == 'EUR':
            currency_name = 'Euro'
        elif currency.name.upper() == 'USD':
            currency_name = 'Dollars'
        elif currency.name.upper() == 'BRL':
            currency_name = 'reais'
        else:
            currency_name = currency.name
        # TODO : generic amount_to_text is not ready yet, otherwise language (and country) and currency can be passed
        # amount_in_word = amount_to_text(amount, context=context)
        return amount_to_text(amount, currency=currency_name)