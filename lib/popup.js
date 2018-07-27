'use strict';

var _popupMethods = require('./popupMethods.js');

var _util = require('./util.js');

var _background = require('./background.js');

document.addEventListener('DOMContentLoaded', function () {
  chrome.storage.local.get(_util.STORED_APPS_KEY, function (result) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0]) return;

      var tab = tabs[0];
      var url = new URL(tab.url);
      var host = (0, _util.getHostFromUrl)(url);
      var store = result[_util.STORED_APPS_KEY];
      var app = store ? store.filter(function (app) {
        return app[host];
      })[0] : store;

      // console.log("app", app);
      // console.log("isContrastTeamserver(tab.url)", isContrastTeamserver(tab.url));

      if (app && !(0, _util.isEmptyObject)(app)) {
        (0, _util.getStoredCredentials)().then(function (items) {
          if ((0, _util.isCredentialed)(items)) {
            (0, _popupMethods.getStorageVulnsAndRender)(items, app);
          } else {
            throw new Error("Not Credentialed");
          }
        }).catch(function (error) {
          return new Error(error);
        });
      } else if ((0, _util.isContrastTeamserver)(tab.url)) {}
    });
  });
}, false); /*global
           chrome,
           document,
           */