'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

exports.indexFunction = indexFunction;

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
document.addEventListener('DOMContentLoaded', indexFunction, false);
document.addEventListener('DOMContentLoaded', showRefreshButton, false);

function showRefreshButton() {
  var _this = this;

  var refreshLibsButton = document.getElementById('scan-libs-text');
  var loadingElement = document.getElementById('libs-loading');

  chrome.tabs.query({ active: true, currentWindow: true }, function () {
    var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(tabs) {
      var tab, app;
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

              if (app) {
                refreshLibsButton.classList.remove('hidden');
                refreshLibsButton.classList.add('visible');

                addListenerToRefreshButton(refreshLibsButton, loadingElement);
              }

            case 7:
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
}

function addListenerToRefreshButton(refreshLibsButton, loadingElement) {
  refreshLibsButton.addEventListener('click', function () {
    var _this2 = this;

    _renderLoadingElement(loadingElement);
    chrome.tabs.query({ active: true, currentWindow: true }, function () {
      var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(tabs) {
        var tab, app, appLib, libs, addedLibs;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!(!tabs || tabs.length === 0)) {
                  _context2.next = 2;
                  break;
                }

                return _context2.abrupt('return');

              case 2:
                tab = tabs[0];
                _context2.next = 5;
                return _Application2.default.retrieveApplicationFromStorage(tab);

              case 5:
                app = _context2.sent;
                appLib = new _ApplicationLibrary2.default(tab, app);
                _context2.prev = 7;
                _context2.next = 10;
                return appLib.getApplicationLibraries();

              case 10:
                libs = _context2.sent;

                if (!(!libs || libs.length === 0)) {
                  _context2.next = 15;
                  break;
                }

                _renderFoundVulnerableLibraries("No libraries with vulnerabilities found.");
                _hideLoadingElement(loadingElement);
                return _context2.abrupt('return');

              case 15:
                _context2.next = 17;
                return appLib.addNewApplicationLibraries(libs);

              case 17:
                addedLibs = _context2.sent;

                if (addedLibs && addedLibs.length > 0) {
                  (0, _showLibraries.renderVulnerableLibraries)(tab, app);
                  _renderFoundVulnerableLibraries('Found ' + addedLibs.length + ' libraries with vulnerabilities.');
                  _hideLoadingElement(loadingElement);
                } else {
                  _renderFoundVulnerableLibraries("No libraries with vulnerabilities found.");
                  _hideLoadingElement(loadingElement);
                }
                _context2.next = 25;
                break;

              case 21:
                _context2.prev = 21;
                _context2.t0 = _context2['catch'](7);

                _renderFoundVulnerableLibraries("Error collecting libraries.");
                _hideLoadingElement(loadingElement);

              case 25:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, _this2, [[7, 21]]);
      }));

      return function (_x2) {
        return _ref2.apply(this, arguments);
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

function _hideLoadingElement(loadingElement) {
  loadingElement.style.visibility = 'hidden';
  // setElementDisplay(loadingElement, 'none');
}

function _renderLoadingElement(loadingElement) {
  loadingElement.style.visibility = 'visible';
  // setElementDisplay(loadingElement, 'inline');
}