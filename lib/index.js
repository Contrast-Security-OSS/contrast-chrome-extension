'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.indexFunction = indexFunction;

var _util = require('./util.js');

var _ApplicationTable = require('./models/ApplicationTable.js');

var _ApplicationTable2 = _interopRequireDefault(_ApplicationTable);

var _Config = require('./models/Config.js');

var _Config2 = _interopRequireDefault(_Config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
* indexFunction - Main function that's run, renders config button if user is on TS Your Account Page, otherwise renders vulnerability feed
*
* @return {void}
*/
function indexFunction() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {

    var tab = tabs[0];
    var url = new URL(tab.url);
    (0, _util.getStoredCredentials)().then(function (credentials) {
      var credentialed = (0, _util.isCredentialed)(credentials);
      var config = new _Config2.default(tab, url, credentialed, credentials);
      config.getUserConfiguration();
      if (!credentialed) {
        console.log("Please Configure the Extension");
      } else if (credentialed && config._isTeamserverAccountPage()) {
        var table = new _ApplicationTable2.default(url);
        config.setGearIcon();
        table.renderApplicationsMenu();
        config.renderContrastUsername(credentials);
      } else {
        var _table = new _ApplicationTable2.default(url);
        config.setGearIcon();
        _table.renderActivityFeed();
        config.renderContrastUsername(credentials);
      }
    }).catch(function (error) {
      return new Error(error);
    });
  });
}

/**
* Run when popup loads
*/
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

document.addEventListener('DOMContentLoaded', indexFunction, false);
// document.addEventListener('DOMContentLoaded', showRefreshButton, false);

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