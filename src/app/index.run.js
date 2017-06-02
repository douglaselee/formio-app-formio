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
      'ngDialog',
      function(
        $rootScope,
        $timeout,
        Formio,
        AppConfig,
        FormioAuth,
        ngDialog
      ) {
        // Initialize the Form.io authentication system.
        FormioAuth.init();

        // Add the forms to the root scope.
        angular.forEach(AppConfig.forms, function(url, form) {
          $rootScope[form] = url;
        });

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
                                  '<formio src="formUrl"></formio>' +
                                '</div>' +
                              '</div>' +
                            '</div>' +
                          '</div>';

          ngDialog.open({
            template: template,
            plain: true,
            scope: $rootScope,
            controller: ['$scope', function($scope) {
              $scope.formUrl = 'http://localhost:3001/form/592effbe2241044730052574/';

              // Close dialog on successful import
              $scope.$on('fileUploaded', function(event, fileName, fileInfo) {
                $scope.closeThisDialog(fileInfo);
              });

              // Close dialog on unsuccessful import
              $scope.$on('fileUploadFailed', function(event, fileName, response) {
                $scope.closeThisDialog(response);
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
