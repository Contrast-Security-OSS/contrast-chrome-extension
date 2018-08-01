/*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
/*global
  chrome,
  document,
  URL,
  Helpers,
*/
import {
	getApplicationLibraries,
	addNewApplicationLibraries,
} from './libraries.js';

import {
  renderVulnerableLibraries,
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
		console.log("libs tab listener");
    const libsSection  = document.getElementById('libraries-section');
    const vulnsSection = document.getElementById('vulnerabilities-section');
    vulnsSection.classList.remove('visible');
    vulnsSection.classList.add('hidden');

    libsSection.classList.add('visible');
    libsSection.classList.remove('hidden');

		addListenerToRefreshButton();
    renderVulnerableLibraries();
  });
}

function addListenerToRefreshButton() {
	const refreshLibsButton = document.getElementById('refresh-libs-btn');
	refreshLibsButton.addEventListener('click', function() {
	  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
	    if (!tabs || tabs.length === 0) return;
	    const tab = tabs[0];
	    getApplicationLibraries(tab)
			.then(libs => {
				console.log("GOT APPLICATION LIBS", libs);
				if (libs && libs.length > 0) {
					addNewApplicationLibraries(libs, tab)
					.then(newLibs => {
						console.log("NEW LIBS STORED", newLibs);
						renderVulnerableLibraries();
					})
				}
			})
			.catch(error => {
				console.log("erorr refreshing app libs", error);
			})
	  });
	});
}
