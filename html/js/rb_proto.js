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

    self.ReportColumn = function (column) {
        var self = this;

        self.name = column["name"];
        self.label = column["label"];
        self.data_type = column["data_type"];
        self.aggregation = ko.observable(column["aggregation"]);
        self.isFormatEnabled = ko.observable(false);

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
            return new rbProto.ReportColumn(column);
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
        });

        self.isGroupByEnabled = ko.observable(false);
        self.groupByHeading = ko.observable("Group By");
        self.selectedGroupBy = ko.observableArray([]);
        self.selectedGroupBy.subscribe(function (newValue) {
            self.setIsFormatEnabled();
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

        self.refreshPreview = function (columns) {
            self.dataTable.destroy();
            $('#preview').empty();
            self.dataTable = $('#preview').DataTable({
                "autoWidth": false,
                "ordering": false,
                "paging": false,
                "searching": false,
                "data": rbProto.getRows(self.data, columns),
                "columns": rbProto.getColumnTitles(columns),
            });

            if (self.selectedGraph() === "multibar" || self.selectedGraph() === "pie") {
                self.renderChart(self.data, $('#chart'));
            }
        }

        self.removeColumn = function (column) {
            self.selectedColumns.remove(column);
        };

        self.addColumn = function () {
            var column = _.find(self.columns, function (c) {
                return c["name"] == self.newColumnName();
            });
            self.selectedColumns.push(new rbProto.ReportColumn(column));
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

        self.renderChart = function (aaData, chartElement) {
            var charts = hqImport('reports_core/js/charts.js');
            var chartSpecs = [
                {
                    // Aggregations
                    "y_axis_columns": [
                        {"display": "# Household", "column_id": "household_size"}
                    ],
                    // Categories
                    "x_axis_column": "location",
                    "title": null,
                    "is_stacked": false,
                    "aggregation_column": null,
                    "chart_id": "5221328456932991781",
                    "type": "multibar"
                }
            ];

            charts.render(chartSpecs, aaData, chartElement);
        };

        return self;
    };

    return self;

}();
