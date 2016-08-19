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

    /**
     * ReportConfig is a view model for managing report configuration
     */
    self.ReportConfig = function (options) {
        var self = this;
        self.columns = options["columns"];
        self.data = options["data"];

        self.refreshPreview = function (columns) {
            $('#preview').empty();
            $('#preview').DataTable({
                "destroy": true,  // Recreate the table with the new columns
                "data": rbProto.getRows(self.data, columns),
                "columns": rbProto.getColumnTitles(columns),
            });
        }

        self.selectedColumns = ko.observableArray(self.columns);
        self.selectedColumns.subscribe(function (newValue) {
            self.refreshPreview(newValue);
        });

        self.selectedGraph = ko.observable('list');
        self.selectedGraph.subscribe(function (newValue) {
            self.isGroupByEnabled(newValue !== "list");
            self.isFormatEnabled(self.isGroupByEnabled() && self.selectedGroupBy().length > 0);
        });

        self.isGroupByEnabled = ko.observable(false);
        self.selectedGroupBy = ko.observableArray([]);
        self.selectedGroupBy.subscribe(function (newValue) {
            self.isFormatEnabled(self.isGroupByEnabled() && self.selectedGroupBy().length > 0);
        });

        self.isFormatEnabled = ko.observable(false);

        return self;
    };

    return self;

}();
