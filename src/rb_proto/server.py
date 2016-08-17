#!/usr/bin/env python3
# coding: utf-8
from __future__ import unicode_literals
import json
from flask import Flask
from werkzeug.contrib.cache import SimpleCache
from rb_proto.const import CASES


app = Flask(__name__)
cache = SimpleCache()


def get_cases():
    cases = cache.get('cases')
    if cases is None:
        cases = CASES
        cache.set('cases', cases)
    return cases


@app.route('/')
def index():
    """
    Report Builder Prototype index page
    """
    return 'Report Builder Prototype'


@app.route('/preview/')
def preview():
    """
    Report Builder Prototype async live preview
    """
    return json.dumps(get_cases())


if __name__ == '__main__':
    app.run()
