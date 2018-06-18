"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = Application;

var _util = require("../util.js");

function Application(host, teamserverApplication) {
  this[host] = teamserverApplication.app_id;
  this.id = teamserverApplication.app_id;
  this.name = teamserverApplication.name;
  this.domain = host;
  this.host = host;
}

/**
* retrieveApplicationFromStorage - get the name of an application from storage by using those host/domain name of the current tab url
*
* @param  {Object} tab           - the active tab in the active window
* @return {Promise<Application>} - a connected application
*/
Application.retrieveApplicationFromStorage = function (tab) {
  return new Promise(function (resolve, reject) {
    chrome.storage.local.get(_util.STORED_APPS_KEY, function (result) {
      if (chrome.runtime.lastError) {
        reject(new Error("Error retrieving stored applications"));
      }

      if (!result || !result[_util.STORED_APPS_KEY]) {
        result = { APPS: [] };
      }

      var url = new URL(tab.url);
      var host = (0, _util.getHostFromUrl)(url);

      var application = result[_util.STORED_APPS_KEY].filter(function (app) {
        return app.host === host;
      })[0];
      // application = result[STORED_APPS_KEY].filter(app => app[host])[0];

      if (!application) {
        if (!(0, _util.isBlacklisted)(tab.url) && !chrome.runtime.lastError) {
          try {
            (0, _util.updateTabBadge)(tab, _util.CONTRAST_CONFIGURE_TEXT, _util.CONTRAST_YELLOW);
          } catch (e) {
            console.log(e);
            reject(new Error("Error updating tab badge"));
          }
        } else if ((0, _util.isBlacklisted)(tab.url) && !chrome.runtime.lastError) {
          try {
            (0, _util.updateTabBadge)(tab, '', _util.CONTRAST_GREEN);
          } catch (e) {
            reject(new Error("Error updating tab badge"));
          }
        }
        resolve(null);
      } else {
        resolve(application);
      }
    });
  });
};

/**
 * @description - filters an array of storedapps to get a single application
 *
 * @param  {Array<Application>} storedApps - connected apps in chrome storage
 * @param  {Object} application            - an application from an Org
 * @return {Array<Application>}            - array of 1 connected app
 */
Application.getStoredApp = function (storedApps, application) {
  if (!application) throw new Error("application must be defined");
  return storedApps[_util.STORED_APPS_KEY].filter(function (app) {
    console.log("app", app, application);
    return app.id === application.app_id;
  })[0];
};

/**
 * @description - can't use a colon in app name (because objects), sub colon for an underscore. Needed when dealing with ports in app name like localhost:8080
 *
 * @param  {Application} storedApp - the connected application
 * @return {String}                - app domain with colon swapped in/out
 */
Application.subDomainColonForUnderscore = function (storedApp) {
  var domain = void 0;
  if ((typeof storedApp === "undefined" ? "undefined" : _typeof(storedApp)) === "object") {
    domain = Object.keys(storedApp)[0];
  } else {
    // storedApp is a string
    domain = storedApp;
  }
  return this._subColonOrUnderscore(domain);
};

/**
 * @description - Replaces all colons with underscores or all underscores with colons
 *
 * @param  {String} string - the string to replace the characters on
 * @return {String}        - a string with characters replaced
 */
Application._subColonOrUnderscore = function (string) {
  if (string.includes("_")) {
    return string.split("_").join(":"); // local dev stuff
  } else if (string.includes(":")) {
    return string.split(":").join("_"); // local dev stuff
  }
  return string;
};