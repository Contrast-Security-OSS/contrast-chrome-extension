/*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
import {
  CONTRAST_USERNAME,
  STORED_APPS_KEY,
  STORED_TRACES_KEY,
  VALID_TEAMSERVER_HOSTNAMES,
  TEAMSERVER_ACCOUNT_PATH_SUFFIX,
  TEAMSERVER_PROFILE_PATH_SUFFIX,
  TEAMSERVER_INDEX_PATH_SUFFIX,
  setElementText,
  setElementDisplay,
  changeElementVisibility,
  hideElementAfterTimeout,
} from '../util.js'

export default function Config(tab, url, credentialed) {
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
Config.prototype.getUserConfiguration = function() {
  if (this._isTeamserverAccountPage()) {
    const configExtension = document.getElementById('configure-extension');
    const configExtensionHost = document.getElementById('configure-extension-host');

    setElementDisplay(configExtension, "block");
    setElementText(configExtensionHost, `Make sure you trust this site: ${this.url.hostname}`);

    this._renderConfigButton(this.tab);
  } else {
    const notConfigured = document.getElementById('not-configured');
    setElementDisplay(notConfigured, "");
  }
}

/**
 * renderConfigButton - renders the button the user clicks to configure teamserver credentials
 *
 * @param  {Object} tab the current tab
 * @return {void}
 */
Config.prototype._renderConfigButton = function() {
  const configButton = document.getElementById('configure-extension-button');
  setElementText(configButton, this.credentialed ? "Reconfigure" : "Configure");

  configButton.addEventListener('click', () => {
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
    chrome.tabs.sendMessage(this.tab.id, { url: this.tab.url, action: "INITIALIZE" }, (response) => {
      // NOTE: In development if the extension is reloaded and the web page is not response will be undefined and throw an error. The solution is to reload the webpage.

      if (response === "INITIALIZED") {
        chrome.browserAction.setBadgeText({ tabId: this.tab.id, text: '' });

        // recurse on indexFunction, credentials should have been set in content-script so this part of indexFunction will not be evaluated again
        const successMessage = document.getElementById('config-success');
        changeElementVisibility(successMessage);
        hideElementAfterTimeout(successMessage, () => {
          configButton.removeAttribute('disabled');
        });
      } else {
        const failureMessage = document.getElementById('config-failure');
        changeElementVisibility(failureMessage);
        hideElementAfterTimeout(failureMessage, () => {
          configButton.removeAttribute('disabled');
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

Config.prototype.renderContrastUsername = function(credentials) {
  const userEmail = document.getElementById('user-email');
  setElementText(userEmail, `User: ${credentials[CONTRAST_USERNAME]}`);
  setElementDisplay(userEmail, "block");
  userEmail.addEventListener('click', () => {
    const contrastIndex = credentials.teamserver_url.indexOf("/Contrast/api");
    const teamserverUrl = credentials.teamserver_url.substring(0, contrastIndex);
    chrome.tabs.create({ url: teamserverUrl });
  }, false);
}

Config.prototype.setGearIcon = function() {
  //configure button opens up settings page in new tab
  const configureGearIcon = document.getElementById('configure-gear');
  configureGearIcon.addEventListener('click', () => {
    chrome.tabs.create({ url: this._chromeExtensionSettingsUrl() })
  }, false);
}

Config.prototype._chromeExtensionSettingsUrl = function() {
  const extensionId = chrome.runtime.id;
  return `chrome-extension://${String(extensionId)}/settings.html`;
}
