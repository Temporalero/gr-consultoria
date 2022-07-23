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
        currency_id = self.env.user.company_id.currency_id.id
        text = currency_id.amount_to_text(vals['amount'])
        _log.info("Val text %s",text)
        return text

