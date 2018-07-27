/*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
/*global
  chrome,
  document,
  URL,
  Helpers,
*/
import {
	getStoredApplicationLibraries,
} from './libraries.js';

import {
  renderVulnerableLibraries
} from './libraries/showLibraries.js'

const CONNECT_BUTTON_TEXT     = "Click to Connect";
const CONNECT_SUCCESS_MESSAGE = "Successfully connected. You may need to reload the page.";
const CONNECT_FAILURE_MESSAGE = "Error Connecting. Try refreshing the page.";
const DISCONNECT_SUCCESS_MESSAGE = "Successfully disconnected. You may need to reload the page.";
const DISCONNECT_FAILURE_MESSAGE = "Error Disconnecting";
const DISCONNECT_BUTTON_TEXT     = "Disconnect";

const CONTRAST_BUTTON_CLASS = "btn btn-primary btn-xs btn-contrast-plugin";
import {
  getStoredCredentials,
  isCredentialed,
} from './util.js';

import ApplicationTable from './models/ApplicationTable.js';
import Config from './models/Config.js';

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
    .then(credentials => {
      const credentialed = isCredentialed(credentials);
      const config = new Config(tab, url, credentialed);
      if (!credentialed) {
        config.getUserConfiguration();
      } else if (credentialed && config._isTeamserverAccountPage()) {
        config.getUserConfiguration();
        // renderApplicationsMenu(url);
        const table = new ApplicationTable(url);
        table.renderApplicationsMenu();
        config.renderContrastUsername(credentials);
      } else {
        const table = new ApplicationTable(url);
        table.renderActivityFeed();
        config.renderContrastUsername(credentials);
      }
      config.setGearIcon();
    })
    .catch(error => new Error(error));
  });
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

    const libsList = document.getElementById('libs-vulnerabilities-found-on-page-list');
    while (libsList.firstChild) {
      libsList.firstChild.remove();
    }
  });

  libsTab.addEventListener('click', function() {
    const libsSection  = document.getElementById('libraries-section');
    const vulnsSection = document.getElementById('vulnerabilities-section');
    vulnsSection.classList.remove('visible');
    vulnsSection.classList.add('hidden');

    libsSection.classList.add('visible');
    libsSection.classList.remove('hidden');

    // setLoadingElement(true);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) return;
      const tab = tabs[0];
      retrieveApplicationFromStorage(tab)
      .then(application => {
        if (!application) throw new Error("No Application");

        const appKey = "APP_LIBS__ID_" + Object.keys(application)[0];
        chrome.storage.local.get(CONTRAST__STORED_APP_LIBS, (result) => {
          const libraries = result[CONTRAST__STORED_APP_LIBS][appKey].libraries;
          renderVulnerableLibraries(libraries);
        })
      })
      .catch(Error)
    })
  });
}

const refreshLibsButton = document.getElementById('refresh-libs-btn');
refreshLibsButton.addEventListener('click', function() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) return;
    const tab = tabs[0];
    retrieveApplicationFromStorage(tab)
    .then(application => {
      console.log("application", application);
      if (application) {
        getStoredApplicationLibraries(application, tab)
        .then(libraries => {
          console.log("libraries", libraries);
          renderVulnerableLibraries(libraries);
        })
        .catch(Error);
      } else {
        throw new Error("No Application");
      }
    })
    .catch(Error);
  });
});


// getStoredApplicationLibraries(application, tab);
