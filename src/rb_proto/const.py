# coding: utf-8
from __future__ import unicode_literals


COLUMNS = [
    {'name': 'name', 'label': 'Name', 'type': 'text'},
    {'name': 'superpowers', 'label': 'Superpowers', 'type': 'array'},
    {'name': 'num_ep_feat', 'label': 'Number of episodes featuring', 'type': 'integer'},
]


CASES = [
    {
        'name': 'Dustin',
        'superpowers': ['logic', 'reason', 'imagination'],
        'num_ep_feat': 8,
    },
    {
        'name': 'Eleven',
        'superpowers': ['psychokinesis', 'astral_projection', 'reason'],
        'num_ep_feat': 8,
    },
    {
        'name': 'Lucas',
        'superpowers': ['courage', 'skepticism', 'reason'],
        'num_ep_feat': 8,
    },
    {
        'name': 'Mike',
        'superpowers': ['compassion', 'imagination', 'reason'],
        'num_ep_feat': 8,
    },
    {
        'name': 'Will',
        'superpowers': ['misfortune', 'survival', 'best_80s_haircut'],
        'num_ep_feat': 7,
    },
]
