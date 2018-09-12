'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Config;

var _util = require('../util.js');

var _index = require('../index.js');

/*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
function Config(tab, url, credentialed, credentials) {
  this.tab = tab;
  this.url = url;
  this.credentialed = credentialed;
  this.credentials = credentials;

  this._handleConfigButtonClick = this._handleConfigButtonClick.bind(this);
}

var POPUP_STATES = {
  notContrastNotConfigured: 0,
  contrastNotConfigured: 1,
  contrastYourAccountNotConfigured: 2,
  contrastYourAccountConfigured: 3,
  contrastConfigured: 4,
  notContrastConfigured: 5
};

Config.prototype.popupState = function () {
  // contrast and configured - 0
  if (this._isTeamserverAccountPage() && !this.credentialed) {
    return POPUP_STATES.contrastYourAccountNotConfigured;
  }
  // teamserver page and configured - 3
  else if (this._isTeamserverAccountPage() && this.credentialed) {
      return POPUP_STATES.contrastYourAccountConfigured;
    }
    // contrast but not configured - 1
    else if (this._isContrastPage() && !this.credentialed) {
        return POPUP_STATES.contrastNotConfigured;
      }
      // teamserver page but not configured - 2
      else if (!this._isContrastPage() && !this.credentialed) {
          return POPUP_STATES.notContrastNotConfigured;
        }
        // not a contrast page and not configured - 4
        else if (this._isContrastPage() && this.credentialed) {
            return POPUP_STATES.contrastConfigured;
          }
          // not a contrast page but configured - 5
          else if (!this._isContrastPage() && this.credentialed) {
              return POPUP_STATES.notContrastConfigured;
            }
  throw new Error("Whoops");
};

/**
 * getUserConfiguration - renders the elements/dialog for a user configuring the connection from the extension to teamserver
 *
 * @param  {Object} tab the current tab
 * @param  {URL<Object>} url a url object of the current tab
 * @return {void}
 */
