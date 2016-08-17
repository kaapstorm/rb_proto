Report Builder Prototype
========================

Installation
------------

Create a virtualenv that uses Python 3, because we can:

    $ mkvirtualenv -p python3 rb_proto


Start The Server
----------------

    $ workon rb_proto
    (rb_proto) $ PYTHONPATH=src src/rb_proto/server.py


Design Spec
-----------

[Report Builder Prototype Design](https://docs.google.com/document/d/18cm2wmajcysXNCFopXf0hKvoadC6hPB_gn6JHWixv0A/edit#)


Endpoints
---------

* Landing page: <http://127.0.0.1:5000/>
* Async live preview: <http://127.0.0.1:5000/preview/>


