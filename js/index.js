/*global
  chrome,
  document,
  VALID_TEAMSERVER_HOSTNAMES,
  TEAMSERVER_ACCOUNT_PATH_SUFFIX,
  TEAMSERVER_INDEX_PATH_SUFFIX,
  TEAMSERVER_PROFILE_PATH_SUFFIX,
  URL,
  getStoredCredentials,
  isCredentialed,
  isBlacklisted,
  CONTRAST_RED,
  CONTRAST_GREEN,
  STORED_APPS_KEY,
  getApplications,
  getHostFromUrl,
  chromeExtensionSettingsUrl
*/
"use strict"

/**
 * indexFunction - Main function that's run, renders config button if user is on TS Your Account Page, otherwise renders vulnerability feed
 *
 * @return {void}
 */
function indexFunction() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

    const tab = tabs[0];
    const url = new URL(tab.url);

    getStoredCredentials().then(items => {
      if (!isCredentialed(items)) {
        getUserConfiguration(tab, url);
      } else if (isCredentialed(items) && isTeamserverAccountPage(tab, url)) {
        document.getElementById('configure-extension-button')
                .text("Reconfigure");
        getUserConfiguration(tab, url);
        renderApplicationsMenu(url);
      } else {
        renderActivityFeed(items, url);
      }

      //configure button opens up settings page in new tab
      let configureButton = document.getElementById('configure');
      configureButton.addEventListener('click', () => {
        chrome.tabs.create({ url: chromeExtensionSettingsUrl() })
      }, false);
    });
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

  document.getElementById('applications-heading-container').show();

  applicationsHeading.addEventListener('click', () => {
    unrollApplications(applicationsArrow, applicationTable, url);
  });
  applicationsArrow.addEventListener('click', () => {
    unrollApplications(applicationsArrow, applicationTable, url);
  });
}

function unrollApplications(applicationsArrow, applicationTable, url) {
  if (applicationsArrow.innerText === ' ▶') {
    applicationsArrow.text(' ▼');

    applicationTable.classList.add('application-table-visible');
    applicationTable.classList.remove('application-table-hidden');

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

    applicationsArrow.text(' ▶');
  }
}

/**
 * getUserConfiguration - renders the elements/dialog for a user configuring the connection from the extension to teamserver
 *
 * @param  {Object} tab the current tab
 * @param  {URL<Object>} url a url object of the current tab
 * @return {void}
 */
function getUserConfiguration(tab, url) {
  if (isTeamserverAccountPage(tab, url)) {
    document.getElementById('configure-extension').show();

    let configureExtensionHost = document.getElementById('configure-extension-host');
    // configureExtensionHost.text("Make sure you trust this site: " + url.hostname);
    configureExtensionHost.text("Make sure you trust this site: " + url.hostname)

    renderConfigButton(tab);
  } else {
    document.getElementById('not-configured').hide("")
  }
}

/**
 * renderConfigButton - renders the button the user clicks to configure teamserver credentials
 *
 * @param  {Object} tab the current tab
 * @return {void}
 */
