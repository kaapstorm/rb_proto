/* global ko, _, $ */
var rbProto = function () {
    var self = this;

    self.getColumnSpecs = function (columns, reportType) {
        var specs = _.map(columns, function (column) {
            return {
                "title": column["label"]
            };
        });
        if (reportType === "agg") {
            specs[0]['className'] = 'last-aggregated-column';
        }
        return specs;
    };

    self.getRows = function (data, columns) {
        var columnNames = _.map(columns, function (column) {
            return column["name"];
        });
        return _.map(data, function (dict) {
            return _.map(columnNames, function(columnName) {
                return dict[columnName];
            });
        }).sort();
    };

    self.ReportColumn = function (column, parent) {
        var self = this;

        self.name = column["name"];
        self.label = column["label"];
        self.data_type = column["data_type"];
        self.aggregation = ko.observable(column["aggregation"]);
        self.isFormatEnabled = ko.observable(false);
        self.isGroupByColumn = ko.observable(false);
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
        self.selectedColumns.extend({ rateLimit: 50 });

        self.reportType = ko.observable('list');
        self.reportType.subscribe(function (newValue) {
            var wasGroupByEnabled = self.isGroupByEnabled();
            self.isGroupByEnabled(newValue === "agg");
            self.previewChart(newValue === "agg" && self.selectedChart() !== "none");
            if (self.isGroupByEnabled() && !wasGroupByEnabled) {
                // Group by the first report column by default
                var firstColumn = self.selectedColumns().length > 0 ? self.selectedColumns()[0] : self.columns[0];
                self.selectedGroupByName(firstColumn.name);
            }
            self.setIsFormatEnabled();
            self.refreshPreview();
        });

        self.isGroupByEnabled = ko.observable(false);
        self.groupByHeading = ko.observable("Group By");
        self.groupByColumnStatus = ko.observable("Grouped By");
        self.selectedGroupByName = ko.observable();
        self.selectedGroupByName.subscribe(function (newValue) {
            if (newValue) {  // Check whether it has a value, because the user can unselect group by
                // Put the group-by column first in the report
                var selectedColumnNames = _.map(self.selectedColumns(), function (c) { return c.name; });
                var index = selectedColumnNames.indexOf(newValue);
                if (index === -1) {
                    // The column is not in the report. Insert it.
                    var column = _.find(self.columns, function (c) { return c["name"] === newValue; })
                    self.selectedColumns.unshift(new rbProto.ReportColumn(column, self))
                } else if (index > 0) {
                    // The column is already in the report, but not first. Bump it up.
                    var column = self.selectedColumns.splice(index, 1)[0];
                    self.selectedColumns.unshift(column);
                }
            }
            self.setIsFormatEnabled();
            self.refreshPreview();
        });

        self.isFormatEnabled = ko.observable(false);
        self.setIsFormatEnabled = function () {
            var isFormatEnabled = self.isGroupByEnabled() && self.selectedGroupByName();
            self.isFormatEnabled(isFormatEnabled);
            // enable "Format" dropdown for each column that is not the group-by column.
            _.each(self.selectedColumns(), function (column) {
                column.isFormatEnabled(isFormatEnabled && column.name !== self.selectedGroupByName());
                column.isGroupByColumn(isFormatEnabled && column.name === self.selectedGroupByName());
            });
        };

        self.newColumnName = ko.observable('');

        self.selectedChart = ko.observable('none');
        self.selectedChart.subscribe(function (newValue) {
            if (newValue === "none") {
                self.groupByHeading("Group By");
                self.groupByColumnStatus("Grouped By");
                self.previewChart(false);
            } else {
                self.groupByHeading("Categories");
                self.groupByColumnStatus("Category");
                self.previewChart(true);
                self.refreshPreview();
            }
        });

        self.previewChart = ko.observable(false);

        self.sum = function (array) {
            var sum = 0;
            try {
                _.each(array, function (x) {
                    if (!_.isNumber(x)) {
                        throw new TypeError('"' + x + '" is not a number.');
                    }
                    sum += x;
                });
            } catch (err) {
                return "---";
            }
            return sum;
        };

        self.avg = function (array) {
            var sum = self.sum(array);
            if (_.isNumber(sum)) {
                return sum / array.length;
            } else {
                return "---";
            }
        };

        self.count = function (array) {
            return array.length;
        }

        self.getAggData = function () {
            var aggColumns = _.filter(self.selectedColumns(), function (c) { return c.isFormatEnabled(); });
            var groups = {};
            // Group all data to be aggregated by group-by columns
            _.each(self.data, function (row) {
                var groupByColumnValue = row[self.selectedGroupByName()];
                _.each(aggColumns, function (column) {
                    if (typeof groups[groupByColumnValue] === "undefined") {
                        groups[groupByColumnValue] = {}
                    }
                    if (typeof groups[groupByColumnValue][column.name] === "undefined") {
                        groups[groupByColumnValue][column.name] = [row[column.name]];
                    } else {
                        groups[groupByColumnValue][column.name].push(row[column.name]);
                    }
                });
            });

            // data is a list of rows, where each row is a column-value object
            var data = _.map(groups, function (value, groupByColumnValue) {
                // *value* an object where keys are aggregation column names and values are lists to be aggregated
                var row = _.object([[self.selectedGroupByName(), groupByColumnValue]]);
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

            $('#preview').hide();
            if (columns.length === 0) {
                return;  // Nothing to do.
            }
            if (self.dataTable) {
                self.dataTable.destroy();
            }
            $('#preview').empty();
            self.dataTable = $('#preview').DataTable({
                "autoWidth": false,
                "ordering": false,
                "paging": false,
                "searching": false,
                "data": rbProto.getRows(data, columns),
                "columns": rbProto.getColumnSpecs(columns, self.reportType()),
            });
            $('#preview').show();

            if (self.selectedChart() !== "none") {
                var aaData = data;

                var aggColumns = _.filter(self.selectedColumns(), function (c) { 
                    return c.isFormatEnabled() && c.data_type === "integer";
                })
                var categoryNames = _.map(
                    _.filter(self.selectedColumns(), function (c) { return c.isFormatEnabled() === false; }),
                    function (c) { return c.name; }
                );
                if (aggColumns.length > 0 && categoryNames.length > 0) {
                    var chartSpecs;
                    if (self.selectedChart() === "bar") {
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
                return c["name"] === self.newColumnName();
            });
            self.selectedColumns.push(new rbProto.ReportColumn(column, self));
            self.setIsFormatEnabled();
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
