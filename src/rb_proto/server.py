#!/usr/bin/env python3
# coding: utf-8
from __future__ import unicode_literals
import json
from flask import abort, Flask, render_template, request, Response
from werkzeug.contrib.cache import SimpleCache
from rb_proto.const import CASES, COLUMNS


app = Flask(__name__)
cache = SimpleCache()


def get_cases(all_=False):
    cases = cache.get('cases')
    if cases is None or all_:
        cases = CASES
        cache.set('cases', cases)
    return cases


def get_columns(all_=False):
    columns_ = cache.get('columns')
    if columns_ is None or all_:
        columns_ = COLUMNS
        cache.set('columns', columns_)
    return columns_


def get_column(name):
    try:
        return [c for c in COLUMNS if c['name'] == name][0]
    except IndexError:
        raise ValueError('Column name "{}" not found'.format(name))


@app.route('/')
def index():
    """
    Report Builder Prototype index page
    """
    return render_template('index.html')


@app.route('/preview/')
def preview():
    """
    Report Builder Prototype async live preview
    """
    return Response(json.dumps({'data': get_cases()}), status=200, mimetype='application/json')


@app.route('/api/1/columns/', methods=['GET', 'POST'])
def columns():
    """
    Returns SELECTED columns.

    For ALL columns, GET /columns/_all/
    """
    if request.method == 'POST':
        # Add a column
        name = request.get_json()['name']
        if name not in {c['name'] for c in get_columns()}:
            cache.set('columns', get_columns() + [get_column(name)])
    return Response(json.dumps(get_columns()), status=200, mimetype='application/json')


@app.route('/api/1/columns/<name>/', methods=['GET', 'DELETE'])
def column(name):
    if request.method == 'GET':
        if name == '_all':
            return Response(json.dumps(COLUMNS), status=200, mimetype='application/json')
        else:
            try:
                return Response(json.dumps(get_column(name)), status=200, mimetype='application/json')
            except ValueError:
                return Response('', status=404, mimetype='application/json')

    elif request.method == 'DELETE':
        if name == '_all':
            # Unselect all columns
            cache.set('columns', [])
        else:
            # Drop a column
            if name in {c['name'] for c in get_columns()}:
                cache.set('columns', [c for c in get_columns() if c['name'] != name])
        return Response('', status=204, mimetype='application/json')


if __name__ == '__main__':
    app.run()
