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
      function(
        $rootScope,
        $timeout,
        Formio,
        AppConfig,
        FormioAuth
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
            Formio.makeStaticRequest(Formio.getApiUrl() + '/export').then(function (result) {
              $rootScope.template = JSON.stringify(result);
              $timeout(function() {
                $rootScope.target.click();
                $rootScope.target = null;
              });
            });
            $event.preventDefault();
          }
        };
      }
    ]);
})();
