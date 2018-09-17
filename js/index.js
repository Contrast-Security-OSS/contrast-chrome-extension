/*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
/*global
chrome,
document,
URL,
*/

// import {
//   renderVulnerableLibraries,
// } from './libraries/showLibraries.js'

// import Application from './models/Application.js';
// import ApplicationLibrary from './libraries/ApplicationLibrary.js';

import {
  getStoredCredentials,
  isCredentialed,
  setElementDisplay
} from "./util.js";

import Application from "./models/Application.js";
import ApplicationTable from "./models/ApplicationTable.js";
import Config from "./models/Config.js";

/**
 * indexFunction - Main function that's run, renders config button if user is on TS Your Account Page, otherwise renders vulnerability feed
 *
 * @return {void}
 */
export function indexFunction() {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs[0];
    const url = new URL(tab.url);
    getStoredCredentials()
      .then(async credentials => {
        const credentialed = isCredentialed(credentials);

        const application = await Application.retrieveApplicationFromStorage(
          tab
        );
        // if (!application) return;

        const config = new Config(
          tab,
          url,
          credentialed,
          credentials,
          !!application
        );
        config.addListenerToConfigButton();
        console.log("Get popup screen");
        config.popupScreen();
        if (!credentialed) {
          console.log("index 1");
          console.log("Please Configure the Extension");
        } else if (
          (credentialed && config._isContrastPage()) ||
          !config.hasApp
        ) {
          console.log("index 2");
          const table = new ApplicationTable(url);
          config.setGearIcon();
          table.renderApplicationsMenu();
          config.renderContrastUsername(credentials);
        } else {
          console.log("index 3");
          config.setGearIcon();
          config.renderContrastUsername(credentials);
          if (!config._isContrastPage()) {
            const table = new ApplicationTable(url);
            table.renderActivityFeed();
          }
        }
      })
      .catch(error => new Error(error));
  });
}

/**
 * Run when popup loads
 */
document.addEventListener("DOMContentLoaded", indexFunction, false);
document.addEventListener("DOMContentLoaded", configureTabs, false);
// document.addEventListener('DOMContentLoaded', showRefreshButton, false);

const CONFIG_TAB_FUNCTIONS = {
  Configuration: () => renderCredentials(),
  Applications: () => renderApplications()
};
function configureTabs() {
  const klass = "config-tab";
  const configTabs = document.getElementsByClassName(klass);

  for (let i = 0, len = configTabs.length; i < len; i++) {
    let el = configTabs[i];
    // let otherEls = configTabs.filter((t, index) => i !== index);
    el.addEventListener("click", configTabClick);
  }
}

function configTabClick(e) {
  const t = e.target;
  const text = t.innerText;
  setTab(t);
  CONFIG_TAB_FUNCTIONS[text]();
}

function setTab(button) {
  const klass = "config-tab";
  const active = "active";
  if (button.classList.contains("active")) {
    return;
  }
  const configTabs = document.getElementsByClassName(klass);
  for (let i = 0, len = configTabs.length; i < len; i++) {
    let el = configTabs[i];
    el.classList.remove(active);
  }
  button.classList.add(active);
}

function renderCredentials() {
  const table = document.getElementById("application-table-container-section");
  const creds = document.getElementById("configuration-section");

  setElementDisplay(table, "none");
  setElementDisplay(creds, "flex");
}

function renderApplications() {
  const tableContainer = document.getElementById(
    "application-table-container-section"
  );
  const creds = document.getElementById("configuration-section");

  setElementDisplay(tableContainer, "flex");
  setElementDisplay(creds, "none");

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const url = new URL(tabs[0].url);
    const table = new ApplicationTable(url);
    table.renderApplicationsMenu();
  });
}

// function showRefreshButton() {
//   const refreshLibsButton = document.getElementById('scan-libs-text');
//   const loadingElement		= document.getElementById('libs-loading');
//
//   chrome.tabs.query({ active: true, currentWindow: true }, async(tabs) => {
//     if (!tabs || tabs.length === 0) return;
//     const tab = tabs[0];
//     const app = await Application.retrieveApplicationFromStorage(tab);
//     if (app) {
//       refreshLibsButton.classList.remove('hidden');
//       refreshLibsButton.classList.add('visible');
//
//       addListenerToRefreshButton(refreshLibsButton, loadingElement)
//     }
//   });
// }
//
// function addListenerToRefreshButton(refreshLibsButton, loadingElement) {
//   refreshLibsButton.addEventListener('click', function() {
//     _renderLoadingElement(loadingElement);
//     chrome.tabs.query({ active: true, currentWindow: true }, async(tabs) => {
//       if (!tabs || tabs.length === 0) return;
//       const tab 	 = tabs[0];
//       const app 	 = await Application.retrieveApplicationFromStorage(tab);
//       const appLib = new ApplicationLibrary(tab, app);
//       try {
//         const libs = await appLib.getApplicationLibraries();
//         if (!libs || libs.length === 0) {
//           _renderFoundVulnerableLibraries("No libraries with vulnerabilities found.");
//           _hideLoadingElement(loadingElement)
//           return;
//         }
//         const addedLibs = await appLib.addNewApplicationLibraries(libs);
//         if (addedLibs && addedLibs.length > 0) {
//           renderVulnerableLibraries(tab, app);
//           _renderFoundVulnerableLibraries(`Found ${addedLibs.length} libraries with vulnerabilities.`);
//           _hideLoadingElement(loadingElement);
//         } else {
//           _renderFoundVulnerableLibraries("No libraries with vulnerabilities found.");
//           _hideLoadingElement(loadingElement);
//         }
//       } catch (e) {
//         _renderFoundVulnerableLibraries("Error collecting libraries.");
//         _hideLoadingElement(loadingElement);
//       }
//     });
//   });
// }
//
// function _renderFoundVulnerableLibraries(message) {
//   const libMessage = document.getElementById('found-libs-message');
//   libMessage.innerText = message;
//   libMessage.classList.add('visible');
//   libMessage.classList.remove('hidden');
//
//   setTimeout(() => {
//     libMessage.innerText = '';
//     libMessage.classList.remove('visible');
//     libMessage.classList.add('hidden');
//   }, 3000);
// }
//
// function _hideLoadingElement(loadingElement) {
//   loadingElement.style.visibility = 'hidden';
//   // setElementDisplay(loadingElement, 'none');
// }
//
// function _renderLoadingElement(loadingElement) {
//   loadingElement.style.visibility = 'visible';
//   // setElementDisplay(loadingElement, 'inline');
// }
