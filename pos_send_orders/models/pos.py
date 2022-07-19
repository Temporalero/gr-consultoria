# -*- coding: utf-8 -*-

from odoo import fields, models, api
import logging
import json


_log = logging.getLogger("Pos Control")


class PosConfig(models.Model):
    _inherit = "pos.config"

    is_cashbox = fields.Boolean(string="Es caja")

    @api.model
    def recibev2(self):
        domain = [['state', '=', 'paid']]
        model = 'pos.order'
        fields = ['display_name', 'name', 'config_id']
        res = self.env[model].search_read(domain=domain, fields=fields)
        return res


class PosSession(models.Model):
    _inherit = "pos.session"

    orders = fields.One2many("pos.order.temp","session_id","Pedidds")

    def envia(self, data):
        try:
            data = json.loads(data)
            data['session'] = self.name
            data['unpaid_orders'][0]['pos_session_id'] = self.id
            data['unpaid_orders'][0]['user_id'] = self.user_id.id
            client_name = self.env['res.partner'].browse(data['unpaid_orders'][0]['partner_id'])
            dic = {
                'session_id': self.id,
                'json': json.dumps(data),
                'orden': data['unpaid_orders'][0]['name'],
                # 'cajero': self.env['hr.employee'].browse(data['unpaid_orders'][0]['employee_id']).name if data['unpaid_orders'][0]['employee_id'] else "",
                'pos_name': self.config_id.display_name,
                'client_name': client_name.name if client_name else ""
            }
            self.env['pos.order.temp'].create(dic)
            _log.info("ORDER TEMP CREATED")
        except Exception as e:
            _log.warning(e)
            return False
        return True

    def ver(self):
        _log.info("Viendo orders a recibir")
        pos_order = self.env['pos.order'].search([('pos_reference','in',self.orders.mapped('orden'))])
        _log.info("POS ORDER... %s" % pos_order)
        pedidos_pagados = {o.pos_reference: '1' if o.state != 'draft' else '0' for o in pos_order}
        _log.info(" PEDIDOS PAGADOS::: %s " % pedidos_pagados)
        lista = []

        for order in self.orders:
            pagado = pedidos_pagados.get(order.orden,'0')
            _log.info("pagado.. %s" % pagado)
            if pagado == '1':
                continue
            data = {
                'id': order.id,
                'orden': order.orden,
                'pos_name': order.pos_name,
                'pagado': pagado,
                'client_name': order.client_name if order.client_name else "",
            }
            lista.append(data)
        return lista

    def recibe(self, id=False):
        orders = self.orders
        if id and orders.browse(int(id)):
            order = orders.browse(int(id))
            data = order.mapped('json')
            order.received = True
            return data
        if not id:
            orders_filt = orders.filtered(lambda x: not x.received)
            orders_filt.write({'received': True})
            data = orders_filt.mapped('json')
        return data


class PosOrderTemp(models.TransientModel):
    _name = "pos.order.temp"

    session_id = fields.Many2one("pos.session","Sesion")
    json = fields.Text("Json")
    received = fields.Boolean("Ha sido recibido")
    orden = fields.Char('Referencia de orden')
    cajero = fields.Char('Cajero')
    pos_name = fields.Char('Nombre punto de ventaa')
    client_name = fields.Char("Cliente")
