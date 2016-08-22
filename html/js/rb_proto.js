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
        // This will preview the chart once per column when the chart type is changed.
        //self.isFormatEnabled.subscribe(function (newValue) {
        //    parent.refreshPreview();
        //});

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
                self.refreshPreview();
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

        self.refreshPreview = function (columns) {
            columns = typeof columns !== "undefined" ? columns : self.selectedColumns();
            var charts = hqImport('reports_core/js/charts.js');

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
                var aaData = self.data; // TODO: Calculate values to be charted

                var aggregation_columns = _.map(
                    _.filter(self.selectedColumns(), function (c) { return c.isFormatEnabled(); }),
                    function (c) { return {"display": c.label, "column_id": c.name}; }
                );
                var category_names = _.map(
                    _.filter(self.selectedColumns(), function (c) { return c.isFormatEnabled() === false; }),
                    function (c) { return c.name; }
                );
                if (aggregation_columns.length > 0 && category_names.length > 0) {
                    var chartSpecs;
                    if (self.selectedGraph() === "multibar") {
                        chartSpecs = [{
                            "type": "multibar",
                            "chart_id": "5221328456932991781",
                            "title": null,
                            "y_axis_columns": aggregation_columns,
                            "x_axis_column": category_names[0],
                            "is_stacked": false,
                            "aggregation_column": null,
                        }];
                    } else {
                        // pie
                        chartSpecs = [{
                            "type": "pie",
                            "chart_id": "-6021326752156782988",
                            "title": null,
                            "value_column": category_names[0],
                            "aggregation_column": aggregation_columns[0]["column_id"],
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
