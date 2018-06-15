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
 * renderApplicationsMenu - renders a toggle for showing/hiding the table/menu listing all the applications in an organization
 *
 * @param  {URL<Object>} url a url object of the current tab
 * @return {void}
 */
function renderApplicationsMenu(url) {
  const applicationsHeading = document.getElementById('applications-heading');
  const applicationsArrow   = document.getElementById('applications-arrow');
  const applicationTable    = document.getElementById('application-table');

  const applicationsHeadingContainer = document.getElementById('applications-heading-container');
  setElementDisplay(applicationsHeadingContainer, "block");

  applicationsHeading.addEventListener('click', () => {
    unrollApplications(applicationsArrow, applicationTable, url);
  });
  applicationsArrow.addEventListener('click', () => {
    unrollApplications(applicationsArrow, applicationTable, url);
  });
}

function unrollApplications(applicationsArrow, applicationTable, url) {
  if (applicationsArrow.innerText === ' ▶') {
    setElementText(applicationsArrow, ' ▼');

    applicationTable.classList.add('application-table-visible');
    applicationTable.classList.remove('application-table-hidden');

    // if less than 2 then only the heading row has been rendered
    if (document.getElementsByTagName('tr').length < 2) {
      getApplications()
      .then(json => {
        if (!json) {
          throw new Error("Error getting applications");
        }
        json.applications.forEach(app => createAppTableRow(app, url));
      })
      .catch(error => new Error(error));
    }
  } else {
    applicationTable.classList.add('application-table-hidden');
    applicationTable.classList.remove('application-table-visible');

    setElementText(applicationsArrow, ' ▶');
  }
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

/**
 * renderActivityFeed - logic to render either the vulnerabilities in an app or the list of applications to connect to a domain. A user must connect a domain before the vulnerabilities section will be shown
 *
 * @param  {Object} items - teamserver credentials
 * @param  {URL<Object>} url - URL object of current tab
 * @return {type}
 */
function renderActivityFeed(items, url) {
  if (isBlacklisted(url.host)) return;

  chrome.storage.local.get(STORED_APPS_KEY, (result) => {
    const host = getHostFromUrl(url);
    // look in stored apps array for app tied to host, if we are a site/domain tied to an app in contrast, render the vulnerabilities for that app
    if (result[STORED_APPS_KEY] && result[STORED_APPS_KEY].filter(app => app[host])[0]) {
      // find sections
      const notConfiguredSection = document.getElementById('not-configured');
      const configureExtension   = document.getElementById('configure-extension');

      // if you don't need credentials, hide the signin functionality
      setElementDisplay(configureExtension, "none");
      setElementDisplay(notConfiguredSection, "none");
    } else {
      const applicationTable = document.getElementById("application-table");

      // transitions on these classes, not a simple display none/table
      applicationTable.classList.add('application-table-visible');
      applicationTable.classList.remove('application-table-hidden');

      const vulnsFound = document.getElementById("vulnerabilities-found-on-page")
      setElementDisplay(vulnsFound, "none");

      // if app is not stored, render the table with buttons to add the domain
      getApplications()
      .then(json => {
        if (!json) {
          throw new Error("Error getting applications");
        }

        let applications = json.applications;

        // if there are apps in storage and we aren't on a contrast page, filter apps so that we only show ones that have NOT been connected to a domain
        if (!!result[STORED_APPS_KEY] && !isContrastTeamserver(url.href)) {

          const appIds = result[STORED_APPS_KEY].map(Object.values).flatten();
          applications = applications.filter(app => {

            // include in applications if it's not in storage
            return !appIds.includes(app.app_id);
          });
        }

        // create a row for each application
        applications.forEach(app => createAppTableRow(app, url));
      })
      .catch(error => {
        throw new Error("Error getting applications");
      });
    }
  });
}


/**
 * createAppTableRow - renders a table row, either with a button if it's not a contrast url, or with a domain (or blank) if it's a contrast url showing in tab
 *
 * @param  {Object} application the contrast application
 * @param  {Object} url         the URL() of the current tab
 * @return {void} - adds rows to a table
 */
function createAppTableRow(application, url) {
  const tableBody = document.getElementById('application-table-body');
  const tr = new TableRow(application, url, tableBody);
  tr.appendChildren();
  tr.setAppId(application);

  // if the url is not a contrast url then show a collection of app name buttons that will let a user connect an app to a domain
  if (!isContrastTeamserver(url.href)) {
    tr.setHost(getHostFromUrl(url));
    tr.createConnectButton();
  } else {
    // on a contrast page - render the full collection of apps in a user org with respective domains
    chrome.storage.local.get(STORED_APPS_KEY, (storedApps) => {
      if (chrome.runtime.lastError) return;

      // storedApps has not been defined yet
      if (!storedApps || !storedApps[STORED_APPS_KEY]) {
        storedApps = { [STORED_APPS_KEY]: [] }
      }
      const storedApp = getStoredApp(storedApps, application);

      setElementText(tr.nameTD, application.name);

      if (!!storedApp) {
        tr.setHost(Object.keys(storedApp)[0]);
        tr.renderDisconnect(storedApps, storedApp);
      }
    });
  }
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