Config.prototype.getUserConfiguration = function () {
  console.log("get user configuration");
  var userEmail = document.getElementById('user-email');
  var configSection = document.getElementById('configuration-section');
  var configHeader = document.getElementById('configuration-header');
  var configHeaderText = document.getElementById('config-header-text');
  var configFooter = document.getElementById('configuration-footer');
  var configFooterText = document.getElementById('config-footer-text');
  var configuredFooter = document.getElementById('configured-footer');
  var configContainer = document.getElementById('configure-extension');
  var vulnsSection = document.getElementById('vulnerabilities-section');
  var vulnsHeader = document.getElementById('vulnerabilities-header');
  var vulnsHeaderText = document.getElementById('vulns-header-text');
  var scanLibsText = document.getElementById('scan-libs-text');
  var appTableContainer = document.getElementById('application-table-container-div');
  var configButton = document.getElementById('configure-extension-button');
  var configGear = document.getElementById('configure-gear');

  var popupState = this.popupState();
  console.log("This popupstate is ", popupState);
  switch (popupState) {
    case 0:
      {
        console.log("case 0, notContrastNotConfigured");
        (0, _util.setElementDisplay)(vulnsSection, "none");
        (0, _util.setElementDisplay)(vulnsHeader, "none");
        (0, _util.setElementDisplay)(configuredFooter, "none");
        (0, _util.setElementDisplay)(configFooter, "block");
        (0, _util.setElementDisplay)(configContainer, "none");
        (0, _util.setElementDisplay)(appTableContainer, "none");
        (0, _util.setElementDisplay)(configHeader, "flex");
        (0, _util.setElementText)(configHeaderText, "Set Up Configuration");
        (0, _util.setElementDisplay)(configButton, "none");
        (0, _util.setElementDisplay)(configGear, "none");
        break;
      }
    case 1:
      {
        console.log("case 1 contrastNotConfigured");
        (0, _util.setElementDisplay)(vulnsSection, "none");
        (0, _util.setElementDisplay)(vulnsHeader, "none");
        (0, _util.setElementDisplay)(configFooter, "block");
        (0, _util.setElementDisplay)(configuredFooter, "none");
        (0, _util.setElementDisplay)(configContainer, "block");
        (0, _util.setElementDisplay)(appTableContainer, "none");
        (0, _util.setElementDisplay)(configHeader, "flex");
        (0, _util.setElementDisplay)(configButton, "none");
        (0, _util.setElementText)(configHeaderText, "Connection Settings");
        (0, _util.setElementText)(configFooterText, "Log into Contrast and go to Your Account so we can grab your keys.");
        (0, _util.setElementDisplay)(configGear, "block");
        break;
      }
    case 2:
      {
        console.log("case 2 contrastYourAccountNotConfigured");
        (0, _util.setElementDisplay)(vulnsSection, "none");
        (0, _util.setElementDisplay)(vulnsHeader, "none");
        (0, _util.setElementDisplay)(configFooter, "block");
        (0, _util.setElementDisplay)(configuredFooter, "none");
        (0, _util.setElementDisplay)(configContainer, "block");
        (0, _util.setElementDisplay)(appTableContainer, "none");
        (0, _util.setElementDisplay)(configHeader, "flex");
        (0, _util.setElementDisplay)(configButton, "block");
        (0, _util.setElementText)(configHeaderText, "Connection Settings");
        (0, _util.setElementText)(configFooterText, "Click the Connect button to get started.");
        (0, _util.setElementDisplay)(configGear, "block");
        this._renderConfigButton(configButton);
        configContainer.classList.toggle('collapsed');
        break;
      }
    case 3:
      {
        console.log("case 3 contrastYourAccountConfigured");
        (0, _util.setElementDisplay)(vulnsSection, "none");
        (0, _util.setElementDisplay)(vulnsHeader, "flex");
        vulnsHeader.classList.remove('flex-row-space-between');
        vulnsHeader.classList.add('flex-row-head');
        (0, _util.setElementDisplay)(configSection, "block");
        (0, _util.setElementDisplay)(configFooter, "none");
        (0, _util.setElementDisplay)(configuredFooter, "flex");
        (0, _util.setElementDisplay)(configContainer, "block");
        (0, _util.setElementDisplay)(configHeader, "none");
        (0, _util.setElementDisplay)(configButton, "block");
        (0, _util.setElementDisplay)(userEmail, "block");
        // setElementDisplay(scanLibsText, "none");
        (0, _util.setElementText)(vulnsHeaderText, "Configured");
        (0, _util.setElementDisplay)(configGear, "block");
        this.setCredentialsInSettings();
        this._renderConfigButton(configButton);
        configContainer.classList.toggle('collapsed');
        break;
      }
    case 4:
      {
        console.log("case 4 contrastConfigured");
        (0, _util.setElementDisplay)(vulnsSection, "none");
        (0, _util.setElementDisplay)(vulnsHeader, "flex");
        vulnsHeader.classList.remove('flex-row-space-between');
        vulnsHeader.classList.add('flex-row-head');
        (0, _util.setElementDisplay)(configuredFooter, "flex");
        (0, _util.setElementDisplay)(configFooter, "none");
        (0, _util.setElementDisplay)(configContainer, "block");
        (0, _util.setElementDisplay)(configHeader, "none");
        (0, _util.setElementDisplay)(configButton, "none");
        (0, _util.setElementDisplay)(userEmail, "block");
        // setElementDisplay(scanLibsText, "none");
        (0, _util.setElementDisplay)(configGear, "block");
        (0, _util.setElementText)(vulnsHeaderText, "Configured");
        this.setCredentialsInSettings();
        configSection.classList.add('collapsed');
        break;
      }
    case 5:
      {
        console.log("case 5 notContrastConfigured");
        (0, _util.setElementDisplay)(vulnsSection, "flex");
        (0, _util.setElementDisplay)(vulnsHeader, "flex");
        vulnsHeader.classList.add('flex-row-space-between');
        vulnsHeader.classList.remove('flex-row-head');
        vulnsHeaderText.style.fontSize = '3.75vw';
        (0, _util.setElementDisplay)(configFooter, "none");
        (0, _util.setElementDisplay)(configuredFooter, "flex");
        (0, _util.setElementDisplay)(configContainer, "none");
        (0, _util.setElementDisplay)(configHeader, "none");
        (0, _util.setElementDisplay)(configButton, "none");
        (0, _util.setElementDisplay)(userEmail, "block");
        (0, _util.setElementDisplay)(configGear, "none");
        break;
      }
    default:
      {
        console.log("Default Case");
        break;
      }
  }
  (0, _util.setElementDisplay)(scanLibsText, "none");
};

Config.prototype.setCredentialsInSettings = function () {
  var urlInput = document.getElementById("contrast-url-input");
  var serviceKeyInput = document.getElementById("contrast-service-key-input");
  var userNameInput = document.getElementById("contrast-username-input");
  var apiKeyInput = document.getElementById("contrast-api-key-input");

  var teamServerUrl = this.credentials[_util.TEAMSERVER_URL];
  var serviceKey = this.credentials[_util.CONTRAST_SERVICE_KEY];
  var apiKey = this.credentials[_util.CONTRAST_API_KEY];
  var profileEmail = this.credentials[_util.CONTRAST_USERNAME];

  urlInput.value = teamServerUrl;
  serviceKeyInput.value = serviceKey;
  userNameInput.value = apiKey;
  apiKeyInput.value = profileEmail;
};

/**
 * renderConfigButton - renders the button the user clicks to configure teamserver credentials
 *
 * @param  {Object} tab the current tab
 * @return {void}
 */
