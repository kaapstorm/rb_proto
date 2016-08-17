/* global ko, _, $ */
var rbProto = function () {
    var self = this;

    /**
     * ReportConfig is a view model for managing report configuration
     */
    self.ReportConfig = function (options) {
        var self = this;
        self.allColumns = options["columns"];

        self.refreshPreview = function (columns) {
            var columnNames = _.map(columns, function (column) {
                return {"data": column["name"]};
            });
            $('#preview').DataTable({
                "destroy": true,  // Recreate the table with the new columns
                "ajax": "/preview/",
                "columns": columnNames
            });
        }

        self.shouldShowGraphSelect = ko.observable(false);
        self.shouldShowGroupBy = ko.observable(false);

        self.selectedColumns = ko.observableArray(options["columns"]);
        self.selectedColumns.subscribe(function (newValue) {
            self.shouldShowGraphSelect(true);
            self.refreshPreview();
        });

        return self;
    };

    return self;

}();
