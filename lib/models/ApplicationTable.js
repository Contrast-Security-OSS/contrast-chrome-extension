"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _defineProperty2 = require("babel-runtime/helpers/defineProperty");

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

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

  this.rollApplications = this.rollApplications.bind(this);
}

// NOTE: Used to prevent event listeners from being readded
ApplicationTable.listener = {
  attached: false,
  url: ""
};

ApplicationTable.showApps = false;
ApplicationTable.RIGHT_ARROW = "<svg fill=\"currentColor\" preserveAspectRatio=\"xMidYMid meet\" height=\"22\" width=\"22\" class=\"cs-react-icon css-1ovp8yv e1db9b1o0\" viewBox=\"0 0 1024 1024\" style=\"vertical-align: middle;\"><g><path d=\"M826.2 654.6l-3.6-4.2-272-313c-9.2-10.6-23-17.2-38.4-17.2s-29.2 6.8-38.4 17.2L197.4 655c-3.4 5-5.4 11-5.4 17.4 0 17.4 14.8 31.6 33.2 31.6h573.6c18.4 0 33.2-14.2 33.2-31.6 0-6.6-2.2-12.8-5.8-17.8z\"></path></g></svg>";
ApplicationTable.DOWN_ARROW = "<svg fill=\"currentColor\" preserveAspectRatio=\"xMidYMid meet\" height=\"22\" width=\"22\" class=\"cs-react-icon css-1ovp8yv e1db9b1o0\" viewBox=\"0 0 1024 1024\" style=\"vertical-align: middle;\"><g><path d=\"M197.8 369.4l3.6 4.2 272 313c9.2 10.6 23 17.2 38.4 17.2s29.2-6.8 38.4-17.2L826.6 369c3.4-5 5.4-11 5.4-17.4 0-17.4-14.8-31.6-33.2-31.6H225.2c-18.4 0-33.2 14.2-33.2 31.6 0 6.6 2.2 12.8 5.8 17.8z\"></path></g></svg>";

/**
 * renderApplicationsMenu - renders a toggle for showing/hiding the table/menu listing all the applications in an organization
 *
 * @param  {URL<Object>} url a url object of the current tab
 * @return {void}
 */
ApplicationTable.prototype.renderApplicationsMenu = function () {
  var _this = this;

  if (document.getElementsByTagName("tr").length < 2) {
    (0, _util.getOrgApplications)().then(function (json) {
      if (!json) {
        throw new Error("Error getting applications");
      }
      json.applications.forEach(function (app) {
        return _this.createAppTableRow(app);
      });
    }).catch(function (error) {
      return new Error(error);
    });
  }
};

/**
 * @description - ApplicationTable.prototype.rollApplications - only appears on contrast "Organization Settings > API" page. Need a roll of applications due to presence of config button.
 *
 * @return {type}  description
 */
ApplicationTable.prototype.rollApplications = function () {
  ApplicationTable.showApps = !ApplicationTable.showApps;
  var arrow = document.getElementById("applications-arrow");
  if (ApplicationTable.showApps) {
    this._unrollApplications(arrow);
  } else {
    this._rollupApplications(arrow);
  }
};

ApplicationTable.prototype._unrollApplications = function (arrow) {
  var _this2 = this;

  arrow.innerHTML = ApplicationTable.DOWN_ARROW;

  // if less than 2 then only the heading row has been rendered
  if (document.getElementsByTagName("tr").length < 2) {
    (0, _util.getOrgApplications)().then(function (json) {
      if (!json) {
        throw new Error("Error getting applications");
      }
      json.applications.forEach(function (app) {
        return _this2.createAppTableRow(app);
      });
    }).catch(function (error) {
      return new Error(error);
    });
  }
  this.tableContainer.classList.remove("collapsed");
};

ApplicationTable.prototype._rollupApplications = function (arrow) {
  arrow.innerHTML = ApplicationTable.RIGHT_ARROW;
  this.tableContainer.classList.add("collapsed");
};

/**
 * renderActivityFeed - logic to render either the vulnerabilities in an app or the list of applications to connect to a domain. A user must connect a domain before the vulnerabilities section will be shown
 *
 * @param  {Object} items - teamserver credentials
 * @param  {URL<Object>} url - URL object of current tab
 * @return {type}
 */
ApplicationTable.prototype.renderActivityFeed = function () {
  var _this3 = this;

  // if (isBlacklisted(this.url.host)) {
  //   console.log("blacklisted domain");
  //   return;
  // }
  this.tableContainer.classList.remove("collapsed");

  chrome.storage.local.get(_util.STORED_APPS_KEY, function (storedApps) {
    var host = (0, _util.getHostFromUrl)(_this3.url);
    // look in stored apps array for app tied to host, if we are a site/domain tied to an app in contrast, render the vulnerabilities for that app
    if (_appIsConfigured(storedApps, host)) {
      var appTableContainer = document.getElementById("application-table-container-section");
      (0, _util.setElementDisplay)(appTableContainer, "none");
      // if you don't need credentials, hide the signin functionality and don't render a table
    } else {
      _this3._showContrastApplications(storedApps);
    }
  });
};

ApplicationTable.prototype._showContrastApplications = function (storedApps) {
  var _this4 = this;

  // transitions on these classes, not a simple display none/table
  // this._changeTableVisibility(true);
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
    if (!json) {
      throw new Error("Error getting applications");
    }
    var applications = _this4._filterApplications(storedApps, json.applications);

    // create a row for each application
    _this4.createTableRows(applications, storedApps);
  }).catch(function () {
    return new Error("Error getting applications");
  });
};

ApplicationTable.prototype.createTableRows = function (applications, storedApps) {
  var _this5 = this;

  applications.forEach(function (app) {
    return _this5.createAppTableRow(app, storedApps);
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
  if (!!storedApps[_util.STORED_APPS_KEY] && !(0, _util.isContrastTeamserver)(this.url.href)) {
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

ApplicationTable.prototype._changeTableVisibility = function () {
  this.table.classList.toggle("collapsed");
  // if (!show) {
  //   this.table.classList.remove(ApplicationTable.TABLE_VISIBLE_CLASS);
  //   this.table.classList.add(ApplicationTable.TABLE_HIDDEN_CLASS);
  // } else {
  //   this.table.classList.add(ApplicationTable.TABLE_VISIBLE_CLASS);
  //   this.table.classList.remove(ApplicationTable.TABLE_HIDDEN_CLASS);
  // }
};

function _appIsConfigured(result, host) {
  return result[_util.STORED_APPS_KEY] && result[_util.STORED_APPS_KEY].filter(function (app) {
    return app[host];
  })[0];
}