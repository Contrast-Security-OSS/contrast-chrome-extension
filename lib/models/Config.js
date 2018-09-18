"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _set = require("babel-runtime/core-js/set");

var _set2 = _interopRequireDefault(_set);

exports.default = Config;

var _util = require("../util.js");

var _index = require("../index.js");

var _contrastCredentials = require("./contrastCredentials.js");

var _contrastCredentials2 = _interopRequireDefault(_contrastCredentials);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import ApplicationTable from './ApplicationTable.js';
function Config(tab, url, credentialed, credentials, hasApp) {
  this.tab = tab;
  this.url = url;
  this.credentialed = credentialed;
  this.credentials = credentials;
  this.hasApp = hasApp;

  this._handleConfigButtonClick = this._handleConfigButtonClick.bind(this);
  this._handleAppsClick = this._handleAppsClick.bind(this);
  this._handleGearClick = this._handleGearClick.bind(this);
  this._handleConfigButtonClick = this._handleConfigButtonClick.bind(this);
}

// NOTE: States
// Show vulnerabilities
// Show app list
// Show config

/*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
var CREDENTIALED_CONFIG_SCREEN = 0;
var CONFIG_SCREEN = 1;
var VULNS_SCREEN = 2;
var APPS_SCREEN = 3;

var SCREEN_STATE = void 0;
var POPUP_STATE = new _set2.default();
var POPUP_SCREENS = {
  0: [
  // Credentialed Config
  document.getElementById("configuration-section"), document.getElementById("vulnerabilities-header"), document.getElementById("configured-footer")],
  1: [
  // Not Credentialed Config
  document.getElementById("configuration-section"), document.getElementById("configuration-header"), document.getElementById("configuration-footer")],
  2: [
  // Vulns
  document.getElementById("vulnerabilities-section"), document.getElementById("vulnerabilities-header"), document.getElementById("configured-footer")],
  3: [
  // Apps
  document.getElementById("application-table-container-section"), document.getElementById("vulnerabilities-header"), document.getElementById("configured-footer")]
};
Config.prototype.popupScreen = function () {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

  if (typeof state !== "number") {
    state = this.getPopupScreen();
  }
  // console.log("DOCUMENT", document.getElementById("configuration-section"));
  for (var key in POPUP_SCREENS) {
    if (Object.prototype.hasOwnProperty.call(POPUP_SCREENS, key)) {
      if (parseInt(key, 10) !== state) {
        POPUP_SCREENS[key].forEach(function (el) {
          if (el) (0, _util.setElementDisplay)(el, "none");
        });
      }
    }
  }

  // NOTE: Set these last
  for (var _key in POPUP_SCREENS) {
    if (Object.prototype.hasOwnProperty.call(POPUP_SCREENS, _key)) {
      if (parseInt(_key, 10) === state) {
        POPUP_SCREENS[_key].forEach(function (el) {
          if (el) (0, _util.setElementDisplay)(el, "flex");
        });
      }
    }
  }
  if (state === 0) {
    this.setCredentialsInSettings();
  }
  POPUP_STATE.add(state);
  SCREEN_STATE = state;
  return state;
};

Config.prototype.getPopupScreen = function () {
  if (!this.credentialed) {
    return CONFIG_SCREEN; // Config
  } else if (this._isContrastPage() && this.credentialed) {
    return CREDENTIALED_CONFIG_SCREEN; // Credentialed Config
  } else if (!this._isContrastPage() && this.hasApp) {
    return VULNS_SCREEN; // Vulns
  } else if (!this._isContrastPage() && this.credentialed) {
    return APPS_SCREEN; // Apps
  }
  console.error("Rogue Popup Screen");
  return CONFIG_SCREEN;
};

Config.prototype.setCredentialsInSettings = function () {
  var urlInput = document.getElementById("contrast-url-input");
  var serviceKeyInput = document.getElementById("contrast-service-key-input");
  var userNameInput = document.getElementById("contrast-username-input");
  var apiKeyInput = document.getElementById("contrast-api-key-input");
  var orgUuidInput = document.getElementById("contrast-org-uuid-input");

  var teamServerUrl = this.credentials[_util.TEAMSERVER_URL];
  var serviceKey = this.credentials[_util.CONTRAST_SERVICE_KEY];
  var apiKey = this.credentials[_util.CONTRAST_API_KEY];
  var profileEmail = this.credentials[_util.CONTRAST_USERNAME];
  var orgUuid = this.credentials[_util.CONTRAST_ORG_UUID];

  urlInput.value = teamServerUrl;
  serviceKeyInput.value = serviceKey;
  userNameInput.value = profileEmail;
  apiKeyInput.value = apiKey;
  orgUuidInput.value = orgUuid;
};

/**
 * addListenerToConfigButton - renders the button the user clicks to configure teamserver credentials
 *
 * @param  {Object} tab the current tab
 * @return {void}
 */
