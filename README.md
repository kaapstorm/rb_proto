Report Builder Prototype
========================

Installation
------------

Create a virtualenv that uses Python 3, because we can:

    $ mkvirtualenv -p python3 rb_proto


Start The Server
----------------

    $ workon rb_proto
    (rb_proto) $ export PYTHONPATH=src 
    (rb_proto) $ src/rb_proto/server.py

or, run the Flask debug server:

    (rb_proto) $ export PYTHONPATH=src 
    (rb_proto) $ export FLASK_APP=rb_proto.server 
    (rb_proto) $ export FLASK_DEBUG=1 
    (rb_proto) $ flask run


Design Spec
-----------

[Report Builder Prototype Design](https://docs.google.com/document/d/18cm2wmajcysXNCFopXf0hKvoadC6hPB_gn6JHWixv0A/edit#)


Endpoints
---------

* Landing page: <http://127.0.0.1:5000/>
* Async live preview: <http://127.0.0.1:5000/preview/>
* API: 
  * <http://127.0.0.1:5000/api/1/columns/> (GET, POST)
  * <http://127.0.0.1:5000/api/1columns/NAME/> (GET, DELETE)
  * <http://127.0.0.1:5000/api/1columns/all_/> (GET, DELETE)


