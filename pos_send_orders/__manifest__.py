# -*- coding: utf-8 -*-
{
    "name": "Point of sale: send orders",
    'version': '0.01b',
    'author': 'Ing. Isaac Chávez Arroyo',
    'website': 'https://isaaccv.ml',
    "depends": [
        "base",
        "point_of_sale",
        "pos_sale",
    ],
    "data": [
        "security/ir.model.access.csv",
        'views/pos_views.xml',
    ],
    'assets': {
        'point_of_sale.assets': [
            # 'pos_customs/static/src/css/payment_screen.css',
            'pos_send_orders/static/src/js/pos_button_pay.js',
            'pos_send_orders/static/src/js/ButtonReceive.js',
            'pos_send_orders/static/src/js/ButtonSend.js',
            'pos_send_orders/static/src/js/recibe.js',
            'pos_send_orders/static/src/js/envio.js',
        ],
        'web.assets_qweb': [
            'pos_send_orders/static/src/xml/pos.xml',
        ],
    },
    'application': True,
    'installable': True,
    'license': 'LGPL-3'
}