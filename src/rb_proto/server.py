#!/usr/bin/env python3
# coding: utf-8
from __future__ import unicode_literals
import json
from flask import Flask, render_template, Response
from rb_proto.const import CASES, COLUMNS


app = Flask(__name__)


@app.route('/')
def index():
    """
    Report Builder Prototype index page
    """
    column_names = [{'data': c['name']} for c in COLUMNS]
    return render_template('index.html', columns=COLUMNS, column_names=column_names)


@app.route('/preview/')
def preview():
    """
    Report Builder Prototype async live preview
    """
    return Response(json.dumps({'data': CASES}), status=200, mimetype='application/json')


if __name__ == '__main__':
    app.run()
