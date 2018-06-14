/*global
  chrome,
  document,
  URL,
  Helpers,
*/
const {
  VALID_TEAMSERVER_HOSTNAMES,
  TEAMSERVER_ACCOUNT_PATH_SUFFIX,
  TEAMSERVER_INDEX_PATH_SUFFIX,
  TEAMSERVER_PROFILE_PATH_SUFFIX,
  CONTRAST_USERNAME,
  CONTRAST__STORED_APP_LIBS,
  CONTRAST_CONFIGURE_TEXT,
  CONTRAST_YELLOW,
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
  updateTabBadge,
} = Helpers;

const CONNECT_BUTTON_TEXT     = "Click to Connect Domain";
const CONNECT_SUCCESS_MESSAGE = "Successfully connected domain. You may need to reload the page.";
const CONNECT_FAILURE_MESSAGE = "Error Connecting Domain. Try refreshing the page.";
const DISCONNECT_SUCCESS_MESSAGE = "Successfully Disconnected Domain";
const DISCONNECT_FAILURE_MESSAGE = "Error Disconnecting Domain";
const DISCONNECT_BUTTON_TEXT     = "Disconnect Domain";

const CONTRAST_BUTTON_CLASS = "btn btn-primary btn-xs btn-contrast-plugin";

// import { Application } from './models/application';

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
        renderApplicationsMenu(url);
        _renderContrastUsername(items);
      } else {
        renderActivityFeed(items, url);
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
    updateTabBadge(tab, CONTRAST_CONFIGURE_TEXT, CONTRAST_YELLOW);
    const configButton = document.getElementById('configure-extension-button');
    setElementText(configButton, credentialed ? "Reconfigure" : "Configure");

    const configExtension = document.getElementById('configure-extension');
    setElementDisplay(configExtension, "block");

    const configExtensionHost = document.getElementById('configure-extension-host');
    setElementText(configExtensionHost, `Make sure you trust this site: ${url.hostname}`);

    renderConfigButton(tab, configButton);
  } else {
    updateTabBadge(tab, CONTRAST_CONFIGURE_TEXT, CONTRAST_YELLOW);
    const notConfigured = document.getElementById('not-configured');
    const notConfiguredLibs = document.getElementById('not-configured');
    setElementDisplay(notConfigured, "");
    setElementDisplay(notConfiguredLibs, "");
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
      const notConfiguredSectionLibs = document.getElementById('libs-not-configured');
      const configureExtension   = document.getElementById('configure-extension');

      // if you don't need credentials, hide the signin functionality
      setElementDisplay(configureExtension, "none");
      setElementDisplay(notConfiguredSection, "none");
      setElementDisplay(notConfiguredSectionLibs, "none");
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
  const tableBody    = document.getElementById('application-table-body');
  const row          = document.createElement('tr');
  const nameTD       = document.createElement('td');
  const appIdTD      = document.createElement('td');
  const domainTD     = document.createElement('td');
  const disconnectTD = document.createElement('td');

  setElementText(appIdTD, application.app_id);
  setElementDisplay(appIdTD, "none");

  tableBody.appendChild(row);
  row.appendChild(nameTD);
  row.appendChild(domainTD);
  row.appendChild(appIdTD);
  row.appendChild(disconnectTD);

  const host = getHostFromUrl(url);

  // if the url is not a contrast url then show a collection of app name buttons that will let a user connect an app to a domain
  if (!isContrastTeamserver(url.href)) {
    setElementText(domainTD, CONNECT_BUTTON_TEXT);

    const domainBtn = document.createElement('button');
    domainBtn.setAttribute('class', `${CONTRAST_BUTTON_CLASS} domainBtn`);

    setElementText(domainBtn, application.name.titleize());
    nameTD.appendChild(domainBtn);

    domainBtn.addEventListener('click', () => {
      const message = document.getElementById("connected-domain-message");
      message.classList.add("visible");
      message.classList.remove("hidden");

      _addDomainToStorage(host, application)
      .then(result => {
        if (result) {
          setElementText(message, CONNECT_SUCCESS_MESSAGE);
          message.setAttribute('style', `color: ${CONTRAST_GREEN}`);
        } else {
          setElementText(message, CONNECT_FAILURE_MESSAGE);
          message.setAttribute('style', `color: ${CONTRAST_RED}`);
        }
        _hideElementAfterTimeout(message, indexFunction);
      })
      .catch(() => {
        setElementText(message, CONNECT_FAILURE_MESSAGE);
        message.setAttribute('style', `color: ${CONTRAST_RED}`);
        _hideElementAfterTimeout(message);
      });
    });
  } else {
    // on a contrast page - render the full collection of apps in a user org with respective domains

    chrome.storage.local.get([
      STORED_APPS_KEY,
      CONTRAST__STORED_APP_LIBS
    ], (result) => {
      console.log("index.js chrome storage get result", result);

      if (chrome.runtime.lastError) return;

      // result has not been defined yet
      if (!result || !result[STORED_APPS_KEY]) {
        result = { [STORED_APPS_KEY]: [] }
      }
      const storedApp = result[STORED_APPS_KEY].filter(app => {
        return Object.values(app)[0] === application.app_id;
      })[0];

      if (!!storedApp) {
        let domain = Object.keys(storedApp)[0];
        if (domain.includes("_")) {
          domain = domain.split("_").join(":"); // local dev stuff
        }
        setElementText(domainTD, domain);

        const message = document.getElementById("connected-domain-message");
        const disconnectButton = document.createElement('button');
        disconnectButton.setAttribute('class', CONTRAST_BUTTON_CLASS);
        disconnectButton.addEventListener('click', () => {
          message.classList.add("visible");
          message.classList.remove("hidden");

          _disconnectDomain(result, application, disconnectButton)
          .then(disconnected => {
            if (disconnected) {
              setElementText(message, DISCONNECT_SUCCESS_MESSAGE);
              message.setAttribute('style', `color: ${CONTRAST_GREEN}`);
            } else {
              setElementText(message, DISCONNECT_FAILURE_MESSAGE);
              message.setAttribute('style', `color: ${CONTRAST_RED}`);
            }
            _hideElementAfterTimeout(message);
          })
          .catch(() => {
            setElementText(message, DISCONNECT_FAILURE_MESSAGE);
            message.setAttribute('style', `color: ${CONTRAST_RED}`);
            _hideElementAfterTimeout(message);
          });
        });
        setElementText(disconnectButton, DISCONNECT_BUTTON_TEXT);

        disconnectTD.appendChild(disconnectButton);
      }
      setElementText(nameTD, application.name);
    });
  }
}

