/* global ko, _, $ */
var rbProto = function () {
    var self = this;

    self.getColumnTitles = function (columns) {
        return _.map(columns, function (column) {
            return {"title": column["label"]};
        });
    };

    /**
     * ReportConfig is a view model for managing report configuration
     */
    self.ReportConfig = function (options) {
        var self = this;
        self.columns = options["columns"];
        self.rows = options["rows"];

        self.refreshPreview = function (columns) {
            $('#preview').DataTable({
                "destroy": true,  // Recreate the table with the new columns
                "data": self.rows,
                "columns": rbProto.getColumnTitles(columns),
            });
        }

        self.shouldShowGraphSelect = ko.observable(false);
        self.shouldShowGroupBy = ko.observable(false);

        self.selectedColumns = ko.observableArray(self.columns);
        self.selectedColumns.subscribe(function (newValue) {
            self.shouldShowGraphSelect(true);
            self.refreshPreview(newValue);
        });

        return self;
    };

    return self;

}();
