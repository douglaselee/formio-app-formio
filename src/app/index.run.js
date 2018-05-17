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

        // Get version
        Formio.makeStaticRequest(Formio.getApiUrl() + '/version', 'GET', null, {ignoreCache: true}).then(function (result) {
          $rootScope.version = result;
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
          window.open(url);
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

        // Have server synchronize AD groups and users with Mongo roles and users
        $rootScope.syncAD = function($event) {
          $event.preventDefault();
          if (!$rootScope.syncing) {
            $rootScope.syncing = true;
            FormioAlerts.getAlerts();
            FormioAlerts.addAlert({
              type: 'warning',
              message: 'AD synchronization is in progress'
            });
            Formio.makeStaticRequest(Formio.getApiUrl() + '/adsync', 'POST', null, {ignoreCache: true}).then(function (result) {
              FormioAlerts.getAlerts();
              FormioAlerts.addAlert({
                type: 'success',
                message: result
              });
              $rootScope.syncing = false;
            }, function(error) {
              FormioAlerts.getAlerts();
              FormioAlerts.addAlert({
                type: 'danger',
                message: error
              });
              $rootScope.syncing = false;
            });
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
                                //'<formio form="form"></formio>' +
                                  '<formio src="src" submission="sub"></formio>' +
                                '</div>' +
                              '</div>' +
                            '</div>' +
                          '</div>';

          ngDialog.open({
            template: template,
            plain: true,
            scope: $rootScope,
            controller: ['$scope', function($scope) {
              $scope.src  = 'http://localhost:3001/form/5ae1d64e29dc983678801f06';
              $scope.sub  = {data: {additions: [], collisions: [], messages: []}};
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
                    "url": Formio.getBaseUrl() + "/project/5ad8f1bc2fb22d4850bc250d" + "/api/import",
                    "tags": [],
                    "conditional": {
                      "eq": "",
                      "when": null,
                      "show": ""
                    }
                  }
                ]
              };

              var hideButtons = function() {
                angular.forEach($scope.form.components, function(component) {
                  if (component.key === 'additions') {
                      component.validate.minLength = 
                      component.validate.maxLength = $scope.sub.data.additions.length;
                  }
                  if (component.key === 'collisions') {
                      component.validate.minLength = 
                      component.validate.maxLength = $scope.sub.data.collisions.length;
                  }
                  if (component.key === 'messages') {
                      component.validate.minLength = 
                      component.validate.maxLength = $scope.sub.data.messages.length;
                  }
                });
              };

              $scope.$on('formLoad', function(event, form) {
                event.stopPropagation(); // Don't confuse app
                $scope.form = form;
                hideButtons();
              });

              $scope.$on('formSubmission', function(event, data) {
                $scope.sub.data.additions.length  = 0;
                $scope.sub.data.collisions.length = 0;
                $scope.sub.data.messages.length   = 0;
                if (data) {
                  if (!Array.isArray(data)) {
                    data = [data];
                  }
                  angular.forEach(data, function(item) {
                    if (item.action && item.machineName && item.action === 'create') {
                      $scope.sub.data.additions.push(item);
                    }
                    else
                    if (item.action && item.machineName) {
                      $scope.sub.data.collisions.push(item);
                    }
                    else {
                      $scope.sub.data.messages.push(item);
                    }
                  });
                }
                else {
                  $scope.sub.data.messages.push({message: 'File has been imported'});
                }
                hideButtons();
              });
              
              // Clear collisions on successful file upload
              $scope.$on('fileUploaded', function() {
                $scope.sub.data.additions.length  = 0;
                $scope.sub.data.collisions.length = 0;
                $scope.sub.data.messages.length   = 0;
                hideButtons();
                $scope.$digest();
              });

              // Clear collisions on successful file upload
              $scope.$on('fileRemoved', function() {
                $scope.sub.data.additions.length  = 0;
                $scope.sub.data.collisions.length = 0;
                $scope.sub.data.messages.length   = 0;
                hideButtons();
              });

              /*
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
                var errors = [];
                try {
                  errors = JSON.parse(response);
                }
                catch (exception) {
                  errors.push({message: response});
                }
                FormioAlerts.getAlerts();
                FormioAlerts.addAlert({
                  type: 'danger',
                  message: 'File has not been imported!'
                });
                angular.forEach(errors, function(error) {
                  FormioAlerts.onError(error);
                });
              //$scope.targetScope.formioAlerts = $rootScope.alerts;
              //$scope.targetScope.$apply();
              });

              // Bind when the form is loaded.
              $scope.$on('formLoad', function(event) {
                event.stopPropagation(); // Don't confuse app
              //$scope.targetScope = event.targetScope;
              });
              */
            }]
          }).closePromise.then(function(/*e*/) {
          //var cancelled = e.value === false || e.value === '$closeButton' || e.value === '$document';
          });
        };
      }
    ]);
})();
