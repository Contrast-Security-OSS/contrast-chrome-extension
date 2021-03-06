"use strict";

var _popupMethods = require("./popupMethods.js");

var _util = require("./util.js");

/*global
chrome,
document,
*/

// import {
//   renderVulnerableLibraries,
// } from './libraries/showLibraries.js'
document.addEventListener("DOMContentLoaded", function () {
  chrome.storage.local.get(_util.STORED_APPS_KEY, function (result) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs[0]) return;

      var tab = tabs[0];
      var url = new URL(tab.url);
      var host = (0, _util.getHostFromUrl)(url);
      var store = result[_util.STORED_APPS_KEY];
      var app = store ? store.filter(function (a) {
        return a[host];
      })[0] : store;

      if (app && !(0, _util.isEmptyObject)(app)) {
        (0, _util.getStoredCredentials)().then(function (items) {
          if ((0, _util.isCredentialed)(items)) {
            renderLoadingIcon();
            (0, _popupMethods.getStorageVulnsAndRender)(items, app, tab);
            // renderVulnerableLibraries(tab, app)
          } else {
            throw new Error("Not Credentialed");
          }
        }).catch(function (error) {
          return new Error(error);
        });
      } else {
        var vulnsFound = document.getElementById("vulnerabilities-found-on-page");
        (0, _util.setElementDisplay)(vulnsFound, "none");
        (0, _popupMethods.hideLoadingIcon)();
      }
    });
  });
}, false);

function renderLoadingIcon() {
  var loading = document.getElementById("vulns-loading");
  loading.style.display = "block";
}