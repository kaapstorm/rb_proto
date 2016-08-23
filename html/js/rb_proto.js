/* global ko, _, $ */
var rbProto = function () {
    var self = this;

    self.getColumnTitles = function (columns) {
        return _.map(columns, function (column) {
            return {"title": column["label"]};
        });
    };

    self.getRows = function (data, columns) {
        var columnNames = _.map(columns, function (column) {
            return column["name"];
        });
        return _.map(data, function (dict) {
            return _.values(_.pick(dict, columnNames));
        });
    }

    self.ReportColumn = function (column, parent) {
        var self = this;

        self.name = column["name"];
        self.label = column["label"];
        self.data_type = column["data_type"];
        self.aggregation = ko.observable(column["aggregation"]);
        self.isFormatEnabled = ko.observable(false);
        self.aggregation.subscribe(function (newValue) {
            parent.refreshPreview();
        });

        return self;
    };

    /**
     * ReportConfig is a view model for managing report configuration
     */
    self.ReportConfig = function (config) {
        var self = this;
        self.columns = config["columns"];
        self.data = config["data"];
        self.dataTable = config["dataTable"];

        self.selectedColumns = ko.observableArray(_.map(self.columns, function (column) {
            return new rbProto.ReportColumn(column, self);
        }));
        self.selectedColumns.subscribe(function (newValue) {
            self.refreshPreview(newValue);
        });

        self.selectedGraph = ko.observable('list');
        self.selectedGraph.subscribe(function (newValue) {
            if (newValue === "multibar" || newValue === "pie") {
                self.groupByHeading("Categories");
                self.previewChart(true);
            } else {
                self.previewChart(false);
            }
            if (newValue === "agg") {
                self.groupByHeading("Group By");
            }
            self.isGroupByEnabled(newValue !== "list");
            self.setIsFormatEnabled();
            self.refreshPreview();
        });

        self.isGroupByEnabled = ko.observable(false);
        self.groupByHeading = ko.observable("Group By");
        self.selectedGroupBy = ko.observableArray([]);
        self.selectedGroupBy.subscribe(function (newValue) {
            self.setIsFormatEnabled();
            self.refreshPreview();
        });

        self.isFormatEnabled = ko.observable(false);
        self.setIsFormatEnabled = function () {
            var isFormatEnabled = self.isGroupByEnabled() && self.selectedGroupBy().length > 0;
            self.isFormatEnabled(isFormatEnabled);
            _.each(self.selectedColumns(), function (column) {
                column.isFormatEnabled(isFormatEnabled && self.selectedGroupBy.indexOf(column) == -1);
            });
        };

        self.newColumnName = ko.observable('');

        self.previewChart = ko.observable(false);

        self.sum = function (array) {
            var sum = 0;
            _.each(array, function (x) { sum += _.isNumber(x) ? x : 0; });
            return sum;
        };

        self.avg = function (array) {
            return self.sum(array) / array.length;
        };

        self.count = function (array) {
            return array.length;
        }

        self.getAggData = function () {
            var aggColumns = _.filter(self.selectedColumns(), function (c) { return c.isFormatEnabled(); });
            var groups = {};
            // Group all data to be aggregated by group-by columns
            _.each(self.data, function (row) {
                // key is a "|"-separated string of values of group-by columns
                var key = _.map(self.selectedGroupBy(), function (c) { return row[c.name]}).join("|");
                _.each(aggColumns, function (column) {
                    if (typeof groups[key] === "undefined") {
                        groups[key] = {}
                    }
                    if (typeof groups[key][column.name] === "undefined") {
                        groups[key][column.name] = [row[column.name]];
                    } else {
                        groups[key][column.name].push(row[column.name]);
                    }
                });
            });

            // Aggregate grouped data
            var groupByColumnNames = _.map(self.selectedGroupBy(), function (c) { return c.name; });
            // data is a list of rows, where each row is a column-value object
            var data = _.map(groups, function (value, key) {
                // *key* is "|"-separated-values of group-by columns.
                // *value* an object where keys are aggregation columns and values are lists to be aggregated
                var keyValues = key.split("|");
                var row = _.object(groupByColumnNames, keyValues);  // == dict(zip(groupByColumnNames, keyValues))
                _.each(aggColumns, function (column) {
                    var array = value[column.name];
                    var aggValue = {
                        "avg": self.avg,
                        "count": self.count,
                        "sum": self.sum,
                    }[column.aggregation()](array);
                    _.extend(row, _.object([[column.name, aggValue]]))
                });
                return row;
            });
            return data;
        };

        self.refreshPreview = function (columns) {
            columns = typeof columns !== "undefined" ? columns : self.selectedColumns();
            var charts = hqImport('reports_core/js/charts.js');

            var data = self.isFormatEnabled() ? self.getAggData() : self.data;

            self.dataTable.destroy();
            $('#preview').empty();
            self.dataTable = $('#preview').DataTable({
                "autoWidth": false,
                "ordering": false,
                "paging": false,
                "searching": false,
                "data": rbProto.getRows(data, columns),
                "columns": rbProto.getColumnTitles(columns),
            });

            if (self.selectedGraph() === "multibar" || self.selectedGraph() === "pie") {
                var aaData = data;

                var aggColumns = _.filter(self.selectedColumns(), function (c) { return c.isFormatEnabled(); })
                var categoryNames = _.map(
                    _.filter(self.selectedColumns(), function (c) { return c.isFormatEnabled() === false; }),
                    function (c) { return c.name; }
                );
                if (aggColumns.length > 0 && categoryNames.length > 0) {
                    var chartSpecs;
                    if (self.selectedGraph() === "multibar") {
                        var aggColumnsSpec = _.map(aggColumns, function (c) {
                            return {"display": c.label, "column_id": c.name};
                        });
                        chartSpecs = [{
                            "type": "multibar",
                            "chart_id": "5221328456932991781",
                            "title": null,
                            "y_axis_columns": aggColumnsSpec,
                            "x_axis_column": categoryNames[0],
                            "is_stacked": false,
                            "aggregation_column": null,
                        }];
                    } else {
                        // pie
                        chartSpecs = [{
                            "type": "pie",
                            "chart_id": "-6021326752156782988",
                            "title": null,
                            "value_column": aggColumns[0].name,
                            "aggregation_column": categoryNames[0],
                        }];
                    }
                    charts.render(chartSpecs, aaData, $('#chart'));
                }
            }
        }

        self.removeColumn = function (column) {
            self.selectedColumns.remove(column);
        };

        self.addColumn = function () {
            var column = _.find(self.columns, function (c) {
                return c["name"] == self.newColumnName();
            });
            self.selectedColumns.push(new rbProto.ReportColumn(column, self));
            self.newColumnName('');
        };

        self.otherColumns = ko.computed(function () {
            var names = _.map(self.selectedColumns(), function (c) { return c.name; });
            return _.filter(self.columns, function (c) {
                return !_.contains(names, c["name"]);
            });
        });

        self.moreColumns = ko.computed(function () {
            return self.otherColumns().length > 0;
        });

        return self;
    };

    return self;

}();