Config.prototype.addListenerToConfigButton = function () {
  var configButton = document.getElementById("configure-extension-button");
  configButton.addEventListener("click", this._handleConfigButtonClick, false);
};

Config.prototype._handleConfigButtonClick = function (e) {
  var configButton = e.target;
  configButton.setAttribute("disabled", true);

  // whenever user configures, remove all traces and apps, useful for when reconfiguring
  chrome.storage.local.remove([_util.STORED_APPS_KEY, _util.STORED_TRACES_KEY], function () {
    if (chrome.runtime.lastError) {
      throw new Error("Error removing stored apps and stored traces");
    }
  });

  // NOTE: Don't scrape if user has input data
  var inputs = document.getElementsByClassName("user-inputs");
  var inputsWithValue = [];
  for (var i = 0, len = inputs.length; i < len; i++) {
    if (inputs[i].innerText && inputs[i].innerText.length > 0) {
      inputsWithValue.push(true);
    }
    inputsWithValue.push(false);
  }

  if (this._isTeamserverAccountPage() && inputsWithValue.every(function (i) {
    return i === false;
  })) {
    this._configureUserByScrapingContrast();
  } else {
    this._storeCustomUserConfiguration();
  }
};

Config.prototype._storeCustomUserConfiguration = function () {
  var serviceKeyInput = document.getElementById("contrast-service-key-input");
  var userNameInput = document.getElementById("contrast-username-input");
  var apiKeyInput = document.getElementById("contrast-api-key-input");

  var orgUuidInput = document.getElementById("contrast-org-uuid-input");
  var orgUuid = void 0;
  if (this._isContrastPage()) {
    orgUuid = this._getOrgUUIDFromURL();
    orgUuidInput.value = orgUuid;
  } else {
    orgUuid = orgUuidInput.value;
  }

  var urlInput = document.getElementById("contrast-url-input");
  var teamServerUrl = void 0;
  if (this._isContrastPage()) {
    teamServerUrl = this._getContrastURL();
    urlInput.value = teamServerUrl;
  } else {
    teamServerUrl = this._buildContrastUrl(urlInput.value);
  }
  try {
    if (!apiKeyInput.value || apiKeyInput.value.length === 0) {
      throw new Error("API Key cannot be blank.");
    } else if (!serviceKeyInput.value || serviceKeyInput.value.length === 0) {
      throw new Error("Service Key cannot be blank.");
    } else if (!userNameInput.value || userNameInput.value.length === 0) {
      throw new Error("Username cannot be blank.");
    } else if (!teamServerUrl || teamServerUrl.length === 0) {
      throw new Error("Contrast URL cannot be blank.");
    } else if (!orgUuid || orgUuid.length === 0) {
      throw new Error("Organization UUID cannot be blank.");
    }
  } catch (e) {
    return this.renderFailureMessage(e);
  }

  var contrastObj = new _contrastCredentials2.default({
    apiKey: apiKeyInput.value,
    orgUuid: orgUuid,
    teamServerUrl: teamServerUrl,
    serviceKey: serviceKeyInput.value,
    profileEmail: userNameInput.value
  });
  try {
    this._storeContrastCredentials(contrastObj);
    return true;
  } catch (e) {
    this.renderFailureMessage(e);
    return false;
  }
};

