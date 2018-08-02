/*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
/*global
  chrome,
  document,
  URL,
  Helpers,
*/

import {
  renderVulnerableLibraries,
} from './libraries/showLibraries.js'

import Application from './models/Application.js';
import ApplicationLibrary from './libraries/ApplicationLibrary.js';

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

// NOTE: Initial Values
let LIBS_ACTIVE  = false;
let VULNS_ACTIVE = true;

function addButtonTabListeners() {
  const vulnsTab = document.getElementById('vulns-tab');
  const libsTab  = document.getElementById('libs-tab');
  vulnsTab.addEventListener('click', function() {
		if (VULNS_ACTIVE) {
			return;
		}
		LIBS_ACTIVE  = false;
		VULNS_ACTIVE = true;
		libsTab.classList.remove('unfocued-but-still-showing');

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
		if (LIBS_ACTIVE) {
			return;
		}
		VULNS_ACTIVE = false;
		LIBS_ACTIVE  = true;
		vulnsTab.classList.remove('unfocued-but-still-showing');

    const libsSection  = document.getElementById('libraries-section');
    const vulnsSection = document.getElementById('vulnerabilities-section');
    vulnsSection.classList.remove('visible');
    vulnsSection.classList.add('hidden');

    libsSection.classList.add('visible');
    libsSection.classList.remove('hidden');

		addListenerToRefreshButton();
    renderVulnerableLibraries();
  });

	vulnsTab.addEventListener('blur', function(event) {
		if (VULNS_ACTIVE) {
			vulnsTab.classList.add('unfocued-but-still-showing');
		} else {
			vulnsTab.classList.remove('unfocued-but-still-showing');
		}
	});

	libsTab.addEventListener('blur', function(event) {
		if (LIBS_ACTIVE) {
			libsTab.classList.add('unfocued-but-still-showing');
		} else {
			libsTab.classList.remove('unfocued-but-still-showing');
		}
	});
}

function addListenerToRefreshButton() {
	const refreshLibsButton = document.getElementById('refresh-libs-btn');
	const loadingElement		= document.getElementById('libs-loading');
	refreshLibsButton.addEventListener('click', function() {
		_renderLoadingElement(refreshLibsButton, loadingElement);
	  chrome.tabs.query({ active: true, currentWindow: true }, async(tabs) => {
	    if (!tabs || tabs.length === 0) return;
	    const tab 	 = tabs[0];
			const app 	 = await Application.retrieveApplicationFromStorage(tab);
			const appLib = new ApplicationLibrary(tab, app);
	    const libs 	 = await appLib.getApplicationLibraries();
			if (!libs || libs.length === 0) {
				_renderFoundVulnerableLibraries("No libraries with vulnerabilities found.");
				_hideLoadingElement(refreshLibsButton, loadingElement)
				return;
			}
			const addedLibs = await appLib.addNewApplicationLibraries(libs);
			if (addedLibs && addedLibs.length > 0) {
				renderVulnerableLibraries(tab, app);
				_renderFoundVulnerableLibraries(`Found ${addedLibs.length} libraries with vulnerabilities.`);
				_hideLoadingElement(refreshLibsButton, loadingElement);
			} else {
				_renderFoundVulnerableLibraries("No libraries with vulnerabilities found.");
				_hideLoadingElement(refreshLibsButton, loadingElement);
			}
	  });
	});
}

function _renderFoundVulnerableLibraries(message) {
	const libMessage = document.getElementById('found-libs-message');
	libMessage.innerText = message;
	libMessage.classList.add('visible');
	libMessage.classList.remove('hidden');

	setTimeout(() => {
		libMessage.innerText = '';
		libMessage.classList.remove('visible');
		libMessage.classList.add('hidden');
	}, 3000);
}

function _hideLoadingElement(refreshLibsButton, loadingElement) {
	refreshLibsButton.classList.remove('hidden');
	refreshLibsButton.classList.add('visible');

	loadingElement.classList.add('hidden');
	loadingElement.classList.remove('visible');
}

function _renderLoadingElement(refreshLibsButton, loadingElement) {
	refreshLibsButton.classList.add('hidden');
	refreshLibsButton.classList.remove('visible');

	loadingElement.classList.remove('hidden');
	loadingElement.classList.add('visible');
}
