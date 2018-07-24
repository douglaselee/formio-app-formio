//var APP_URL = 'https://localhost:5454';
//var API_URL = 'https://localhost:5454';
var APP_URL = 'http://localhost:3001';
var API_URL = 'http://localhost:3001';

// Parse query string
var query = {};
location.search.substr(1).split("&").forEach(function(item) {
  query[item.split("=")[0]] = item.split("=")[1] && decodeURIComponent(item.split("=")[1]);
});

if (query['x-jwt-token']) {
  localStorage.setItem('formioToken', query['x-jwt-token']);
  localStorage.removeItem('formioAppUser');
  localStorage.removeItem('formioUser');
  window.history.pushState("", "", location.pathname + location.hash);
}

var appUrl = query.appUrl || APP_URL;
var apiUrl = query.apiUrl || API_URL;

angular.module('formioApp').constant('AppConfig', {
  appUrl: appUrl,
  apiUrl: apiUrl,
  forms: {
    userForm: appUrl + '/user',
    userLoginForm: appUrl + '/user/login',
    sendResetPassword: appUrl + '/sendreset',
    resetPassForm: appUrl + '/resetpassword'
  }
});
