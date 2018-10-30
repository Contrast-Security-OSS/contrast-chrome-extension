'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

exports.default = ConnectedDomain;

var _util = require('../util.js');

var _Application = require('./Application.js');

var _Application2 = _interopRequireDefault(_Application);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
function ConnectedDomain(host, application) {
  this.host = host;
  this.application = application;
}

ConnectedDomain.prototype.connectDomain = function () {
  return this._addDomainToStorage();
};

/**
 * _addDomainToStorage - add a domain + app name connection to chrome storage
 *
 * @param  {String} host        the host/domain of the application
 * @param  {String} application the name of the application
 * @return {Promise}            if storing the data succeeded
 */
ConnectedDomain.prototype._addDomainToStorage = function () {
  var _this = this;

  var host = this.host,
      application = this.application;


  return new _promise2.default(function (resolve, reject) {
    chrome.storage.local.get(_util.STORED_APPS_KEY, function (result) {
      if (chrome.storage.lastError) {
        return reject(new Error("Error retrieving stored apps"));
      }

      // no applications stored so result[STORED_APPS_KEY] is undefined
      if (!result[_util.STORED_APPS_KEY]) result[_util.STORED_APPS_KEY] = [];

      // Verify that the domain of the app to be connected isn't already in use by the extension
      if (!_this._verifyDomainNotInUse(result[_util.STORED_APPS_KEY], host)) {
        return reject(new Error('The Domain ' + host + ' is already in use by another application: ' + app.name + '. Please either first disconnect that application or run this application on a different domain/port.'));
      }

      var app = new _Application2.default(host, application);

      var updatedStoredApps = result[_util.STORED_APPS_KEY].concat(app);

      var applicationTable = document.getElementById("application-table");
      chrome.storage.local.set((0, _defineProperty3.default)({}, _util.STORED_APPS_KEY, updatedStoredApps), function () {
        (0, _util.setElementDisplay)(applicationTable, "none");
        resolve(!chrome.storage.lastError);
      });
    });
  });
};

ConnectedDomain.prototype._verifyDomainNotInUse = function (storedApps, host) {
  if (storedApps.length > 0) {
    for (var i = 0, len = storedApps.length; i < len; i++) {
      var app = storedApps[i];
      if (app.domain === host) {
        return false;
      }
    }
  }
  return true;
};

ConnectedDomain.prototype.disconnectDomain = function () {
  return this._removeDomainFromStorage();
};

/**
 * _removeDomainFromStorage - removes an application + domain connection from storage
 *
 * @param  {String} host               the host/domain of the application
 * @param  {Array<String>} storedApps  the array of stored apps
 * @param  {String} application        the name of the application to remove
 * @param  {Node} disconnectButton     button user clicks remove an application
 * @return {Promise}                   if the removal succeeded
 */
ConnectedDomain.prototype._removeDomainFromStorage = function () {
  var _this2 = this;

  return new _promise2.default(function (resolve, reject) {

    chrome.storage.local.get(_util.STORED_APPS_KEY, function (result) {
      var updatedStoredApps = _this2._filterOutApp(result);

      chrome.storage.local.set((0, _defineProperty3.default)({}, _util.STORED_APPS_KEY, updatedStoredApps), function () {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError));
        }
        resolve(!chrome.runtime.lastError);
      });
    });
  });
};

/**
 * @description ConnectedDomain.prototype._filterOutApp - create a new array of connected apps that does not include the application belonging to this
 *
 * @param  {Array<Application>} storedApps - connected apps in chrome storage
 * @return {Array<Application>}            - filtered apps in chrome storage
 */
ConnectedDomain.prototype._filterOutApp = function (storedApps) {
  var _this3 = this;

  return storedApps[_util.STORED_APPS_KEY].filter(function (app) {
    return app.id !== _this3.application.id;
  });
};