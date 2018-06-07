"use strict";

var _util = require("./util.js");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /*global
                                                                                                                                                                                                                    chrome,
                                                                                                                                                                                                                    document,
                                                                                                                                                                                                                    URL,
                                                                                                                                                                                                                  */


var CONNECT_BUTTON_TEXT = "Click to Connect Domain";
var CONNECT_SUCCESS_MESSAGE = "Successfully connected domain. You may need to reload the page.";
var CONNECT_FAILURE_MESSAGE = "Error Connecting Domain. Try refreshing the page.";
var DISCONNECT_SUCCESS_MESSAGE = "Successfully Disconnected Domain";
var DISCONNECT_FAILURE_MESSAGE = "Error Disconnecting Domain";
var DISCONNECT_BUTTON_TEXT = "Disconnect Domain";

var CONTRAST_BUTTON_CLASS = "btn btn-primary btn-xs btn-contrast-plugin";

/**
 * indexFunction - Main function that's run, renders config button if user is on TS Your Account Page, otherwise renders vulnerability feed
 *
 * @return {void}
 */
function indexFunction() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {

    var tab = tabs[0];
    var url = new URL(tab.url);

    (0, _util.getStoredCredentials)().then(function (items) {
      if (!(0, _util.isCredentialed)(items)) {
        getUserConfiguration(tab, url);
      } else if ((0, _util.isCredentialed)(items) && _isTeamserverAccountPage(tab, url)) {
        getUserConfiguration(tab, url);
        renderApplicationsMenu(url);
        _renderContrastUsername(items);
      } else {
        renderActivityFeed(items, url);
        _renderContrastUsername(items);
      }

      //configure button opens up settings page in new tab
      var configureGearIcon = document.getElementById('configure-gear');
      configureGearIcon.addEventListener('click', function () {
        chrome.tabs.create({ url: _chromeExtensionSettingsUrl() });
      }, false);
    }).catch(function (error) {
      return new Error(error);
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
  var applicationsHeading = document.getElementById('applications-heading');
  var applicationsArrow = document.getElementById('applications-arrow');
  var applicationTable = document.getElementById('application-table');

  var applicationsHeadingContainer = document.getElementById('applications-heading-container');
  (0, _util.setElementDisplay)(applicationsHeadingContainer, "block");

  applicationsHeading.addEventListener('click', function () {
    unrollApplications(applicationsArrow, applicationTable, url);
  });
  applicationsArrow.addEventListener('click', function () {
    unrollApplications(applicationsArrow, applicationTable, url);
  });
}

function unrollApplications(applicationsArrow, applicationTable, url) {
  if (applicationsArrow.innerText === ' ▶') {
    (0, _util.setElementText)(applicationsArrow, ' ▼');

    applicationTable.classList.add('application-table-visible');
    applicationTable.classList.remove('application-table-hidden');

    // if less than 2 then only the heading row has been rendered
    if (document.getElementsByTagName('tr').length < 2) {
      (0, _util.getApplications)().then(function (json) {
        if (!json) {
          throw new Error("Error getting applications");
        }
        json.applications.forEach(function (app) {
          return createAppTableRow(app, url);
        });
      }).catch(function (error) {
        return new Error(error);
      });
    }
  } else {
    applicationTable.classList.add('application-table-hidden');
    applicationTable.classList.remove('application-table-visible');

    (0, _util.setElementText)(applicationsArrow, ' ▶');
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
  if (_isTeamserverAccountPage(tab, url)) {
    var configButton = document.getElementById('configure-extension-button');
    (0, _util.setElementText)(configButton, "Reconfigure");

    var configExtension = document.getElementById('configure-extension');
    (0, _util.setElementDisplay)(configExtension, "block");

    var configExtensionHost = document.getElementById('configure-extension-host');
    (0, _util.setElementText)(configExtensionHost, "Make sure you trust this site: " + url.hostname);

    renderConfigButton(tab, configButton);
  } else {
    var notConfigured = document.getElementById('not-configured');
    (0, _util.setElementDisplay)(notConfigured, "");
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

  configButton.addEventListener('click', function () {
    configButton.setAttribute('disabled', true);

    // whenever user configures, remove all traces and apps, useful for when reconfiguring
    chrome.storage.local.remove([_util.STORED_APPS_KEY, _util.STORED_TRACES_KEY], function () {
      if (chrome.runtime.lastError) {
        throw new Error("Error removing stored apps and stored traces");
      }
    });

    // credentials are set by sending a message to content-script
    chrome.tabs.sendMessage(tab.id, { url: tab.url, action: "INITIALIZE" }, function (response) {

      // NOTE: In development if the extension is reloaded and the web page is not response will be undefined and throw an error. The solution is to reload the webpage.

      if (response === "INITIALIZED") {
        chrome.browserAction.setBadgeText({ tabId: tab.id, text: '' });

        // recurse on indexFunction, credentials should have been set in content-script so this part of indexFunction will not be evaluated again
        var successMessage = document.getElementById('config-success');
        successMessage.classList.add("visible");
        successMessage.classList.remove("hidden");
        _hideElementAfterTimeout(successMessage, function () {
          configButton.removeAttribute('disabled');
        });
      } else {
        var failureMessage = document.getElementById('config-failure');
        failureMessage.classList.add("visible");
        failureMessage.classList.remove("hidden");
        _hideElementAfterTimeout(failureMessage, function () {
          configButton.removeAttribute('disabled');
        });
      }
      return;
    });
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
  if ((0, _util.isBlacklisted)(url.host)) return;

  chrome.storage.local.get(_util.STORED_APPS_KEY, function (result) {
    var host = (0, _util.getHostFromUrl)(url);
    // look in stored apps array for app tied to host, if we are a site/domain tied to an app in contrast, render the vulnerabilities for that app
    if (!!result[_util.STORED_APPS_KEY] && result[_util.STORED_APPS_KEY].filter(function (app) {
      return app[host];
    })[0]) {
      // find sections
      var notConfiguredSection = document.getElementById('not-configured');
      var configureExtension = document.getElementById('configure-extension');

      // if you don't need credentials, hide the signin functionality
      (0, _util.setElementDisplay)(configureExtension, "none");
      (0, _util.setElementDisplay)(notConfiguredSection, "none");
    } else {
      var applicationTable = document.getElementById("application-table");

      // transitions on these classes, not a simple display none/table
      applicationTable.classList.add('application-table-visible');
      applicationTable.classList.remove('application-table-hidden');

      var vulnsFound = document.getElementById("vulnerabilities-found-on-page");
      (0, _util.setElementDisplay)(vulnsFound, "none");

      // if app is not stored, render the table with buttons to add the domain
      (0, _util.getApplications)().then(function (json) {
        if (!json) {
          throw new Error("Error getting applications");
        }

        var applications = json.applications;

        // if there are apps in storage and we aren't on a contrast page, filter apps so that we only show ones that have NOT been connected to a domain
        if (!!result[_util.STORED_APPS_KEY] && !(0, _util.isContrastTeamserver)(url.href)) {

          var appIds = result[_util.STORED_APPS_KEY].map(Object.values).flatten();
          applications = applications.filter(function (app) {

            // include in applications if it's not in storage
            return !appIds.includes(app.app_id);
          });
        }

        // create a row for each application
        applications.forEach(function (app) {
          return createAppTableRow(app, url);
        });
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
  var tableBody = document.getElementById('application-table-body');
  var row = document.createElement('tr');
  var nameTD = document.createElement('td');
  var appIdTD = document.createElement('td');
  var domainTD = document.createElement('td');
  var disconnectTD = document.createElement('td');

  (0, _util.setElementText)(appIdTD, application.app_id);
  (0, _util.setElementDisplay)(appIdTD, "none");

  tableBody.appendChild(row);
  row.appendChild(nameTD);
  row.appendChild(domainTD);
  row.appendChild(appIdTD);
  row.appendChild(disconnectTD);

  var host = (0, _util.getHostFromUrl)(url);

  // if the url is not a contrast url then show a collection of app name buttons that will let a user connect an app to a domain
  if (!(0, _util.isContrastTeamserver)(url.href)) {
    (0, _util.setElementText)(domainTD, CONNECT_BUTTON_TEXT);

    var domainBtn = document.createElement('button');
    domainBtn.setAttribute('class', CONTRAST_BUTTON_CLASS + " domainBtn");

    (0, _util.setElementText)(domainBtn, application.name.titleize());
    nameTD.appendChild(domainBtn);

    domainBtn.addEventListener('click', function () {
      var message = document.getElementById("connected-domain-message");
      message.classList.add("visible");
      message.classList.remove("hidden");

      _addDomainToStorage(host, application).then(function (result) {
        if (result) {
          (0, _util.setElementText)(message, CONNECT_SUCCESS_MESSAGE);
          message.setAttribute('style', "color: " + _util.CONTRAST_GREEN);
        } else {
          (0, _util.setElementText)(message, CONNECT_FAILURE_MESSAGE);
          message.setAttribute('style', "color: " + _util.CONTRAST_RED);
        }
        _hideElementAfterTimeout(message, indexFunction);
      }).catch(function () {
        (0, _util.setElementText)(message, CONNECT_FAILURE_MESSAGE);
        message.setAttribute('style', "color: " + _util.CONTRAST_RED);
        _hideElementAfterTimeout(message);
      });
    });
  } else {

    // on a contrast page - render the full collection of apps in a user org with respective domains
    chrome.storage.local.get(_util.STORED_APPS_KEY, function (result) {
      if (chrome.runtime.lastError) return;

      // result has not been defined yet
      if (!result || !result[_util.STORED_APPS_KEY]) {
        result = { APPS: [] };
      }

      var storedApp = result[_util.STORED_APPS_KEY].filter(function (app) {
        return Object.values(app)[0] === application.app_id;
      })[0];

      if (!!storedApp) {
        var domain = Object.keys(storedApp)[0];
        if (domain.includes("_")) {
          domain = domain.split("_").join(":"); // local dev stuff
        }
        (0, _util.setElementText)(domainTD, domain);

        var message = document.getElementById("connected-domain-message");
        var disconnectButton = document.createElement('button');
        disconnectButton.setAttribute('class', CONTRAST_BUTTON_CLASS);
        disconnectButton.addEventListener('click', function () {
          message.classList.add("visible");
          message.classList.remove("hidden");

          _disconnectDomain(result, application, disconnectButton).then(function (disconnected) {
            if (disconnected) {
              (0, _util.setElementText)(message, DISCONNECT_SUCCESS_MESSAGE);
              message.setAttribute('style', "color: " + _util.CONTRAST_GREEN);
            } else {
              (0, _util.setElementText)(message, DISCONNECT_FAILURE_MESSAGE);
              message.setAttribute('style', "color: " + _util.CONTRAST_RED);
            }
            _hideElementAfterTimeout(message);
          }).catch(function () {
            (0, _util.setElementText)(message, DISCONNECT_FAILURE_MESSAGE);
            message.setAttribute('style', "color: " + _util.CONTRAST_RED);
            _hideElementAfterTimeout(message);
          });
        });
        (0, _util.setElementText)(disconnectButton, DISCONNECT_BUTTON_TEXT);

        disconnectTD.appendChild(disconnectButton);
      }
      (0, _util.setElementText)(nameTD, application.name);
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
  return new Promise(function (resolve, reject) {
    chrome.storage.local.get(_util.STORED_APPS_KEY, function (result) {
      if (chrome.storage.lastError) {
        reject(new Error("Error retrieving stored apps"));
      }

      // no applications stored so result[STORED_APPS_KEY] is undefined
      if (!result[_util.STORED_APPS_KEY]) result[_util.STORED_APPS_KEY] = [];

      var updatedStoredApps = result[_util.STORED_APPS_KEY].concat(_defineProperty({}, host, application.app_id));

      var applicationTable = document.getElementById("application-table");
      chrome.storage.local.set(_defineProperty({}, _util.STORED_APPS_KEY, updatedStoredApps), function () {
        (0, _util.setElementDisplay)(applicationTable, "none");
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
  return new Promise(function (resolve, reject) {
    var updatedStoredApps = storedApps[_util.STORED_APPS_KEY].filter(function (app) {
      return Object.values(app)[0] !== application.app_id;
    });

    var domainElement = _getDisconnectButtonSibling(disconnectButton, application.name);
    if (!domainElement) return;

    chrome.storage.local.set(_defineProperty({}, _util.STORED_APPS_KEY, updatedStoredApps), function () {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError));
      }
      (0, _util.setElementText)(domainElement, '');
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
  var row = disconnectButton.parentNode.parentNode;
  var tds = row.querySelectorAll('td');

  for (var i = 0; i < tds.length; i++) {
    // get the td in the row that doesn't have an appName and isn't blank (which is where the disconnect button was)

    if (tds[i].innerText !== appName && tds[i].innerText !== "") {
      return tds[i];
    }
  }
  return null;
}

// --------- HELPER FUNCTIONS -------------
function _chromeExtensionSettingsUrl() {
  var extensionId = chrome.runtime.id;
  return "chrome-extension://" + String(extensionId) + "/settings.html";
}

/**
 * renderContrastUsername - renders the email address of the contrast user
 *
 * @param  {Object} items contrast creds
 * @return {void}
 */
function _renderContrastUsername(items) {
  var userEmail = document.getElementById('user-email');
  (0, _util.setElementText)(userEmail, "User: " + items[_util.CONTRAST_USERNAME]);
  (0, _util.setElementDisplay)(userEmail, "block");
  userEmail.addEventListener('click', function () {
    var contrastIndex = items.teamserver_url.indexOf("/Contrast/api");
    var teamserverUrl = items.teamserver_url.substring(0, contrastIndex);
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
  setTimeout(function () {
    // eslint-disable-line consistent-return
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

  var conditions = [tab.url.startsWith("http"), _util.VALID_TEAMSERVER_HOSTNAMES.includes(url.hostname), tab.url.endsWith(_util.TEAMSERVER_ACCOUNT_PATH_SUFFIX) || tab.url.endsWith(_util.TEAMSERVER_PROFILE_PATH_SUFFIX), tab.url.indexOf(_util.TEAMSERVER_INDEX_PATH_SUFFIX) !== -1];
  return conditions.every(function (c) {
    return !!c;
  });
}

/**
 * Run when popup loads
 */
document.addEventListener('DOMContentLoaded', indexFunction, false);