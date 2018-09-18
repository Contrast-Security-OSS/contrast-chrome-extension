"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _defineProperty2 = require("babel-runtime/helpers/defineProperty");

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

exports.default = ApplicationTable;

var _util = require("../util.js");

var _Application = require("./Application.js");

var _Application2 = _interopRequireDefault(_Application);

var _PopupTableRow = require("./PopupTableRow.js");

var _PopupTableRow2 = _interopRequireDefault(_PopupTableRow);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ApplicationTable(url) {
  this.table = document.getElementById("application-table");
  this.tableContainer = this.table.parentElement;
  this.url = url;
}

/**
 * renderApplicationsMenu - renders a toggle for showing/hiding the table/menu listing all the applications in an organization
 *
 * @param  {URL<Object>} url a url object of the current tab
 * @return {void}
 */
ApplicationTable.prototype.renderApplicationsMenu = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
  var _this = this;

  var json, storedApps, applications;
  return _regenerator2.default.wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (!(document.getElementsByTagName("tr").length < 2)) {
            _context.next = 12;
            break;
          }

          _context.next = 3;
          return (0, _util.getOrgApplications)();

        case 3:
          json = _context.sent;

          if (!(!json || json instanceof Error)) {
            _context.next = 7;
            break;
          }

          renderFailureMessage("Error Getting Applications. Make sure your credentials are correct.");
          return _context.abrupt("return");

        case 7:
          _context.next = 9;
          return this._getStoredApplications();

        case 9:
          storedApps = _context.sent;
          applications = this._filterApplications(storedApps, json.applications);

          if (storedApps) {
            applications.forEach(function (app) {
              return _this.createAppTableRow(app, storedApps);
            });
          }

        case 12:
        case "end":
          return _context.stop();
      }
    }
  }, _callee, this);
}));

/**
 * renderActivityFeed - logic to render either the vulnerabilities in an app or the list of applications to connect to a domain. A user must connect a domain before the vulnerabilities section will be shown
 *
 * @param  {Object} items - teamserver credentials
 * @param  {URL<Object>} url - URL object of current tab
 * @return {type}
 */
ApplicationTable.prototype.renderActivityFeed = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
  var storedApps, host, appTableContainer;
  return _regenerator2.default.wrap(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          // if (isBlacklisted(this.url.host)) {
          //   return;
          // }
          this.tableContainer.classList.remove("collapsed");

          _context2.next = 3;
          return this._getStoredApplications();

        case 3:
          storedApps = _context2.sent;

          if (storedApps) {
            host = (0, _util.getHostFromUrl)(this.url);
            // look in stored apps array for app tied to host, if we are a site/domain tied to an app in contrast, render the vulnerabilities for that app

            if (_appIsConfigured(storedApps, host)) {
              appTableContainer = document.getElementById("application-table-container-section");

              (0, _util.setElementDisplay)(appTableContainer, "none");
              // if you don't need credentials, hide the signin functionality and don't render a table
            } else {
              this._showContrastApplications(storedApps);
            }
          }

        case 5:
        case "end":
          return _context2.stop();
      }
    }
  }, _callee2, this);
}));

ApplicationTable.prototype._getStoredApplications = function () {
  return new _promise2.default(function (resolve) {
    chrome.storage.local.get(_util.STORED_APPS_KEY, function (storedApps) {
      if (!chrome.runtime.lastError) {
        return resolve(storedApps);
      }
      return resolve(null);
    });
  });
};

ApplicationTable.prototype._showContrastApplications = function (storedApps) {
  var _this2 = this;

  var vulnsSection = document.getElementById("vulnerabilities-section");
  // const scanLibsText = document.getElementById('scan-libs-text');
  (0, _util.setElementDisplay)(vulnsSection, "none");
  // setElementDisplay(scanLibsText, "none");

  // NOTE: Ugly but leave for now
  var vulnsHeaderText = document.getElementById("vulns-header-text");
  var vulnsHeader = vulnsHeaderText.parentElement.parentElement;
  // setElementDisplay(vulnsHeader.lastElementChild, "none");
  (0, _util.setElementText)(vulnsHeaderText, "Connect Applications");
  vulnsHeaderText.style.fontSize = "4.5vw";
  vulnsHeader.style.border = "none";

  var configuredFooter = document.getElementById("configured-footer");
  configuredFooter.style.border = "none";

  // if app is not stored, render the table with buttons to add the domain
  (0, _util.getOrgApplications)().then(function (json) {
    if (!json || json instanceof Error) {
      renderFailureMessage("Error Getting Applications. Make sure your credentials are correct.", 5000);
      return;
    }
    var applications = _this2._filterApplications(storedApps, json.applications);

    // create a row for each application
    _this2.createTableRows(applications, storedApps);
  }).catch(function () {
    renderFailureMessage("Error Getting Applications. Make sure your credentials are correct.", 5000);
  });
};

