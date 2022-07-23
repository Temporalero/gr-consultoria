# -*- coding: utf-8 -*-

# Copyright © 2018 Garazd Creation (<https://garazd.biz>)
# @author: Yurii Razumovskyi (<support@garazd.biz>)
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl-3.0.html).

{
    'name': 'Recibos de ventas personalizados',
    'version': '15.0.1.0.1',
    'category': 'sale',
    'author': 'Ing. Alejandro Garcia Magaña',
    'website': '',
    'license': 'LGPL-3',
    'summary': 'Modificaciones en los recibos de venta ',

    'depends': [
        'sale',
        'partner_delivery_routes'
    ],
    'data': [
        'report/sale_report_inherit.xml',
    ],
    'assets': {
        'web.assets_qweb': [
            'sale_receipt_custom/static/src/xml/OrderReceiptCustom.xml',

        ],
    },
    'demo': [],
    'external_dependencies': {
    },
    'support': 'support@garazd.biz',
    'application': False,
    'installable': True,
    'auto_install': False,
}
