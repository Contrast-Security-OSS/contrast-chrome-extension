/*global
  chrome,
  document,
  URL,
*/
import {
  VALID_TEAMSERVER_HOSTNAMES,
  TEAMSERVER_ACCOUNT_PATH_SUFFIX,
  TEAMSERVER_INDEX_PATH_SUFFIX,
  TEAMSERVER_PROFILE_PATH_SUFFIX,
  CONTRAST_USERNAME,
  getStoredCredentials,
  isCredentialed,
  isBlacklisted,
  CONTRAST_RED,
  CONTRAST_GREEN,
  STORED_APPS_KEY,
  STORED_TRACES_KEY,
  getApplications,
  getHostFromUrl,
  isContrastTeamserver,
  setElementText,
  setElementDisplay,
  getStoredApp,
} from './util.js'

import ApplicationTable from './models/ApplicationTable.js'
import TableRow from './models/PopupTableRow.js'
import ConnectedDomain from './models/ConnectedDomain.js'

const CONNECT_BUTTON_TEXT     = "Click to Connect";
const CONNECT_SUCCESS_MESSAGE = "Successfully connected. You may need to reload the page.";
const CONNECT_FAILURE_MESSAGE = "Error connecting. Try reloading the page.";
const DISCONNECT_SUCCESS_MESSAGE = "Successfully Disconnected";
const DISCONNECT_FAILURE_MESSAGE = "Error Disconnecting";
const DISCONNECT_BUTTON_TEXT     = "Disconnect";

const CONTRAST_BUTTON_CLASS = "btn btn-primary btn-xs btn-contrast-plugin";

/**
 * indexFunction - Main function that's run, renders config button if user is on TS Your Account Page, otherwise renders vulnerability feed
 *
 * @return {void}
 */
function indexFunction() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

    const tab = tabs[0];
    const url = new URL(tab.url);

    getStoredCredentials()
    .then(items => {
      const credentialed = isCredentialed(items);
      if (!credentialed) {
        getUserConfiguration(tab, url, credentialed);
      } else if (credentialed && _isTeamserverAccountPage(tab, url)) {
        getUserConfiguration(tab, url, credentialed);
        // renderApplicationsMenu(url);
        const table = new ApplicationTable(url);
        table.renderApplicationsMenu();
        _renderContrastUsername(items);
      } else {
        const table = new ApplicationTable(url);
        table.renderActivityFeed();
        _renderContrastUsername(items);
      }

      //configure button opens up settings page in new tab
      const configureGearIcon = document.getElementById('configure-gear');
      configureGearIcon.addEventListener('click', () => {
        chrome.tabs.create({ url: _chromeExtensionSettingsUrl() })
      }, false);
    })
    .catch(error => new Error(error));
  });
}


/**
 * getUserConfiguration - renders the elements/dialog for a user configuring the connection from the extension to teamserver
 *
 * @param  {Object} tab the current tab
 * @param  {URL<Object>} url a url object of the current tab
 * @return {void}
 */
function getUserConfiguration(tab, url, credentialed) {
  if (_isTeamserverAccountPage(tab, url)) {
    const configButton = document.getElementById('configure-extension-button');
    setElementText(configButton, credentialed ? "Reconfigure" : "Configure");

    const configExtension = document.getElementById('configure-extension');
    setElementDisplay(configExtension, "block");

    const configExtensionHost = document.getElementById('configure-extension-host');
    setElementText(configExtensionHost, `Make sure you trust this site: ${url.hostname}`);

    renderConfigButton(tab, configButton);
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
function renderConfigButton(tab, configButton) {
  if (!configButton) {
    configButton = document.getElementById('configure-extension-button');
  }

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
    chrome.tabs.sendMessage(tab.id, { url: tab.url, action: "INITIALIZE" }, (response) => {
      // NOTE: In development if the extension is reloaded and the web page is not response will be undefined and throw an error. The solution is to reload the webpage.

      if (response === "INITIALIZED") {
        chrome.browserAction.setBadgeText({ tabId: tab.id, text: '' });

        // recurse on indexFunction, credentials should have been set in content-script so this part of indexFunction will not be evaluated again
        const successMessage = document.getElementById('config-success');
        successMessage.classList.add("visible");
        successMessage.classList.remove("hidden");
        _hideElementAfterTimeout(successMessage, () => {
          configButton.removeAttribute('disabled');
        });
      } else {
        const failureMessage = document.getElementById('config-failure');
        failureMessage.classList.add("visible");
        failureMessage.classList.remove("hidden");
        _hideElementAfterTimeout(failureMessage, () => {
          configButton.removeAttribute('disabled');
        });
      }
      return;
    })
  }, false);
}

// --------- HELPER FUNCTIONS -------------
function _chromeExtensionSettingsUrl() {
  const extensionId = chrome.runtime.id;
  return `chrome-extension://${String(extensionId)}/settings.html`;
}

/**
 * renderContrastUsername - renders the email address of the contrast user
 *
 * @param  {Object} items contrast creds
 * @return {void}
 */
function _renderContrastUsername(items) {
  const userEmail = document.getElementById('user-email');
  setElementText(userEmail, `User: ${items[CONTRAST_USERNAME]}`);
  setElementDisplay(userEmail, "block");
  userEmail.addEventListener('click', () => {
    const contrastIndex = items.teamserver_url.indexOf("/Contrast/api");
    const teamserverUrl = items.teamserver_url.substring(0, contrastIndex);
    chrome.tabs.create({ url: teamserverUrl });
  }, false);
}

/**
 * _hideElementAfterTimeout - leave a success/failure message on the screen for 2 seconds by toggling a class
 *
 * @param  {Node} element HTML Element to show for 2 seconds
 * @return {void}
 */
function _hideElementAfterTimeout(element, callback) {
  setTimeout(() => { // eslint-disable-line consistent-return
    element.classList.add("hidden");
    element.classList.remove("visible");
    if (callback) {
      return callback();
    }
  }, 2000); // let the element linger
}

/**
 * _isTeamserverAccountPage - checks if we're on the teamserver Your Account page
 *
 * @param  {Object} tab the current tab
 * @param  {URL<Object>} url url object of the current tab
 * @return {Boolean} if it is the teamserver page
 */
function _isTeamserverAccountPage(tab, url) {
  if (!tab || !url) throw new Error("_isTeamserverAccountPage expects tab or url");

  const conditions = [
    tab.url.startsWith("http"),
    VALID_TEAMSERVER_HOSTNAMES.includes(url.hostname),
    tab.url.endsWith(TEAMSERVER_ACCOUNT_PATH_SUFFIX) || tab.url.endsWith(TEAMSERVER_PROFILE_PATH_SUFFIX),
    tab.url.indexOf(TEAMSERVER_INDEX_PATH_SUFFIX) !== -1
  ];
  return conditions.every(c => !!c);
}

/**
 * Run when popup loads
 */
document.addEventListener('DOMContentLoaded', indexFunction, false);
