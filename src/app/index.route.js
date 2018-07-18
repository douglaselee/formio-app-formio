(function() {
  'use strict';
  angular
    .module('formioApp')
    .config(routeConfig);

  /** @ngInject */
  function routeConfig(
    $stateProvider,
    $urlRouterProvider,
    AppConfig,
    FormioFormBuilderProvider
  ) {
    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'views/main.html',
        controller: ['$scope', function($scope) {
          $scope.searchTypes = [
            {
              name: 'name',
              title: 'Name'
            },
            {
              name: 'title',
              title: 'Title'
            },
            {
              name: 'tags',
              title: 'Tags'
            }
          ];
          $scope.resources = [];
          $scope.resourcesUrl = AppConfig.appUrl + '/form?type=resource';
          $scope.resourcesUrlParams = {tags__ne: 'hidden'};
          $scope.resourcesLoading = true;
          $scope.resourcesSearch = '';
          $scope.resourcesSearchType = 'name';
          $scope.forms = [];
          $scope.formsUrl = AppConfig.appUrl + '/form?type=form';
          $scope.formsUrlParams = {tags__ne: 'hidden'};
          $scope.formsLoading = true;
          $scope.formsSearch = '';
          $scope.formsSearchType = 'name';
          $scope.formsPerPage = 5;
          try {
            $scope.resourcesSearch     = localStorage.getItem('resourcesSearch')     || '';
            $scope.resourcesSearchType = localStorage.getItem('resourcesSearchType') || 'name';
            $scope.formsSearch         = localStorage.getItem('formsSearch')         || '';
            $scope.formsSearchType     = localStorage.getItem('formsSearchType')     || 'name';
          }
          catch(exception) {
          }
          $scope.$on('pagination:loadPage', function (event, status, config) {
            if (config.url.indexOf('type=resource') !== -1) {
              $scope.resourcesLoading = false;
            }
            if (config.url.indexOf('type=form') !== -1) {
              $scope.formsLoading = false;
            }
          });
          $scope.updateResourceSearch = function() {
            var params = {tags__ne: 'hidden'};
            if ($scope.resourcesSearch.length > 0) {
              var paramName = $scope.resourcesSearchType+'__regex';
              params[paramName] = '/'+$scope.resourcesSearch+'/i';
            }
            $scope.resourcesUrlParams = params;
            try {
              localStorage.setItem('resourcesSearch',     $scope.resourcesSearch);
              localStorage.setItem('resourcesSearchType', $scope.resourcesSearchType);
            }
            catch(exception) {
            }
          };
          $scope.updateFormSearch = function() {
            var params = {tags__ne: 'hidden'};
            if ($scope.formsSearch.length > 0) {
              var paramName = $scope.formsSearchType+'__regex';
              params[paramName] = '/'+$scope.formsSearch+'/i';
            }
            $scope.formsUrlParams = params;
            try {
              localStorage.setItem('formsSearch',     $scope.formsSearch);
              localStorage.setItem('formsSearchType', $scope.formsSearchType);
            }
            catch(exception) {
            }
          };
          $scope.updateResourceSearch();
          $scope.updateFormSearch();
        }]
      });

    // Register the form builder provider.
    FormioFormBuilderProvider.register('', AppConfig.appUrl, {});

    // Register the form routes.
    $urlRouterProvider.otherwise('/');
  }

})();
