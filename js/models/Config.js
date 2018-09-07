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

export default function Config(tab, url, credentialed, credentials) {
  this.tab = tab;
  this.url = url;
  this.credentialed = credentialed;
  this.credentials = credentials;
}

const POPUP_STATES = {
  notContrastNotConfigured: 0,
  contrastNotConfigured: 1,
  contrastYourAccountNotConfigured: 2,
  contrastYourAccountConfigured: 3,
  contrastConfigured: 4,
  notContrastConfigured: 5,
}

Config.prototype.popupState = function() {
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
}

/**
 * getUserConfiguration - renders the elements/dialog for a user configuring the connection from the extension to teamserver
 *
 * @param  {Object} tab the current tab
 * @param  {URL<Object>} url a url object of the current tab
 * @return {void}
 */
Config.prototype.getUserConfiguration = function() {
  console.log("get user configuration");
  console.log("This popupstate is ", this.popupState());
  const userEmail = document.getElementById('user-email');
  const configSection = document.getElementById('configuration-section');
  const configHeader = document.getElementById('configuration-header');
  const configHeaderText = document.getElementById('config-header-text');
  const configFooter = document.getElementById('configuration-footer');
  const configFooterText = document.getElementById('config-footer-text');
  const configuredFooter = document.getElementById('configured-footer');
  const configContainer = document.getElementById('configure-extension');
  const vulnsSection = document.getElementById('vulnerabilities-section');
  const vulnsHeader = document.getElementById('vulnerabilities-header');
  const vulnsHeaderText = document.getElementById('vulns-header-text');
  const scanLibsText = document.getElementById('scan-libs-text');
  const appTableContainer = document.getElementById('application-table-container-div');
  const configButton = document.getElementById('configure-extension-button');
  const configGear = document.getElementById('configure-gear');

  const popupState = this.popupState();
  console.log("This popupstate is ", popupState);
  switch (popupState) {
    case 0: {
      console.log("case 0, notContrastNotConfigured");
      setElementDisplay(vulnsSection, "none");
      setElementDisplay(vulnsHeader, "none");
      setElementDisplay(configuredFooter, "none");
      setElementDisplay(configFooter, "block");
      setElementDisplay(configContainer, "none");
      setElementDisplay(appTableContainer, "none");
      setElementDisplay(configHeader, "flex");
      setElementText(configHeaderText, "Set Up Configuration");
      setElementDisplay(configButton, "none");
      setElementDisplay(configGear, "none");
      break;
    }
    case 1: {
      console.log("case 1 contrastNotConfigured");
      setElementDisplay(vulnsSection, "none");
      setElementDisplay(vulnsHeader, "none");
      setElementDisplay(configFooter, "block");
      setElementDisplay(configuredFooter, "none");
      setElementDisplay(configContainer, "block");
      setElementDisplay(appTableContainer, "none");
      setElementDisplay(configHeader, "flex");
      setElementDisplay(configButton, "none");
      setElementText(configHeaderText, "Connection Settings");
      setElementText(configFooterText, "Log into Contrast and go to Your Account so we can grab your keys.");
      setElementDisplay(configGear, "block");
      break;
    }
    case 2: {
      console.log("case 2 contrastYourAccountNotConfigured");
      setElementDisplay(vulnsSection, "none");
      setElementDisplay(vulnsHeader, "none");
      setElementDisplay(configFooter, "block");
      setElementDisplay(configuredFooter, "none");
      setElementDisplay(configContainer, "block");
      setElementDisplay(appTableContainer, "none");
      setElementDisplay(configHeader, "flex");
      setElementDisplay(configButton, "block");
      setElementText(configHeaderText, "Connection Settings");
      setElementText(configFooterText, "Click the Connect button to get started.")
      setElementDisplay(configGear, "block");
      this._renderConfigButton(configButton);
      configContainer.classList.toggle('collapsed');
      break;
    }
    case 3: {
      console.log("case 3 contrastYourAccountConfigured");
      setElementDisplay(vulnsSection, "none");
      setElementDisplay(vulnsHeader, "flex");
      vulnsHeader.classList.remove('flex-row-space-between');
      vulnsHeader.classList.add('flex-row-head');
      setElementDisplay(configFooter, "none");
      setElementDisplay(configuredFooter, "flex");
      setElementDisplay(configContainer, "block");
      setElementDisplay(configHeader, "none");
      setElementDisplay(configButton, "block");
      setElementDisplay(userEmail, "block");
      setElementDisplay(scanLibsText, "none");
      setElementText(vulnsHeaderText, "Configured");
      setElementDisplay(configGear, "block");
      this.setCredentialsInSettings();
      this._renderConfigButton(configButton);
      configContainer.classList.toggle('collapsed');
      break;
    }
    case 4: {
      console.log("case 4 contrastConfigured");
      setElementDisplay(vulnsSection, "none");
      setElementDisplay(vulnsHeader, "flex");
      vulnsHeader.classList.remove('flex-row-space-between');
      vulnsHeader.classList.add('flex-row-head');
      setElementDisplay(configuredFooter, "flex");
      setElementDisplay(configFooter, "none");
      setElementDisplay(configContainer, "block");
      setElementDisplay(configHeader, "none");
      setElementDisplay(configButton, "none");
      setElementDisplay(userEmail, "block");
      setElementDisplay(scanLibsText, "none");
      setElementDisplay(configGear, "block");
      setElementText(vulnsHeaderText, "Configured");
      this.setCredentialsInSettings();
      configSection.classList.add('collapsed');
      break;
    }
    case 5: {
      console.log("case 5 notContrastConfigured");
      setElementDisplay(vulnsSection, "flex");
      setElementDisplay(vulnsHeader, "flex");
      vulnsHeader.classList.add('flex-row-space-between');
      vulnsHeader.classList.remove('flex-row-head');
      setElementDisplay(configFooter, "none");
      setElementDisplay(configuredFooter, "flex");
      setElementDisplay(configContainer, "none");
      setElementDisplay(configHeader, "none");
      setElementDisplay(configButton, "none");
      setElementDisplay(userEmail, "block");
      setElementDisplay(configGear, "none");
      break;
    }
    default: {
      console.log("Default Case");
      break;
    }
  }
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
  configButton.addEventListener('click', () => {
    console.log("clicked");
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
      }
      // NOTE: In development if the extension is reloaded and the web page is not response will be undefined and throw an error. The solution is to reload the webpage.
      if (response.action === CONTRAST_INITIALIZED) {
        chrome.browserAction.setBadgeText({ tabId: this.tab.id, text: '' });

        // recurse on indexFunction, credentials should have been set in content-script so this part of indexFunction will not be evaluated again
        const successMessage = document.getElementById('config-success');
        changeElementVisibility(successMessage);
        setElementDisplay(configButton, "none");
        hideElementAfterTimeout(successMessage, () => {
          configButton.removeAttribute('disabled');
          setElementDisplay(configButton, "block");
        });

        this.setCredentialsInSettings(response.contrastObj)

        const section = document.getElementById('configuration-section');
        section.display = 'none';
        // hideElementAfterTimeout(section);
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
  }, false);
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
    this.tab.url.includes('Contrast'),
  ];
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
  const configureGearIcon = document.getElementsByClassName('configure-gear')[0];
  const configContainer = document.getElementById('configuration-section');
  configureGearIcon.addEventListener('click', () => {
    configureGearIcon.classList.add('configure-gear-rotate');
    setTimeout(() => {
      configureGearIcon.classList.remove('configure-gear-rotate');
    }, 1000)
    configContainer.classList.toggle('collapsed');
  }, false);
}

Config.prototype._chromeExtensionSettingsUrl = function() {
  const extensionId = chrome.runtime.id;
  return `chrome-extension://${String(extensionId)}/settings.html`;
}