function renderConfigButton(tab) {
  let configureExtensionButton = document.getElementById('configure-extension-button');

  configureExtensionButton.addEventListener('click', () => {
    configureExtensionButton.setAttribute('disabled', true);

    // credentials are set by sending a message to content-script
    chrome.tabs.sendMessage(tab.id, { url: tab.url, action: "INITIALIZE" }, (response) => {

      // NOTE: In development if the extension is reloaded and the web page is not response will be undefined and throw an error. The solution is to reload the webpage.

      if (response === "INITIALIZED") {

        chrome.browserAction.setBadgeText({ tabId: tab.id, text: '' });

        // recurse on this method, credentials should have been set in content-script so this part of indexFunction will not be evaluated again
        const successMessage = document.getElementById('config-success');
        successMessage.show();
        setTimeout(() => {
          configureExtensionButton.removeAttribute('disabled');
          successMessage.hide();
          indexFunction();
        }, 2000);
      } else {
        configureExtensionButton.removeAttribute('disabled');
        const failureMessage = document.getElementById('config-failure');
        failureMessage.show();
        setTimeout(() => failureMessage.hide(), 2000);
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
    if (!!result[STORED_APPS_KEY] && result[STORED_APPS_KEY].filter(app => app[host])[0]) {
      showActivityFeed(items);
    } else {
      const applicationTable = document.getElementById("application-table");
      applicationTable.classList.add('application-table-visible');
      applicationTable.classList.remove('application-table-hidden');

      document.getElementById("vulnerabilities-found-on-page").hide();

      // if app is not stored, render the table with buttons to add the domain
      getApplications()
      .then(json => {
        if (!json) {
          throw new Error("Error getting applications");
        }

        let applications = json.applications;

        // if there are apps in storage and we aren't on a contrast page, filter apps so that we only show ones that have NOT been connected to a domain
        if (!!result[STORED_APPS_KEY] && !url.href.includes("Contrast")) {

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
 * showActivityFeed - renders the container for vulnerabilities
 *
 * @param  {Object} items - contains contrast credentials and info from storage
 * @return {void}
 */
function showActivityFeed(items) {
  // find sections
  let notConfiguredSection = document.getElementById('not-configured');
  let configureExtension   = document.getElementById('configure-extension');

  // if you don't need credentials, hide the signin functionality
  configureExtension.hide();
  notConfiguredSection.hide();

  let visitOrgLink = document.getElementById('visit-org');
  let userEmail    = document.getElementById('user-email');
  userEmail.text("User: " + items.contrast_username);

  visitOrgLink.addEventListener('click', () => {
    const contrastIndex = items.teamserver_url.indexOf("/Contrast/api");
    const teamserverUrl = items.teamserver_url.substring(0, contrastIndex);
    chrome.tabs.create({ url: teamserverUrl });
  }, false);

  let signInButtonConfigurationProblem = document.getElementById('sign-in-button-configuration-problem');

  signInButtonConfigurationProblem.addEventListener('click', () => {
    chrome.tabs.create({ url: chromeExtensionSettingsUrl() });
  }, false);
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

  appIdTD.text(application.app_id);
  appIdTD.hide();

  tableBody.appendChild(row);
  row.appendChild(nameTD);
  row.appendChild(domainTD);
  row.appendChild(appIdTD);
  row.appendChild(disconnectTD);

  const host = getHostFromUrl(url);

  // if the url is not a contrast url then show a collection of app name buttons that will let a user connect an app to a domain
  if (!url.href.includes("/Contrast/")) {
    domainTD.text('Click to Connect Domain');

    const domainBtn = document.createElement('button');
    domainBtn.setAttribute('class', 'btn btn-primary btn-xs btn-contrast-plugin domainBtn');

    domainBtn.text(application.name.titleize());
    nameTD.appendChild(domainBtn);

    domainBtn.addEventListener('click', () => {
      const message = document.getElementById("connected-domain-message");
      message.classList.add("visible");
      message.classList.remove("hidden");

      _addDomainToStorage(host, application)
      .then(result => {
        if (result) {
          message.text("Successfully connected domain. You may need to reload the page.");
          message.setAttribute('style', `color: ${CONTRAST_GREEN}`);
        } else {
          message.text("Error Connecting Domain");
          message.setAttribute('style', `color: ${CONTRAST_RED}`);
        }
        lingerMessage(message, indexFunction);
      })
      .catch(() => {
        message.text("Error Connecting Domain");
        message.setAttribute('style', `color: ${CONTRAST_RED}`);
        lingerMessage(message);
      });
    });
  } else {

    // on a contrast page - render the full collection of apps in a user org with respective domains
    chrome.storage.local.get(STORED_APPS_KEY, (result) => {
      if (chrome.runtime.lastError) return;

      // result has not been defined yet
      if (!result || !result[STORED_APPS_KEY]) {
        result = { APPS: [] }
      }

      const storedApp = result[STORED_APPS_KEY].filter(app => {
        return Object.values(app)[0] === application.app_id;
      })[0];

      if (!!storedApp) {
        let domain = Object.keys(storedApp)[0];
        if (domain.includes("_")) {
          domain = domain.split("_").join(":"); // local dev stuff
        }
        domainTD.text(domain);

        const message = document.getElementById("connected-domain-message");
        const disconnectButton = document.createElement('button');
        disconnectButton.setAttribute('class', 'btn btn-primary btn-xs btn-contrast-plugin');
        disconnectButton.addEventListener('click', () => {
          message.classList.add("visible");
          message.classList.remove("hidden");

          _disconnectDomain(result, application, disconnectButton)
          .then(disconnected => {
            if (disconnected) {
              message.text("Successfully Disconnected Domain");
              message.setAttribute('style', `color: ${CONTRAST_GREEN}`);
            } else {
              message.text("Error Disconnecting Domain");
              message.setAttribute('style', `color: ${CONTRAST_RED}`);
            }
            lingerMessage(message);
          })
          .catch(() => {
            message.text("Error Disconnecting Domain");
            message.setAttribute('style', `color: ${CONTRAST_RED}`);
            lingerMessage(message);
          });
        });
        disconnectButton.text("Disconnect Domain");

        disconnectTD.appendChild(disconnectButton);
      }
      nameTD.text(application.name);
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

      const updatedStoredApps = result[STORED_APPS_KEY].concat({
        [host]: application.app_id
      });

      chrome.storage.local.set({ [STORED_APPS_KEY]: updatedStoredApps }, () => {
        document.getElementById("application-table").hide();
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
  return new Promise((resolve, reject) => {
    const updatedStoredApps = storedApps[STORED_APPS_KEY].filter(app => {
      return Object.values(app)[0] !== application.app_id;
    })

    const domainElement = getDisconnectButtonSibling(disconnectButton, application.name);
    if (!domainElement) return;

    chrome.storage.local.set({ [STORED_APPS_KEY]: updatedStoredApps }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError));
      }
      domainElement.text('');
      disconnectButton.remove();
      resolve(!chrome.runtime.lastError);
    });
  });
}

/**
 * getDisconnectButtonSibling - finds the simpling TD in the application table to the TD of the disconnect button, should have the name of the application in it
 *
 * @param  {Node} disconnectButton an HTML Element
 * @param  {String} appName        name of the stored app we're removing
 * @return {Node}                  an HTML element in the same row
 */
function getDisconnectButtonSibling(disconnectButton, appName) {
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

/**
 * lingerMessage - leave a success/failure message on the screen for 2 seconds by toggling a class
 *
 * @param  {Node} element HTML Element to show for 2 seconds
 * @return {void}
 */
function lingerMessage(element, callback) {
  setTimeout(() => { // eslint-disable-line consistent-return
    element.classList.add("hidden");
    element.classList.remove("visible");
    if (callback) {
      return callback();
    }
  }, 2000); // let the element linger
}

/**
 * isTeamserverAccountPage - checks if we're on the teamserver Your Account page
 *
 * @param  {Object} tab the current tab
 * @param  {URL<Object>} url url object of the current tab
 * @return {Boolean} if it is the teamserver page
 */
function isTeamserverAccountPage(tab, url) {
  if (!tab || !url) return false;

  const conditions = [
    tab.url.startsWith("http"),
    VALID_TEAMSERVER_HOSTNAMES.includes(url.hostname),
    tab.url.endsWith(TEAMSERVER_ACCOUNT_PATH_SUFFIX) || tab.url.endsWith(TEAMSERVER_PROFILE_PATH_SUFFIX),
    tab.url.indexOf(TEAMSERVER_INDEX_PATH_SUFFIX) !== -1
  ];
  return conditions.every(c => !!c);
}


document.addEventListener('DOMContentLoaded', indexFunction, false);

// --------- HELPER FUNCTIONS -------------
function chromeExtensionSettingsUrl() {
  const extensionId = chrome.runtime.id;
  return 'chrome-extension://' + String(extensionId) + '/settings.html';
}
