'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _showLibraries = require('./libraries/showLibraries.js');

var _Application = require('./models/Application.js');

var _Application2 = _interopRequireDefault(_Application);

var _ApplicationLibrary = require('./libraries/ApplicationLibrary.js');

var _ApplicationLibrary2 = _interopRequireDefault(_ApplicationLibrary);

var _util = require('./util.js');

var _ApplicationTable = require('./models/ApplicationTable.js');

var _ApplicationTable2 = _interopRequireDefault(_ApplicationTable);

var _Config = require('./models/Config.js');

var _Config2 = _interopRequireDefault(_Config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import { Application } from './models/application';

/**
* indexFunction - Main function that's run, renders config button if user is on TS Your Account Page, otherwise renders vulnerability feed
*
* @return {void}
*/
/*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
/*global
chrome,
document,
URL,
*/

function indexFunction() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {

    var tab = tabs[0];
    var url = new URL(tab.url);

    (0, _util.getStoredCredentials)().then(function (credentials) {
      var credentialed = (0, _util.isCredentialed)(credentials);
      var config = new _Config2.default(tab, url, credentialed);
      if (!credentialed) {
        config.getUserConfiguration();
      } else if (credentialed && config._isTeamserverAccountPage()) {
        config.getUserConfiguration();
        // renderApplicationsMenu(url);
        var table = new _ApplicationTable2.default(url);
        table.renderApplicationsMenu();
        config.renderContrastUsername(credentials);
      } else {
        var _table = new _ApplicationTable2.default(url);
        _table.renderActivityFeed();
        config.renderContrastUsername(credentials);
      }
      config.setGearIcon();
    }).catch(function (error) {
      return new Error(error);
    });
  });
}

/**
* Run when popup loads
*/
document.addEventListener('DOMContentLoaded', indexFunction, false);
document.addEventListener('DOMContentLoaded', addButtonTabListeners, false);

// NOTE: Initial Values
var LIBS_ACTIVE = false;
var VULNS_ACTIVE = true;

function addButtonTabListeners() {
  var vulnsTab = document.getElementById('vulns-tab');
  var libsTab = document.getElementById('libs-tab');
  vulnsTab.addEventListener('click', function () {
    if (VULNS_ACTIVE) {
      return;
    }
    LIBS_ACTIVE = false;
    VULNS_ACTIVE = true;
    libsTab.classList.remove('unfocued-but-still-showing');

    var libsSection = document.getElementById('libraries-section');
    var vulnsSection = document.getElementById('vulnerabilities-section');
    vulnsSection.classList.add('visible');
    vulnsSection.classList.remove('hidden');

    libsSection.classList.remove('visible');
    libsSection.classList.add('hidden');

    var libsList = document.getElementById('libs-vulnerabilities-found-on-page-list');
    while (libsList.firstChild) {
      libsList.firstChild.remove();
    }
  });

  libsTab.addEventListener('click', function () {
    if (LIBS_ACTIVE) {
      return;
    }
    VULNS_ACTIVE = false;
    LIBS_ACTIVE = true;
    vulnsTab.classList.remove('unfocued-but-still-showing');

    var libsSection = document.getElementById('libraries-section');
    var vulnsSection = document.getElementById('vulnerabilities-section');
    vulnsSection.classList.remove('visible');
    vulnsSection.classList.add('hidden');

    libsSection.classList.add('visible');
    libsSection.classList.remove('hidden');

    addListenerToRefreshButton();
    (0, _showLibraries.renderVulnerableLibraries)();
  });

  vulnsTab.addEventListener('blur', function () {
    if (VULNS_ACTIVE) {
      vulnsTab.classList.add('unfocued-but-still-showing');
    } else {
      vulnsTab.classList.remove('unfocued-but-still-showing');
    }
  });

  libsTab.addEventListener('blur', function () {
    if (LIBS_ACTIVE) {
      libsTab.classList.add('unfocued-but-still-showing');
    } else {
      libsTab.classList.remove('unfocued-but-still-showing');
    }
  });
}

function addListenerToRefreshButton() {
  var refreshLibsButton = document.getElementById('refresh-libs-btn');
  var loadingElement = document.getElementById('libs-loading');
  refreshLibsButton.addEventListener('click', function () {
    var _this = this;

    _renderLoadingElement(refreshLibsButton, loadingElement);
    chrome.tabs.query({ active: true, currentWindow: true }, function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(tabs) {
        var tab, app, appLib, libs, addedLibs;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!(!tabs || tabs.length === 0)) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt('return');

              case 2:
                tab = tabs[0];
                _context.next = 5;
                return _Application2.default.retrieveApplicationFromStorage(tab);

              case 5:
                app = _context.sent;
                appLib = new _ApplicationLibrary2.default(tab, app);
                _context.next = 9;
                return appLib.getApplicationLibraries();

              case 9:
                libs = _context.sent;

                if (!(!libs || libs.length === 0)) {
                  _context.next = 14;
                  break;
                }

                _renderFoundVulnerableLibraries("No libraries with vulnerabilities found.");
                _hideLoadingElement(refreshLibsButton, loadingElement);
                return _context.abrupt('return');

              case 14:
                _context.next = 16;
                return appLib.addNewApplicationLibraries(libs);

              case 16:
                addedLibs = _context.sent;

                if (addedLibs && addedLibs.length > 0) {
                  (0, _showLibraries.renderVulnerableLibraries)(tab, app);
                  _renderFoundVulnerableLibraries('Found ' + addedLibs.length + ' libraries with vulnerabilities.');
                  _hideLoadingElement(refreshLibsButton, loadingElement);
                } else {
                  _renderFoundVulnerableLibraries("No libraries with vulnerabilities found.");
                  _hideLoadingElement(refreshLibsButton, loadingElement);
                }

              case 18:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, _this);
      }));

      return function (_x) {
        return _ref.apply(this, arguments);
      };
    }());
  });
}

function _renderFoundVulnerableLibraries(message) {
  var libMessage = document.getElementById('found-libs-message');
  libMessage.innerText = message;
  libMessage.classList.add('visible');
  libMessage.classList.remove('hidden');

  setTimeout(function () {
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