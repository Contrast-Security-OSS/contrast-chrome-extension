/*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
import {
  STORED_APPS_KEY,
  STORED_TRACES_KEY,
  VALID_TEAMSERVER_HOSTNAMES,
  TEAMSERVER_ACCOUNT_PATH_SUFFIX,
  TEAMSERVER_PROFILE_PATH_SUFFIX,
  TEAMSERVER_INDEX_PATH_SUFFIX,
  CONTRAST_INITIALIZE,
  CONTRAST_INITIALIZED,
  setElementText,
  setElementDisplay,
  changeElementVisibility,
  hideElementAfterTimeout,
  TEAMSERVER_URL,
  CONTRAST_SERVICE_KEY,
  CONTRAST_API_KEY,
  CONTRAST_USERNAME,
} from '../util.js'

import ApplicationTable from './ApplicationTable.js';
import { indexFunction } from '../index.js';

export default function Config(tab, url, credentialed, credentials, hasApp) {
  this.tab = tab;
  this.url = url;
  this.credentialed = credentialed;
  this.credentials = credentials;
  this.hasApp = hasApp;

  this._handleConfigButtonClick = this._handleConfigButtonClick.bind(this);
  this._handleAppsClick = this._handleAppsClick.bind(this);
  this._handleGearClick = this._handleGearClick.bind(this);
}

// NOTE: States
// Show vulnerabilities
// Show app list
// Show config

let POPUP_STATE = [];
const POPUP_SCREENS = {
  0: [ // Credentialed Config
    document.getElementById('configuration-section'),
    document.getElementById('vulnerabilities-header'),
    document.getElementById('configured-footer'),
  ],
  1: [ // Not Credentialed Config
    document.getElementById('configuration-section'),
    document.getElementById('configuration-header'),
    document.getElementById('configuration-footer'),
  ],
  2: [ // Vulns
    document.getElementById('vulnerabilities-section'),
    document.getElementById('vulnerabilities-header'),
    document.getElementById('configured-footer'),
  ],
  3: [ // Apps
    document.getElementById('application-table-container-section'),
    document.getElementById('vulnerabilities-header'),
    document.getElementById('configured-footer'),
  ]
}
Config.prototype.popupScreen = function(state = null) {
  console.log("Popup Screen Before State is ", state);
  if (typeof state !== 'number') {
    state = this.getPopupScreen();
  }
  console.log("Popup Screen State After is ", state);
  for (let key in POPUP_SCREENS) {
    // console.log("key", key, typeof key);
    if (key != state) {
      POPUP_SCREENS[key].forEach(el => setElementDisplay(el, "none"));
    }
  }
  for (let key in POPUP_SCREENS) {
    // console.log("key", key, typeof key);
    if (key == state) {
      POPUP_SCREENS[key].forEach(el => setElementDisplay(el, "flex")); // do these last
    }
  }
  // const vulnsHeader = document.getElementById('vulnerabilities-header');
  const configTabs = document.getElementById('configuration-tabs-container');
  if (state === 0 && this._isContrastPage()) {
    setElementDisplay(configTabs, "flex");
  } else {
    setElementDisplay(configTabs, "none");
  }
  return state;
}
Config.prototype.getPopupScreen = function() {
  if (!this.credentialed) {
    return 1; // Config
  } else if (this._isContrastPage() && this.credentialed) {
    return 0; // Credentialed Config
  } else if (!this._isContrastPage() && this.hasApp) {
    return 2; // Vulns
  } else if (!this._isContrastPage() && this.credentialed) {
    return 3; // Apps
  }
  console.error("getPopupScreen SHOULD NOT BE HERE!");
  return 1;
}

Config.prototype.setCredentialsInSettings = function() {
  const urlInput = document.getElementById("contrast-url-input");
  const serviceKeyInput = document.getElementById("contrast-service-key-input");
  const userNameInput = document.getElementById("contrast-username-input");
  const apiKeyInput = document.getElementById("contrast-api-key-input");

  const teamServerUrl = this.credentials[TEAMSERVER_URL];
  const serviceKey = this.credentials[CONTRAST_SERVICE_KEY];
  const apiKey = this.credentials[CONTRAST_API_KEY];
  const profileEmail = this.credentials[CONTRAST_USERNAME];

  urlInput.value = teamServerUrl;
  serviceKeyInput.value = serviceKey;
  userNameInput.value = apiKey;
  apiKeyInput.value = profileEmail;
}

/**
 * renderConfigButton - renders the button the user clicks to configure teamserver credentials
 *
 * @param  {Object} tab the current tab
 * @return {void}
 */
Config.prototype._renderConfigButton = function(configButton) {
  configButton.addEventListener('click', this._handleConfigButtonClick, false);
}

