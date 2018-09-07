/*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
/*global
chrome,
document,
URL,
*/

import {
  renderVulnerableLibraries,
} from './libraries/showLibraries.js'

import Application from './models/Application.js';
import ApplicationLibrary from './libraries/ApplicationLibrary.js';

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
export function indexFunction() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

    const tab = tabs[0];
    const url = new URL(tab.url);
    console.log("getting creds");
    getStoredCredentials()
    .then(credentials => {
      console.log("creds are", credentials);
      const credentialed = isCredentialed(credentials);
      const config = new Config(tab, url, credentialed, credentials);
      config.getUserConfiguration();
      if (!credentialed) {
        console.log("indexFunction Action 1");
      } else if (credentialed && config._isTeamserverAccountPage()) {
        console.log("indexFunction Action 2");
        const table = new ApplicationTable(url);
        config.setGearIcon();
        table.renderApplicationsMenu();
        config.renderContrastUsername(credentials);
      } else {
        console.log("indexFunction Action 3");
        const table = new ApplicationTable(url);
        config.setGearIcon();
        table.renderActivityFeed();
        config.renderContrastUsername(credentials);
      }
    })
    .catch(error => new Error(error));
  });
}

/**
* Run when popup loads
*/
document.addEventListener('DOMContentLoaded', indexFunction, false);
document.addEventListener('DOMContentLoaded', showRefreshButton, false);

function showRefreshButton() {
  const refreshLibsButton = document.getElementById('scan-libs-text');
  const loadingElement		= document.getElementById('libs-loading');

  chrome.tabs.query({ active: true, currentWindow: true }, async(tabs) => {
    if (!tabs || tabs.length === 0) return;
    const tab = tabs[0];
    const app = await Application.retrieveApplicationFromStorage(tab);
    if (app) {
      refreshLibsButton.classList.remove('hidden');
      refreshLibsButton.classList.add('visible');

      addListenerToRefreshButton(refreshLibsButton, loadingElement)
    }
  });
}

function addListenerToRefreshButton(refreshLibsButton, loadingElement) {
  refreshLibsButton.addEventListener('click', function() {
    console.log('clicked libs btn');
    _renderLoadingElement(refreshLibsButton, loadingElement);
    chrome.tabs.query({ active: true, currentWindow: true }, async(tabs) => {
      if (!tabs || tabs.length === 0) return;
      const tab 	 = tabs[0];
      const app 	 = await Application.retrieveApplicationFromStorage(tab);
      const appLib = new ApplicationLibrary(tab, app);
      try {
        const libs = await appLib.getApplicationLibraries();
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
      } catch (e) {
        _renderFoundVulnerableLibraries("Error collecting libraries.");
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
  // refreshLibsButton.classList.remove('hidden');
  // refreshLibsButton.classList.add('visible');

  loadingElement.classList.add('hidden');
  loadingElement.classList.remove('visible');
}

function _renderLoadingElement(refreshLibsButton, loadingElement) {
  // refreshLibsButton.classList.add('hidden');
  // refreshLibsButton.classList.remove('visible');

  loadingElement.classList.remove('hidden');
  loadingElement.classList.add('visible');
}
