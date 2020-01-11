var app = angular.module("app", [
  "ngCookies",
  "ngSanitize",
  "ui.bootstrap.contextMenu"
]);

/*
THIS IS MEANT TO BE A GLOBALS FILE
WHERE CONSTANTS, STATE_VARS AND COMMONLY-USED FUNCTIONS
WILL BE HELD.
*/

app.run(function($rootScope, $cookies, $interval, $http) {});