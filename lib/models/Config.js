'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Config;

var _util = require('../util.js');

function Config(tab, url, credentialed) {
  this.tab = tab;
  this.url = url;
  this.credentialed = credentialed;
}

/**
 * getUserConfiguration - renders the elements/dialog for a user configuring the connection from the extension to teamserver
 *
 * @param  {Object} tab the current tab
 * @param  {URL<Object>} url a url object of the current tab
 * @return {void}
 */
Config.prototype.getUserConfiguration = function () {
  if (this._isTeamserverAccountPage()) {
    var configExtension = document.getElementById('configure-extension');
    var configExtensionHost = document.getElementById('configure-extension-host');

    (0, _util.setElementDisplay)(configExtension, "block");
    (0, _util.setElementText)(configExtensionHost, 'Make sure you trust this site: ' + this.url.hostname);

    this._renderConfigButton(this.tab);
  } else {
    var notConfigured = document.getElementById('not-configured');
    (0, _util.setElementDisplay)(notConfigured, "");
  }
};

/**
 * renderConfigButton - renders the button the user clicks to configure teamserver credentials
 *
 * @param  {Object} tab the current tab
 * @return {void}
 */
Config.prototype._renderConfigButton = function () {
  var _this = this;

  var configButton = document.getElementById('configure-extension-button');
  (0, _util.setElementText)(configButton, this.credentialed ? "Reconfigure" : "Configure");

  configButton.addEventListener('click', function () {
    configButton.setAttribute('disabled', true);

    // whenever user configures, remove all traces and apps, useful for when reconfiguring
    chrome.storage.local.remove([_util.STORED_APPS_KEY, _util.STORED_TRACES_KEY], function () {
      if (chrome.runtime.lastError) {
        throw new Error("Error removing stored apps and stored traces");
      }
    });

    // credentials are set by sending a message to content-script
    chrome.tabs.sendMessage(_this.tab.id, { url: _this.tab.url, action: "INITIALIZE" }, function (response) {
      // NOTE: In development if the extension is reloaded and the web page is not response will be undefined and throw an error. The solution is to reload the webpage.

      if (response === "INITIALIZED") {
        chrome.browserAction.setBadgeText({ tabId: _this.tab.id, text: '' });

        // recurse on indexFunction, credentials should have been set in content-script so this part of indexFunction will not be evaluated again
        var successMessage = document.getElementById('config-success');
        (0, _util.changeElementVisibility)(successMessage);
        (0, _util.hideElementAfterTimeout)(successMessage, function () {
          configButton.removeAttribute('disabled');
        });
      } else {
        var failureMessage = document.getElementById('config-failure');
        (0, _util.changeElementVisibility)(failureMessage);
        (0, _util.hideElementAfterTimeout)(failureMessage, function () {
          configButton.removeAttribute('disabled');
        });
      }
      return;
    });
  }, false);
};

/**
 * _isTeamserverAccountPage - checks if we're on the teamserver Your Account page
 *
 * @param  {Object} tab the current tab
 * @param  {URL<Object>} url url object of the current tab
 * @return {Boolean} if it is the teamserver page
 */
Config.prototype._isTeamserverAccountPage = function () {
  if (!this.tab || !this.url) throw new Error("_isTeamserverAccountPage expects tab or url");

  var conditions = [this.tab.url.startsWith("http"), _util.VALID_TEAMSERVER_HOSTNAMES.includes(this.url.hostname), this.tab.url.endsWith(_util.TEAMSERVER_ACCOUNT_PATH_SUFFIX) || this.tab.url.endsWith(_util.TEAMSERVER_PROFILE_PATH_SUFFIX), this.tab.url.indexOf(_util.TEAMSERVER_INDEX_PATH_SUFFIX) !== -1];
  return conditions.every(function (c) {
    return !!c;
  });
};

Config.prototype.renderContrastUsername = function (credentials) {
  var userEmail = document.getElementById('user-email');
  (0, _util.setElementText)(userEmail, 'User: ' + credentials[_util.CONTRAST_USERNAME]);
  (0, _util.setElementDisplay)(userEmail, "block");
  userEmail.addEventListener('click', function () {
    var contrastIndex = credentials.teamserver_url.indexOf("/Contrast/api");
    var teamserverUrl = credentials.teamserver_url.substring(0, contrastIndex);
    chrome.tabs.create({ url: teamserverUrl });
  }, false);
};

Config.prototype.setGearIcon = function () {
  var _this2 = this;

  //configure button opens up settings page in new tab
  var configureGearIcon = document.getElementById('configure-gear');
  configureGearIcon.addEventListener('click', function () {
    chrome.tabs.create({ url: _this2._chromeExtensionSettingsUrl() });
  }, false);
};

Config.prototype._chromeExtensionSettingsUrl = function () {
  var extensionId = chrome.runtime.id;
  return 'chrome-extension://' + String(extensionId) + '/settings.html';
};