ApplicationTable.prototype.createTableRows = function (applications, storedApps) {
  var _this3 = this;

  applications.forEach(function (app) {
    return _this3.createAppTableRow(app, storedApps);
  });
};

/**
 * @description - Filters an Organization's applications returning only those ones that have NOT been connected to a domain.
 *
 * @param {Array<Application>} storedApps - connected apps in chrome storage
 * @param {Array<Object>} applications    - organization's applications from TS
 * @return {Array<Application>}           - connected applications
 */
ApplicationTable.prototype._filterApplications = function (storedApps, applications) {
  // if there are apps in storage and we aren't on a contrast page, filter apps so that we only show ones that have NOT been connected to a domain
  if (storedApps[_util.STORED_APPS_KEY] && !(0, _util.isContrastTeamserver)(this.url.href)) {
    var appIds = storedApps[_util.STORED_APPS_KEY].map(function (app) {
      return app.id;
    }).flatten();

    // include in applications if it's not in storage
    // return applications.filter(app => !appIds.includes(app.app_id));
    return applications.map(function (app) {
      app.connectedAlready = appIds.includes(app.app_id);
      return app;
    });
  }
  return applications;
};

/**
 * @description - renders a table row, either with a button if it's not a contrast url, or with a domain (or blank) if it's a contrast url showing in tab
 *
 * @param  {Object} application the contrast application from TS
 * @return {void} - adds rows to a table
 */
ApplicationTable.prototype.createAppTableRow = function (application, appsInStorage) {
  if (!application || !application.name) return;

  var tr = new _PopupTableRow2.default(application, this.url, this.table.tBodies[0]);
  tr.appendChildren();
  // tr.setAppId(application);
  // if the url is not a contrast url then show a collection of app name buttons that will let a user connect an app to a domain
  if (!(0, _util.isContrastTeamserver)(this.url.href)) {
    if (application.connectedAlready) {
      var storedApp = _Application2.default.getStoredApp(appsInStorage, application);
      (0, _util.setElementText)(tr.nameTD, application.name);
      tr.setHost(storedApp.host);
      tr.renderDisconnect(appsInStorage, storedApp);
    } else {
      tr.setHost((0, _util.getHostFromUrl)(this.url));
      tr.createConnectButton();
    }
  } else if (!appsInStorage) {
    // on a contrast page - render the full collection of apps in a user org with respective domains
    chrome.storage.local.get(_util.STORED_APPS_KEY, function (storedApps) {
      if (chrome.runtime.lastError) return;

      // storedApps has not been defined yet
      if (!storedApps || !storedApps[_util.STORED_APPS_KEY]) {
        storedApps = (0, _defineProperty3.default)({}, _util.STORED_APPS_KEY, []);
      }
      var storedApp = _Application2.default.getStoredApp(storedApps, application);
      (0, _util.setElementText)(tr.nameTD, application.name);

      if (!!storedApp) {
        tr.setHost(storedApp.host);
        tr.renderDisconnect(storedApps, storedApp);
      }
    });
  } else {
    var _storedApp = _Application2.default.getStoredApp(appsInStorage, application);
    (0, _util.setElementText)(tr.nameTD, application.name);

    if (!!_storedApp) {
      tr.setHost(_storedApp.host);
      tr.renderDisconnect(appsInStorage, _storedApp);
    }
  }
};

function _appIsConfigured(result, host) {
  return result[_util.STORED_APPS_KEY] && result[_util.STORED_APPS_KEY].filter(function (app) {
    return app[host];
  })[0];
}

function renderFailureMessage(message, timeout) {
  var configButton = document.getElementById("configure-extension-button");
  var failure = document.getElementById("config-failure");
  var failureMessage = document.getElementById("config-failure-message");
  if (message) (0, _util.setElementText)(failureMessage, message.toString());
  (0, _util.changeElementVisibility)(failure);
  (0, _util.setElementDisplay)(configButton, "none");
  (0, _util.hideElementAfterTimeout)(failure, function () {
    configButton.removeAttribute("disabled");
    (0, _util.setElementDisplay)(configButton, "block");
  }, timeout);
}