/**
 * _addDomainToStorage - add a domain + app name connection to chrome storage
 *
 * @param  {String} host        the host/domain of the application
 * @param  {String} application the name of the application
 * @return {Promise}            if storing the data succeeded
 */
function _addDomainToStorage(host, application) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(STORED_APPS_KEY, (result) => {
      if (chrome.storage.lastError) {
        reject(new Error("Error retrieving stored apps"));
      }

      // no applications stored so result[STORED_APPS_KEY] is undefined
      if (!result[STORED_APPS_KEY]) result[STORED_APPS_KEY] = [];

      const app = { [host]: application.app_id };
      const updatedStoredApps = result[STORED_APPS_KEY].concat(app);

      const applicationTable = document.getElementById("application-table");
      chrome.storage.local.set({ [STORED_APPS_KEY]: updatedStoredApps }, () => {
        setElementDisplay(applicationTable, "none");
        resolve(!chrome.storage.lastError);
      });
    });
  });
}

/**
 * _disconnectDomain - removes an application + domain connection from storage
 *
 * @param  {String} host               the host/domain of the application
 * @param  {Array<String>} storedApps  the array of stored apps
 * @param  {String} application        the name of the application to remove
 * @param  {Node} disconnectButton     button user clicks remove an application
 * @return {Promise}                   if the removal succeeded
 */
function _disconnectDomain(storedApps, application, disconnectButton) {
  console.log("disconnect domain stored apps and application", storedApps, application);
  return new Promise((resolve, reject) => {
    const updatedStoredApps = storedApps[STORED_APPS_KEY].filter(app => {
      return Object.values(app)[0] !== application.app_id;
    });

    const domainElement = _getDisconnectButtonSibling(disconnectButton, application.name);
    if (!domainElement) return;

    const domain = Object.keys(application)[0];
    console.log("DOMAIN", domain);

    chrome.storage.local.set({
      [STORED_APPS_KEY]: updatedStoredApps,
      [CONTRAST__STORED_APP_LIBS]: "APP_LIBS__ID_" + domain,
    }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError));
      }
      setElementText(domainElement, '');
      disconnectButton.remove();
      resolve(!chrome.runtime.lastError);
    });
  });
}

/**
 * _getDisconnectButtonSibling - finds the simpling TD in the application table to the TD of the disconnect button, should have the name of the application in it
 *
 * @param  {Node} disconnectButton an HTML Element
 * @param  {String} appName        name of the stored app we're removing
 * @return {Node}                  an HTML element in the same row
 */
function _getDisconnectButtonSibling(disconnectButton, appName) {
  // button is inside a td which is inside a row
  const row = disconnectButton.parentNode.parentNode;
  const tds = row.querySelectorAll('td');

  for (let i = 0; i < tds.length; i++) {
    // get the td in the row that doesn't have an appName and isn't blank (which is where the disconnect button was)

    if (tds[i].innerText !== appName && tds[i].innerText !== "") {
      return tds[i];
    }
  }
  return null;
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
  const libsUserEmail = document.getElementById('libs-user-email');
  setElementText(userEmail, `User: ${items[CONTRAST_USERNAME]}`);
  setElementText(libsUserEmail, `User: ${items[CONTRAST_USERNAME]}`);
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
  if (!tab || !url) return false;

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
document.addEventListener('DOMContentLoaded', addButtonTabListeners, false);


function addButtonTabListeners() {
  const vulnsTab = document.getElementById('vulns-tab');
  const libsTab  = document.getElementById('libs-tab');
  vulnsTab.addEventListener('click', function() {
    const libsSection  = document.getElementById('libraries-section');
    const vulnsSection = document.getElementById('vulnerabilities-section');
    vulnsSection.classList.add('visible');
    vulnsSection.classList.remove('hidden');

    libsSection.classList.remove('visible');
    libsSection.classList.add('hidden');
  });

  libsTab.addEventListener('click', function() {
    const libsSection  = document.getElementById('libraries-section');
    const vulnsSection = document.getElementById('vulnerabilities-section');
    vulnsSection.classList.remove('visible');
    vulnsSection.classList.add('hidden');

    libsSection.classList.add('visible');
    libsSection.classList.remove('hidden');
  });
}
