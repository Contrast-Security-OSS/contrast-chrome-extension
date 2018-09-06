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
  const notConfigured = document.getElementById('not-configured');
  const configFooter = document.getElementById('configuration-footer');
  const configContainer = document.getElementById('configure-extension');
  if (this._isTeamserverAccountPage()) {
    configContainer.classList.toggle('collapsed');
    setElementDisplay(notConfigured, "none");
    setElementDisplay(configFooter, "none");

    this._renderConfigButton(this.tab);
  } else {
    configContainer.classList.toggle('collapsed');
    setElementDisplay(notConfigured, "block");
  }
}

Config.prototype.changeConfigDisplay = function() {


}

Config.prototype.setCredentialsInSettings = function(credentials) {
  const urlInput = document.getElementById("contrast-url-input");
  const serviceKeyInput = document.getElementById("contrast-service-key-input");
  const userNameInput = document.getElementById("contrast-username-input");
  const apiKeyInput = document.getElementById("contrast-api-key-input");

  const teamServerUrl = credentials[TEAMSERVER_URL];
  const serviceKey = credentials[CONTRAST_SERVICE_KEY];
  const apiKey = credentials[CONTRAST_API_KEY];
  const profileEmail = credentials[CONTRAST_USERNAME];

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
Config.prototype._renderConfigButton = function() {
  const configButton = document.getElementById('configure-extension-button');

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
    chrome.tabs.sendMessage(this.tab.id, { url: this.tab.url, action: CONTRAST_INITIALIZE }, (response) => {
      // NOTE: In development if the extension is reloaded and the web page is not response will be undefined and throw an error. The solution is to reload the webpage.
      if (response.action === CONTRAST_INITIALIZED) {
        chrome.browserAction.setBadgeText({ tabId: this.tab.id, text: '' });

        // recurse on indexFunction, credentials should have been set in content-script so this part of indexFunction will not be evaluated again
        const successMessage = document.getElementById('config-success');
        changeElementVisibility(successMessage);
        hideElementAfterTimeout(successMessage, () => {
          configButton.removeAttribute('disabled');
        });

        this.setCredentialsInSettings(response.contrastObj)

        const section = document.getElementById('configuration-section');
        section.display = 'none';
        // hideElementAfterTimeout(section);
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
  setElementText(userEmail, credentials[CONTRAST_USERNAME]);
  setElementDisplay(userEmail, "block");
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
    configContainer.classList.toggle('collapsed');
  }, false);
}

Config.prototype._chromeExtensionSettingsUrl = function() {
  const extensionId = chrome.runtime.id;
  return `chrome-extension://${String(extensionId)}/settings.html`;
}