Config.prototype._renderConfigButton = function (configButton) {
  configButton.addEventListener('click', this._handleConfigButtonClick, false);
};

Config.prototype._handleConfigButtonClick = function (e) {
  var _this = this;

  var configButton = e.target;
  configButton.setAttribute('disabled', true);

  // whenever user configures, remove all traces and apps, useful for when reconfiguring
  chrome.storage.local.remove([_util.STORED_APPS_KEY, _util.STORED_TRACES_KEY], function () {
    if (chrome.runtime.lastError) {
      throw new Error("Error removing stored apps and stored traces");
    }
  });

  // credentials are set by sending a message to content-script
  chrome.tabs.sendMessage(this.tab.id, { url: this.tab.url, action: _util.CONTRAST_INITIALIZE }, function (response) {
    var failureMessage = document.getElementById('config-failure');
    if (!response || !response.action) {
      (0, _util.changeElementVisibility)(failureMessage);
      (0, _util.setElementDisplay)(configButton, "none");
      (0, _util.hideElementAfterTimeout)(failureMessage, function () {
        configButton.removeAttribute('disabled');
        (0, _util.setElementDisplay)(configButton, "block");
      });
      return;
    }
    // NOTE: In development if the extension is reloaded and the web page is not response will be undefined and throw an error. The solution is to reload the webpage.
    if (response.action === _util.CONTRAST_INITIALIZED) {
      chrome.browserAction.setBadgeText({ tabId: _this.tab.id, text: '' });
      // recurse on indexFunction, credentials should have been set in content-script so this part of indexFunction will not be evaluated again
      var successMessage = document.getElementById('config-success');
      var configFooterText = document.getElementById('config-footer-text');
      (0, _util.changeElementVisibility)(successMessage);
      (0, _util.setElementDisplay)(configButton, "none");
      configFooterText.innerText = "";
      configFooterText.innerHTML = loadingIconHTML();
      _this._updateCredentials(response.contrastObj);
      (0, _util.hideElementAfterTimeout)(successMessage, function () {
        configButton.removeAttribute('disabled');
        (0, _util.setElementDisplay)(configButton, "block");
        configFooterText.innerHTML = "";
        configButton.removeEventListener('click', _this._handleConfigButtonClick);

        (0, _index.indexFunction)();
      });
      _this.setCredentialsInSettings();

      var section = document.getElementById('configuration-section');
      section.display = 'none';
      (0, _util.hideElementAfterTimeout)(section);
    } else {
      (0, _util.changeElementVisibility)(failureMessage);
      (0, _util.setElementDisplay)(configButton, "none");
      (0, _util.hideElementAfterTimeout)(failureMessage, function () {
        configButton.removeAttribute('disabled');
        (0, _util.setElementDisplay)(configButton, "block");
      });
    }
    return;
  });
};

Config.prototype._updateCredentials = function (credentialsObj) {
  this.credentials = credentialsObj;
  this.credentialed = true;
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

Config.prototype._isContrastPage = function () {
  if (!this.tab || !this.url) throw new Error("_isTeamserverAccountPage expects tab or url");
  console.log("is contrast page url", this.tab.url);
  var conditions = [this.tab.url.startsWith("http"), _util.VALID_TEAMSERVER_HOSTNAMES.includes(this.url.hostname), this.tab.url.includes('Contrast')];
  return conditions.every(function (c) {
    return !!c;
  });
};

Config.prototype.renderContrastUsername = function (credentials) {
  var userEmail = document.getElementById('user-email');
  (0, _util.setElementText)(userEmail, credentials[_util.CONTRAST_USERNAME]);
  userEmail.addEventListener('click', function () {
    var contrastIndex = credentials.teamserver_url.indexOf("/api");
    var teamserverUrl = credentials.teamserver_url.substring(0, contrastIndex);
    chrome.tabs.create({ url: teamserverUrl });
  }, false);
};

Config.prototype.setGearIcon = function () {
  // configure button opens up settings page in new tab
  var configureGearIcon = document.getElementById('configure-gear');
  configureGearIcon.addEventListener('click', this._handleGearClick, false);
};

Config.prototype._handleGearClick = function () {
  console.log("clicked gear");
  var configureGearIcon = document.getElementById('gear-container');
  console.log(configureGearIcon);
  var configContainer = document.getElementById('configuration-section');
  configureGearIcon.classList.add('configure-gear-rotate');
  setTimeout(function () {
    configureGearIcon.classList.remove('configure-gear-rotate');
    // configureGearIcon.removeEventListener('click', this._handleGearClick);
  }, 1000);
  configContainer.classList.toggle('collapsed');
};

function loadingIconHTML() {
  return '<img style="float: right; padding-bottom: 20px; width: 50px;" id="config-loading-icon" class="loading-icon" src="/img/ring-alt.gif" alt="loading">';
}