Config.prototype._getContrastURL = function (urlInput) {
  if (urlInput && urlInput.value && urlInput.value.length > 0) {
    return this._buildContrastUrl(urlInput.value);
  } else if (this._isContrastPage()) {
    var url = new URL(this.url);
    var origin = url.origin;
    return origin + "/Contrast/api";
  }
  return "";
};

Config.prototype._buildContrastUrl = function (url) {
  if (url.split("http://").length === 1 && url.split("https://").length === 1) {
    if (url.includes("localhost")) {
      url = "http://" + url;
    } else {
      url = "https://" + url;
    }
  }
  url = new URL(url);
  url = url.origin + "/Contrast/api";
  return url;
};

Config.prototype.renderFailureMessage = function (error, timeout) {
  var configButton = document.getElementById("configure-extension-button");
  var failure = document.getElementById("config-failure");
  var failureMessage = document.getElementById("config-failure-message");
  if (error) (0, _util.setElementText)(failureMessage, error.toString());
  (0, _util.changeElementVisibility)(failure);
  (0, _util.setElementDisplay)(configButton, "none");
  (0, _util.hideElementAfterTimeout)(failure, function () {
    configButton.removeAttribute("disabled");
    (0, _util.setElementDisplay)(configButton, "block");
  }, timeout);
};

Config.prototype.renderSuccessMessage = function (contrastObj) {
  var _this = this;

  var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {
    return null;
  };
  var timeout = arguments[2];

  // recurse on indexFunction, credentials should have been set in content-script so this part of indexFunction will not be evaluated again
  var configButton = document.getElementById("configure-extension-button");
  var successMessage = document.getElementById("config-success");
  var configFooterText = document.getElementById("config-footer-text");
  (0, _util.changeElementVisibility)(successMessage);
  (0, _util.setElementDisplay)(configButton, "none");
  configFooterText.innerText = "";
  configFooterText.innerHTML = loadingIconHTML();
  this._updateCredentials(contrastObj);
  (0, _util.hideElementAfterTimeout)(successMessage, function () {
    configButton.removeAttribute("disabled");
    (0, _util.setElementDisplay)(configButton, "block");
    configFooterText.innerHTML = "";
    configButton.removeEventListener("click", _this._handleConfigButtonClick);

    return callback();
  }, timeout);
};

Config.prototype._storeContrastCredentials = function (contrastObj) {
  var _this2 = this;

  chrome.storage.local.set(contrastObj, function () {
    if (chrome.runtime.lastError) {
      throw new Error("Error setting configuration");
    } else {
      _this2.renderSuccessMessage(contrastObj, _index.indexFunction);
    }
  });
};

Config.prototype._getOrgUUIDFromURL = function () {
  var url = new URL(this.url);
  var hash = url.hash;
  var orgUUID = hash.split("/")[1];
  if (_util.UUID_V4_REGEX.test(orgUUID)) {
    return orgUUID;
  }
  return null;
};

Config.prototype._configureUserByScrapingContrast = function () {
  var _this3 = this;

  // credentials are set by sending a message to content-script
  chrome.tabs.sendMessage(this.tab.id, { url: this.tab.url, action: _util.CONTRAST_INITIALIZE }, function (response) {
    if (!response || !response.action) {
      _this3.renderFailureMessage();
      return;
    }
    // NOTE: In development if the extension is reloaded and the web page is not response will be undefined and throw an error. The solution is to reload the webpage.
    if (response.action === _util.CONTRAST_INITIALIZED) {
      if (response.success) {
        chrome.browserAction.setBadgeText({ tabId: _this3.tab.id, text: "" });
        _this3.renderSuccessMessage(response.contrastObj, _index.indexFunction);
        _this3.setCredentialsInSettings();

        var section = document.getElementById("configuration-section");
        section.display = "none";
        (0, _util.hideElementAfterTimeout)(section);
      } else {
        _this3.renderFailureMessage(response.message);
      }
    } else {
      _this3.renderFailureMessage();
    }
    return;
  });
};

