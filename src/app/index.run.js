(function() {
  'use strict';
  angular
    .module('formioApp')
    .run([
      '$rootScope',
      '$timeout',
      'Formio',
      'AppConfig',
      'FormioAuth',
      'FormioAlerts',
      'ngDialog',
      '$filter',
      function(
        $rootScope,
        $timeout,
        Formio,
        AppConfig,
        FormioAuth,
        FormioAlerts,
        ngDialog,
        $filter
      ) {
        var stored = JSON.parse(localStorage.getItem("viewerSettings")) || {
          LANGUAGE: {}
        };
        $rootScope.language = stored.LANGUAGE.language || "ENGLISH";
        $rootScope.options  = ['ENGLISH', 'FRENCH', 'GERMAN', 'SPANISH', 'DUTCH', 'ITALIAN', 'PORTUGUESE', 'ROMANIAN'];
        $rootScope.$watch('language', function(newValue, oldValue) {
          if (newValue !== oldValue) {
            $filter('formioTranslate').use($rootScope.language);
          }
        });

        // Initialize the Form.io authentication system.
        FormioAuth.init();

        // Add the forms to the root scope.
        angular.forEach(AppConfig.forms, function(url, form) {
          $rootScope[form] = url;
        });

        $rootScope.view = function() {
          var url = $rootScope.userForm.replace('/user', '/view/#!/form/');
          if (this.form) {
            url += this.form._id;
          }
          else
          if (this.resource) {
            url += this.resource._id;
          }
          window.open(url + '?theme=yeti');
        };

        $rootScope.export = function($event) {
          if (!$rootScope.target) {
            $rootScope.target = $event.currentTarget;
            var _id = '0';
            if (this.form) {
              _id = this.form._id;
            }
            else
            if (this.resource) {
              _id = this.resource._id;
            }
            Formio.makeStaticRequest(Formio.getApiUrl() + '/export/' + _id, 'GET', null, {ignoreCache: true}).then(function (result) {
              $rootScope.template = JSON.stringify(result);
              $timeout(function() {
                $rootScope.target.click();
                $rootScope.target = null;
              });
            });
            $event.preventDefault();
          }
        };

        $rootScope.import = function($event) {
          $event.preventDefault();
          $event.target.blur(); // Clear blue box around Import

          var template  = '<br>' +
                          '<div class="row">' +
                            '<div class="col-sm-12">' +
                              '<div class="panel panel-default">' +
                                '<div class="panel-heading">' +
                                  '<h3 class="panel-title">{{ "Import" | formioTranslate}}</h3>' +
                                '</div>' +
                                '<div class="panel-body">' +
                                  '<formio form="form"></formio>' +
                                '</div>' +
                              '</div>' +
                            '</div>' +
                          '</div>';

          ngDialog.open({
            template: template,
            plain: true,
            scope: $rootScope,
            controller: ['$scope', function($scope) {
              $scope.form = {
                "title": "Form Import",
                "type": "form",
                "name": "formImport",
                "path": "formimport",
                "display": "form",
                "tags": [
                  "common"
                ],
                "components": [
                  {
                    "input": true,
                    "tableView": true,
                    "label": "File",
                    "key": "file",
                    "image": false,
                    "imageSize": "200",
                    "placeholder": "",
                    "multiple": false,
                    "defaultValue": "",
                    "protected": false,
                    "persistent": true,
                    "hidden": false,
                    "clearOnHide": true,
                    "type": "file",
                    "storage": "url",
                    "url": Formio.getBaseUrl() + "/api/import",
                    "tags": [],
                    "conditional": {
                      "eq": "",
                      "when": null,
                      "show": ""
                    }
                  }
                ]
              };

              // Close dialog on successful import
              $scope.$on('fileUploaded', function(event, fileName, fileInfo) {
                $scope.closeThisDialog(fileInfo);
                FormioAlerts.getAlerts();
                FormioAlerts.addAlert({
                  type: 'success',
                  message: 'File has been imported.'
                });
              });

              // Close dialog on unsuccessful import
              $scope.$on('fileUploadFailed', function(event, fileName, response) {
                $scope.closeThisDialog(response);
                var error = JSON.parse(response);
                FormioAlerts.getAlerts();
                FormioAlerts.addAlert({
                  type: 'danger',
                  message: 'File has not been imported!'
                });
                FormioAlerts.onError(error);
              });

              // Bind when the form is loaded.
              $scope.$on('formLoad', function(event) {
                event.stopPropagation(); // Don't confuse app
              });
            }]
          }).closePromise.then(function(/*e*/) {
          //var cancelled = e.value === false || e.value === '$closeButton' || e.value === '$document';
          });
        };
      }
    ]);
})();
