Report Builder Prototype
========================

Usage
-----

Open html/index.html in a modern browser


Design Spec
-----------

[Report Builder Prototype Design](https://docs.google.com/document/d/18cm2wmajcysXNCFopXf0hKvoadC6hPB_gn6JHWixv0A/edit#)

### Type of Report

* Dropdown that lets you choose a type of the report. Options are:
  * List of Items
  * Bar Chart
  * Pie Chart
  * Aggregated Table

### Group By

* Only shown if you choose something other than List
* Title of this is “Categories” if you choose a chart or “Group By” if you choose an aggregated table
* A single dropdown to group data - this dropdown should contain list of all data columns

### Columns

* "Add a column" button.
* For each column, a dropdown that lets you choose column titled “Column”
* "Format" dropdown (only shown if grouping by something) titled “Format”
* Format options are "Sum", "Average" and "Count Per Choice"
* If switching from a list to something else, default is "Count Per Choice"
* "Remove column" button next to each column
* To consider: "Add a Column" should be type-ahead suggest (like case management)


Source
------

Open html/index.html in your favourite editor. Search for "<rb_proto>" to find
the HTML and JavaScript blocks. The Knockout view model is defined in
html/js/rb_proto.js.
