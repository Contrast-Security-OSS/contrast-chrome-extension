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
  CONTRAST_ORG_UUID,
  TEAMSERVER_URL,
  CONTRAST_SERVICE_KEY,
  CONTRAST_API_KEY,
  CONTRAST_USERNAME,
  UUID_V4_REGEX
} from "../util.js";

// import ApplicationTable from './ApplicationTable.js';
import { indexFunction } from "../index.js";
import ContrastCredentials from "./contrastCredentials.js";

export default function Config(tab, url, credentialed, credentials, hasApp) {
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

const CREDENTIALED_CONFIG_SCREEN = 0;
const CONFIG_SCREEN = 1;
const VULNS_SCREEN = 2;
const APPS_SCREEN = 3;

let SCREEN_STATE;
let POPUP_STATE = new Set();
const POPUP_SCREENS = {
  0: [
    // Credentialed Config
    document.getElementById("configuration-section"),
    document.getElementById("vulnerabilities-header"),
    document.getElementById("configured-footer")
  ],
  1: [
    // Not Credentialed Config
    document.getElementById("configuration-section"),
    document.getElementById("configuration-header"),
    document.getElementById("configuration-footer")
  ],
  2: [
    // Vulns
    document.getElementById("vulnerabilities-section"),
    document.getElementById("vulnerabilities-header"),
    document.getElementById("configured-footer")
  ],
  3: [
    // Apps
    document.getElementById("application-table-container-section"),
    document.getElementById("vulnerabilities-header"),
    document.getElementById("configured-footer")
  ]
};
Config.prototype.popupScreen = function(state = null) {
  if (typeof state !== "number") {
    state = this.getPopupScreen();
  }
  // console.log("DOCUMENT", document.getElementById("configuration-section"));
  for (let key in POPUP_SCREENS) {
    if (Object.prototype.hasOwnProperty.call(POPUP_SCREENS, key)) {
      if (parseInt(key, 10) !== state) {
        POPUP_SCREENS[key].forEach(el => {
          if (el) setElementDisplay(el, "none");
        });
      }
    }
  }

  // NOTE: Set these last
  for (let key in POPUP_SCREENS) {
    if (Object.prototype.hasOwnProperty.call(POPUP_SCREENS, key)) {
      if (parseInt(key, 10) === state) {
        POPUP_SCREENS[key].forEach(el => {
          if (el) setElementDisplay(el, "flex");
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

Config.prototype.getPopupScreen = function() {
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

Config.prototype.setCredentialsInSettings = function() {
  const urlInput = document.getElementById("contrast-url-input");
  const serviceKeyInput = document.getElementById("contrast-service-key-input");
  const userNameInput = document.getElementById("contrast-username-input");
  const apiKeyInput = document.getElementById("contrast-api-key-input");
  const orgUuidInput = document.getElementById("contrast-org-uuid-input");

  const teamServerUrl = this.credentials[TEAMSERVER_URL];
  const serviceKey = this.credentials[CONTRAST_SERVICE_KEY];
  const apiKey = this.credentials[CONTRAST_API_KEY];
  const profileEmail = this.credentials[CONTRAST_USERNAME];
  const orgUuid = this.credentials[CONTRAST_ORG_UUID];

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
Config.prototype.addListenerToConfigButton = function() {
  const configButton = document.getElementById("configure-extension-button");
  configButton.addEventListener("click", this._handleConfigButtonClick, false);
};

Config.prototype._handleConfigButtonClick = function(e) {
  const configButton = e.target;
  configButton.setAttribute("disabled", true);

  // whenever user configures, remove all traces and apps, useful for when reconfiguring
  chrome.storage.local.remove([STORED_APPS_KEY, STORED_TRACES_KEY], () => {
    if (chrome.runtime.lastError) {
      throw new Error("Error removing stored apps and stored traces");
    }
  });

  // NOTE: Don't scrape if user has input data
  const inputs = document.getElementsByClassName("user-inputs");
  let inputsWithValue = [];
  for (let i = 0, len = inputs.length; i < len; i++) {
    if (inputs[i].innerText && inputs[i].innerText.length > 0) {
      inputsWithValue.push(true);
    }
    inputsWithValue.push(false);
  }

  if (
    this._isTeamserverAccountPage() &&
    inputsWithValue.every(i => i === false)
  ) {
    this._configureUserByScrapingContrast();
  } else {
    this._storeCustomUserConfiguration();
  }
};

Config.prototype._storeCustomUserConfiguration = function() {
  const serviceKeyInput = document.getElementById("contrast-service-key-input");
  const userNameInput = document.getElementById("contrast-username-input");
  const apiKeyInput = document.getElementById("contrast-api-key-input");

  const orgUuidInput = document.getElementById("contrast-org-uuid-input");
  let orgUuid;
  if (this._isContrastPage()) {
    orgUuid = this._getOrgUUIDFromURL();
    orgUuidInput.value = orgUuid;
  } else {
    orgUuid = orgUuidInput.value;
  }

  const urlInput = document.getElementById("contrast-url-input");
  let teamServerUrl;
  if (this._isContrastPage()) {
    teamServerUrl = this._getContrastURL();
    urlInput.value = teamServerUrl;
  } else {
    teamServerUrl = urlInput.value;
    if (teamServerUrl.split("http://")[1]) {
      teamServerUrl = teamServerUrl.split("http://")[1]; // split on http(s) and take the domain
    }
    if (teamServerUrl.split("https://")[1]) {
      teamServerUrl = teamServerUrl.split("https://")[1]; // split on http(s) and take the domain
    }
    teamServerUrl = teamServerUrl.split("/")[0]; // split on / and take base url user has input
    teamServerUrl += "/Contrast/api";
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
    return this._renderFailureMessage(e);
  }

  const contrastObj = new ContrastCredentials({
    apiKey: apiKeyInput.value,
    orgUuid,
    teamServerUrl,
    serviceKey: serviceKeyInput.value,
    profileEmail: userNameInput.value
  });
  try {
    this._storeContrastCredentials(contrastObj);
    return true;
  } catch (e) {
    this._renderFailureMessage(e);
    return false;
  }
};

Config.prototype._getContrastURL = function(urlInput) {
  if (urlInput && urlInput.value && urlInput.value.length > 0) {
    return urlInput.value;
  } else if (this._isContrastPage()) {
    const url = new URL(this.url);
    let origin = url.origin;
    // if (url.hostname === 'localhost') {
    //   origin = origin.replace('19090', '19080');
    // }
    return origin + "/Contrast/api";
  }
  return "";
};

Config.prototype._renderFailureMessage = function(error) {
  const configButton = document.getElementById("configure-extension-button");
  const failure = document.getElementById("config-failure");
  const failureMessage = document.getElementById("config-failure-message");
  if (error) setElementText(failureMessage, error.toString());
  changeElementVisibility(failure);
  setElementDisplay(configButton, "none");
  hideElementAfterTimeout(failure, () => {
    configButton.removeAttribute("disabled");
    setElementDisplay(configButton, "block");
  });
};

Config.prototype._renderSuccessMessage = function(
  contrastObj,
  callback = () => null
) {
  // recurse on indexFunction, credentials should have been set in content-script so this part of indexFunction will not be evaluated again
  const configButton = document.getElementById("configure-extension-button");
  const successMessage = document.getElementById("config-success");
  const configFooterText = document.getElementById("config-footer-text");
  changeElementVisibility(successMessage);
  setElementDisplay(configButton, "none");
  configFooterText.innerText = "";
  configFooterText.innerHTML = loadingIconHTML();
  this._updateCredentials(contrastObj);
  hideElementAfterTimeout(successMessage, () => {
    configButton.removeAttribute("disabled");
    setElementDisplay(configButton, "block");
    configFooterText.innerHTML = "";
    configButton.removeEventListener("click", this._handleConfigButtonClick);

    return callback();
  });
};

Config.prototype._storeContrastCredentials = function(contrastObj) {
  chrome.storage.local.set(contrastObj, () => {
    if (chrome.runtime.lastError) {
      throw new Error("Error setting configuration");
    } else {
      this._renderSuccessMessage(contrastObj, indexFunction);
    }
  });
};

Config.prototype._getOrgUUIDFromURL = function() {
  const url = new URL(this.url);
  const hash = url.hash;
  const orgUUID = hash.split("/")[1];
  if (UUID_V4_REGEX.test(orgUUID)) {
    return orgUUID;
  }
  return null;
};

Config.prototype._configureUserByScrapingContrast = function() {
  // credentials are set by sending a message to content-script
  chrome.tabs.sendMessage(
    this.tab.id,
    { url: this.tab.url, action: CONTRAST_INITIALIZE },
    response => {
      if (!response || !response.action) {
        this._renderFailureMessage();
        return;
      }
      // NOTE: In development if the extension is reloaded and the web page is not response will be undefined and throw an error. The solution is to reload the webpage.
      if (response.action === CONTRAST_INITIALIZED) {
        if (response.success) {
          chrome.browserAction.setBadgeText({ tabId: this.tab.id, text: "" });
          this._renderSuccessMessage(response.contrastObj, indexFunction);
          this.setCredentialsInSettings();

          const section = document.getElementById("configuration-section");
          section.display = "none";
          hideElementAfterTimeout(section);
        } else {
          this._renderFailureMessage(response.message);
        }
      } else {
        this._renderFailureMessage();
      }
      return;
    }
  );
};

Config.prototype._updateCredentials = function(credentialsObj) {
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
Config.prototype._isTeamserverAccountPage = function() {
  if (!this.tab || !this.url) {
    throw new Error("_isTeamserverAccountPage expects tab or url");
  }

  const conditions = [
    this.tab.url.startsWith("http"),
    VALID_TEAMSERVER_HOSTNAMES.includes(this.url.hostname),
    this.tab.url.endsWith(TEAMSERVER_ACCOUNT_PATH_SUFFIX) ||
      this.tab.url.endsWith(TEAMSERVER_PROFILE_PATH_SUFFIX),
    this.tab.url.indexOf(TEAMSERVER_INDEX_PATH_SUFFIX) !== -1
  ];
  return conditions.every(c => !!c);
};

Config.prototype._isContrastPage = function() {
  if (!this.tab || !this.url) {
    throw new Error("_isTeamserverAccountPage expects tab or url");
  }
  const conditions = [
    this.tab.url.startsWith("http"),
    VALID_TEAMSERVER_HOSTNAMES.includes(this.url.hostname),
    this.tab.url.includes("/Contrast/static/ng")
  ];
  return conditions.every(c => !!c);
};

Config.prototype.renderContrastUsername = function(credentials) {
  const userEmail = document.getElementById("user-email");
  setElementText(userEmail, credentials[CONTRAST_USERNAME]);
  userEmail.addEventListener(
    "click",
    () => {
      const contrastIndex = credentials.teamserver_url.indexOf("/api");
      const teamserverUrl = credentials.teamserver_url.substring(
        0,
        contrastIndex
      );
      chrome.tabs.create({ url: teamserverUrl });
    },
    false
  );
};

Config.prototype.setGearIcon = function() {
  // configure button opens up settings page in new tab
  const configureGearIcon = document.getElementById("configure-gear");
  configureGearIcon.addEventListener("click", this._handleGearClick, false);

  const appIconContainer = document.getElementById("app-icon-container");
  appIconContainer.addEventListener("click", this._handleAppsClick, false);
};

Config.prototype._handleGearClick = function() {
  const configureGearContainer = document.getElementById("gear-container");

  configureGearContainer.classList.add("configure-gear-rotate");
  setTimeout(() => {
    configureGearContainer.classList.remove("configure-gear-rotate");
  }, 1000);

  if (SCREEN_STATE !== CREDENTIALED_CONFIG_SCREEN) {
    this.popupScreen(CREDENTIALED_CONFIG_SCREEN);
  } else if (
    SCREEN_STATE === CREDENTIALED_CONFIG_SCREEN &&
    POPUP_STATE.has(VULNS_SCREEN)
  ) {
    this.popupScreen(VULNS_SCREEN);
  } else {
    this.popupScreen(CREDENTIALED_CONFIG_SCREEN);
  }
};

Config.prototype._handleAppsClick = function() {
  if (SCREEN_STATE !== APPS_SCREEN) {
    this.popupScreen(APPS_SCREEN);
  } else if (SCREEN_STATE === APPS_SCREEN && POPUP_STATE.has(VULNS_SCREEN)) {
    this.popupScreen(VULNS_SCREEN);
  } else {
    this.popupScreen(APPS_SCREEN);
  }
};

function loadingIconHTML() {
  return `<img style="float: right; padding-bottom: 20px; width: 50px;" id="config-loading-icon" class="loading-icon" src="/img/ring-alt.gif" alt="loading">`;
}
