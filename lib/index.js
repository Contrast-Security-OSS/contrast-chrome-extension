"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

exports.indexFunction = indexFunction;

var _util = require("./util.js");

var _Application = require("./models/Application.js");

var _Application2 = _interopRequireDefault(_Application);

var _ApplicationTable = require("./models/ApplicationTable.js");

var _ApplicationTable2 = _interopRequireDefault(_ApplicationTable);

var _Config = require("./models/Config.js");

var _Config2 = _interopRequireDefault(_Config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * indexFunction - Main function that's run, renders config button if user is on TS Organization Settings > API Page, otherwise renders vulnerability feed
 *
 * @return {void}
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

function indexFunction() {
  var _this = this;

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var tab = tabs[0];
    var url = new URL(tab.url);
    (0, _util.getStoredCredentials)().then(function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(credentials) {
        var credentialed, application, config, table, _table;

        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                credentialed = (0, _util.isCredentialed)(credentials);
                _context.next = 3;
                return _Application2.default.retrieveApplicationFromStorage(tab);

              case 3:
                application = _context.sent;

                // if (!application) return;

                config = new _Config2.default(tab, url, credentialed, credentials, !!application);

                config.addListenerToConfigButton();
                config.popupScreen();
                if (!credentialed) {
                  console.log("Please Configure the Extension");
                } else if (credentialed && config._isContrastPage()) {
                  table = new _ApplicationTable2.default(url);

                  table.renderApplicationsMenu();
                  config.setGearIcon();
                  config.renderContrastUsername();
                } else {
                  config.setGearIcon();
                  config.renderContrastUsername();
                  if (!config._isContrastPage()) {
                    _table = new _ApplicationTable2.default(url);

                    _table.renderActivityFeed();
                    if (config.hasApp) {
                      _table.renderApplicationsMenu();
                    }
                  }
                }

              case 8:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, _this);
      }));

      return function (_x) {
        return _ref.apply(this, arguments);
      };
    }()).catch(function (error) {
      return new Error(error);
    });
  });
}

/**
 * Run when popup loads
 */
document.addEventListener("DOMContentLoaded", indexFunction, false);
// document.addEventListener('DOMContentLoaded', showLibrariesButton, false);

// NOTE: SAVE THE BELOW FUNCTIONS FOR LIBRARY VULNS INTEGRATION
// function showLibrariesButton() {
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