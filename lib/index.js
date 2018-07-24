'use strict';

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
/*global
  chrome,
  document,
  URL,
*/
document.addEventListener('DOMContentLoaded', indexFunction, false);