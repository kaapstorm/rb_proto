#!/usr/bin/env python3
# coding: utf-8
from __future__ import unicode_literals
from flask import Flask
from src.rb_proto.const import CASES


app = Flask(__name__)


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
    return CASES


if __name__ == '__main__':
    app.run()