Config.prototype._handleConfigButtonClick = function(e) {
  const configButton = e.target;
  configButton.setAttribute('disabled', true);

  // whenever user configures, remove all traces and apps, useful for when reconfiguring
  chrome.storage.local.remove([
    STORED_APPS_KEY,
    STORED_TRACES_KEY,
  ], () => {
    if (chrome.runtime.lastError) {
      throw new Error("Error removing stored apps and stored traces");
    }
  });

  // credentials are set by sending a message to content-script
  chrome.tabs.sendMessage(this.tab.id, { url: this.tab.url, action: CONTRAST_INITIALIZE }, (response) => {
    const failureMessage = document.getElementById('config-failure');
    if (!response || !response.action) {
      changeElementVisibility(failureMessage);
      setElementDisplay(configButton, "none");
      hideElementAfterTimeout(failureMessage, () => {
        configButton.removeAttribute('disabled');
        setElementDisplay(configButton, "block");
      });
      return;
    }
    // NOTE: In development if the extension is reloaded and the web page is not response will be undefined and throw an error. The solution is to reload the webpage.
    if (response.action === CONTRAST_INITIALIZED) {
      chrome.browserAction.setBadgeText({ tabId: this.tab.id, text: '' });
      // recurse on indexFunction, credentials should have been set in content-script so this part of indexFunction will not be evaluated again
      const successMessage = document.getElementById('config-success');
      const configFooterText = document.getElementById('config-footer-text');
      changeElementVisibility(successMessage);
      setElementDisplay(configButton, "none");
      configFooterText.innerText = "";
      configFooterText.innerHTML = loadingIconHTML();
      this._updateCredentials(response.contrastObj);
      hideElementAfterTimeout(successMessage, () => {
        configButton.removeAttribute('disabled');
        setElementDisplay(configButton, "block");
        configFooterText.innerHTML = "";
        configButton.removeEventListener('click', this._handleConfigButtonClick);

        indexFunction();
      });
      this.setCredentialsInSettings();

      const section = document.getElementById('configuration-section');
      section.display = 'none';
      hideElementAfterTimeout(section);
    } else {
      changeElementVisibility(failureMessage);
      setElementDisplay(configButton, "none");
      hideElementAfterTimeout(failureMessage, () => {
        configButton.removeAttribute('disabled');
        setElementDisplay(configButton, "block");
      });
    }
    return;
  })
}

Config.prototype._updateCredentials = function(credentialsObj) {
  this.credentials = credentialsObj;
  this.credentialed = true;
}

/**
 * _isTeamserverAccountPage - checks if we're on the teamserver Your Account page
 *
 * @param  {Object} tab the current tab
 * @param  {URL<Object>} url url object of the current tab
 * @return {Boolean} if it is the teamserver page
 */
Config.prototype._isTeamserverAccountPage = function() {
  if (!this.tab || !this.url) throw new Error("_isTeamserverAccountPage expects tab or url");

  const conditions = [
    this.tab.url.startsWith("http"),
    VALID_TEAMSERVER_HOSTNAMES.includes(this.url.hostname),
    this.tab.url.endsWith(TEAMSERVER_ACCOUNT_PATH_SUFFIX) || this.tab.url.endsWith(TEAMSERVER_PROFILE_PATH_SUFFIX),
    this.tab.url.indexOf(TEAMSERVER_INDEX_PATH_SUFFIX) !== -1
  ];
  return conditions.every(c => !!c);
}

Config.prototype._isContrastPage = function() {
  if (!this.tab || !this.url) throw new Error("_isTeamserverAccountPage expects tab or url");
  console.log("is contrast page url", this.tab.url);
  const conditions = [
    this.tab.url.startsWith("http"),
    VALID_TEAMSERVER_HOSTNAMES.includes(this.url.hostname),
    this.tab.url.includes('/Contrast/static/ng'),
  ];
  console.log("IS CONTRAST?", conditions.every(c => !!c));
  return conditions.every(c => !!c);
}

Config.prototype.renderContrastUsername = function(credentials) {
  const userEmail = document.getElementById('user-email');
  setElementText(userEmail, credentials[CONTRAST_USERNAME]);
  userEmail.addEventListener('click', () => {
    const contrastIndex = credentials.teamserver_url.indexOf("/api");
    const teamserverUrl = credentials.teamserver_url.substring(0, contrastIndex);
    chrome.tabs.create({ url: teamserverUrl });
  }, false);
}

Config.prototype.setGearIcon = function() {
  // configure button opens up settings page in new tab
  const configureGearIcon = document.getElementById('configure-gear');
  configureGearIcon.addEventListener('click', this._handleGearClick, false);

  const appIconContainer = document.getElementById('app-icon-container');
  appIconContainer.addEventListener('click', this._handleAppsClick, false);
}

Config.prototype._handleGearClick = function() {
  const configureGearContainer = document.getElementById('gear-container');

  configureGearContainer.classList.add('configure-gear-rotate');
  setTimeout(() => {
    configureGearContainer.classList.remove('configure-gear-rotate');
  }, 1000);
  console.log("POPUP_STATE before", POPUP_STATE);
  if (POPUP_STATE[0] == null || (POPUP_STATE[0] !== 0 && POPUP_STATE.length === 1)) {
    POPUP_STATE.push(this.getPopupScreen());
    this.popupScreen(0);
  } else {
    this.popupScreen(POPUP_STATE.pop());
  }
  console.log("POPUP_STATE after", POPUP_STATE);
}

Config.prototype._handleAppsClick = function() {
  const appIconContainer = document.getElementById('app-icon-container');

  console.log("POPUP_STATE before", POPUP_STATE);
  const previousState = POPUP_STATE[POPUP_STATE.length - 1];
  if (POPUP_STATE[0] == null || (POPUP_STATE[0] !== 3 && POPUP_STATE.length === 1)) {
    POPUP_STATE.push(this.getPopupScreen());
    this.popupScreen(3);
  } else {
    this.popupScreen(POPUP_STATE.pop());
  }
  console.log("POPUP_STATE after", POPUP_STATE);
}


function loadingIconHTML() {
  return `<img style="float: right; padding-bottom: 20px; width: 50px;" id="config-loading-icon" class="loading-icon" src="/img/ring-alt.gif" alt="loading">`;
}