Config.prototype._updateCredentials = function (credentialsObj) {
  this.credentials = credentialsObj;
  this.credentialed = true;
};

/**
 * _isTeamserverAccountPage - checks if we're on the teamserver Organization Settings > API page
 *
 * @param  {Object} tab the current tab
 * @param  {URL<Object>} url url object of the current tab
 * @return {Boolean} if it is the teamserver page
 */
Config.prototype._isTeamserverAccountPage = function () {
  if (!this.tab || !this.url) {
    throw new Error("_isTeamserverAccountPage expects tab or url");
  }

  var conditions = [this.tab.url.startsWith("http"), _util.VALID_TEAMSERVER_HOSTNAMES.includes(this.url.hostname), this.tab.url.endsWith(_util.TEAMSERVER_ACCOUNT_PATH_SUFFIX) || this.tab.url.endsWith(_util.TEAMSERVER_PROFILE_PATH_SUFFIX), this.tab.url.indexOf(_util.TEAMSERVER_INDEX_PATH_SUFFIX) !== -1];
  return conditions.every(function (c) {
    return !!c;
  });
};

Config.prototype._isContrastPage = function () {
  if (!this.tab || !this.url) {
    throw new Error("_isTeamserverAccountPage expects tab or url");
  }
  var conditions = [this.tab.url.startsWith("http"), _util.VALID_TEAMSERVER_HOSTNAMES.includes(this.url.hostname), this.tab.url.includes("/Contrast/static/ng")];
  return conditions.every(function (c) {
    return !!c;
  });
};

Config.prototype.renderContrastUsername = function (credentials) {
  var userEmail = document.getElementById("user-email");
  (0, _util.setElementText)(userEmail, credentials[_util.CONTRAST_USERNAME]);
  userEmail.addEventListener("click", function () {
    var contrastIndex = credentials.teamserver_url.indexOf("/api");
    var teamserverUrl = credentials.teamserver_url.substring(0, contrastIndex);
    chrome.tabs.create({ url: teamserverUrl });
  }, false);
};

Config.prototype.setGearIcon = function () {
  // configure button opens up settings page in new tab
  var configureGearIcon = document.getElementById("configure-gear");
  configureGearIcon.addEventListener("click", this._handleGearClick, false);

  var appIconContainer = document.getElementById("app-icon-container");
  appIconContainer.addEventListener("click", this._handleAppsClick, false);
};

Config.prototype._handleGearClick = function () {
  var configureGearContainer = document.getElementById("gear-container");

  configureGearContainer.classList.add("configure-gear-rotate");
  setTimeout(function () {
    configureGearContainer.classList.remove("configure-gear-rotate");
  }, 1000);

  if (SCREEN_STATE !== CREDENTIALED_CONFIG_SCREEN) {
    this.popupScreen(CREDENTIALED_CONFIG_SCREEN);
  } else if (SCREEN_STATE === CREDENTIALED_CONFIG_SCREEN && POPUP_STATE.has(VULNS_SCREEN)) {
    this.popupScreen(VULNS_SCREEN);
  } else {
    this.popupScreen(CREDENTIALED_CONFIG_SCREEN);
  }
};

Config.prototype._handleAppsClick = function () {
  if (SCREEN_STATE !== APPS_SCREEN) {
    this.popupScreen(APPS_SCREEN);
  } else if (SCREEN_STATE === APPS_SCREEN && POPUP_STATE.has(VULNS_SCREEN)) {
    this.popupScreen(VULNS_SCREEN);
  } else {
    this.popupScreen(APPS_SCREEN);
  }
};

function loadingIconHTML() {
  return "<img style=\"float: right; padding-bottom: 20px; width: 50px;\" id=\"config-loading-icon\" class=\"loading-icon\" src=\"/img/ring-alt.gif\" alt=\"loading\">";
}