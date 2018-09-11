'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

exports.default = ApplicationTable;

var _util = require('../util.js');

var _Application = require('./Application.js');

var _Application2 = _interopRequireDefault(_Application);

var _PopupTableRow = require('./PopupTableRow.js');

var _PopupTableRow2 = _interopRequireDefault(_PopupTableRow);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ApplicationTable(url) {
  this.table = document.getElementById('application-table');
  this.url = url;

  this.rollApplications = this.rollApplications.bind(this);
}

// NOTE: Used to prevent event listeners from being readded
ApplicationTable.listener = {
  attached: false,
  url: ""
};

ApplicationTable.RIGHT_ARROW = ' ▶';
ApplicationTable.DOWN_ARROW = ' ▼';

/**
 * renderApplicationsMenu - renders a toggle for showing/hiding the table/menu listing all the applications in an organization
 *
 * @param  {URL<Object>} url a url object of the current tab
 * @return {void}
 */
ApplicationTable.prototype.renderApplicationsMenu = function () {
  console.log("render app menu");

  var tableElements = [document.getElementById('applications-heading-container'), document.getElementById('application-table-container-div')];

  var headings = [document.getElementById('applications-heading'), document.getElementById('applications-arrow')];

  headings.forEach(function (el) {
    return (0, _util.setElementDisplay)(el, 'inline');
  });
  tableElements.forEach(function (el) {
    return (0, _util.setElementDisplay)(el, 'block');
  });

  var arrow = document.getElementById('applications-arrow');
  if (arrow.innerText.trim() === ApplicationTable.DOWN_ARROW.trim()) {
    this._unrollApplications(arrow);
  }

  for (var i = 0, len = headings.length; i < len; i++) {

    // NOTE: Used to prevent event listeners from being readded
    if (ApplicationTable.listener.attached && ApplicationTable.listener.url === this.url.href) {
      return;
    }

    ApplicationTable.listener.attached = true;
    ApplicationTable.listener.url = this.url.href;
    headings[i].addEventListener('click', this.rollApplications, false);
  }
};

/**
 * @description - ApplicationTable.prototype.rollApplications - only appears on contrast "Your Account" page. Need a roll of applications due to presence of config button.
 *
 * @return {type}  description
 */
ApplicationTable.prototype.rollApplications = function () {
  var arrow = document.getElementById('applications-arrow');
  if (arrow.innerText.trim() === ApplicationTable.RIGHT_ARROW.trim()) {
    this._unrollApplications(arrow);
  } else {
    this._rollupApplications(arrow);
  }
};

ApplicationTable.prototype._unrollApplications = function (arrow) {
  var _this = this;

  (0, _util.setElementText)(arrow, ApplicationTable.DOWN_ARROW);

  // if less than 2 then only the heading row has been rendered
  if (document.getElementsByTagName('tr').length < 2) {
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
  this.table.parentElement.classList.remove('collapsed');
};

ApplicationTable.prototype._rollupApplications = function (arrow) {
  (0, _util.setElementText)(arrow, ApplicationTable.RIGHT_ARROW);
  this.table.parentElement.classList.add('collapsed');
};

/**
 * renderActivityFeed - logic to render either the vulnerabilities in an app or the list of applications to connect to a domain. A user must connect a domain before the vulnerabilities section will be shown
 *
 * @param  {Object} items - teamserver credentials
 * @param  {URL<Object>} url - URL object of current tab
 * @return {type}
 */
ApplicationTable.prototype.renderActivityFeed = function () {
  var _this2 = this;

  // if (isBlacklisted(this.url.host)) {
  //   console.log("blacklisted domain");
  //   return;
  // }

  chrome.storage.local.get(_util.STORED_APPS_KEY, function (storedApps) {
    console.log("storedApps", storedApps);
    var host = (0, _util.getHostFromUrl)(_this2.url);
    // look in stored apps array for app tied to host, if we are a site/domain tied to an app in contrast, render the vulnerabilities for that app
    if (_appIsConfigured(storedApps, host)) {
      console.log("app configured");
      var appTableContainer = document.getElementById('application-table-container-div');
      (0, _util.setElementDisplay)(appTableContainer, "none");
      // if you don't need credentials, hide the signin functionality and don't render a table
    } else {
      _this2._showContrastApplications(storedApps);
    }
  });
};

ApplicationTable.prototype._showContrastApplications = function (storedApps) {
  var _this3 = this;

  // transitions on these classes, not a simple display none/table
  // this._changeTableVisibility(true);
  var vulnsSection = document.getElementById("vulnerabilities-section");
  var scanLibsText = document.getElementById('scan-libs-text');
  var appHeading = document.getElementById('applications-heading-container');
  (0, _util.setElementDisplay)(vulnsSection, "none");
  (0, _util.setElementDisplay)(scanLibsText, "none");
  (0, _util.setElementDisplay)(appHeading, "none");

  var vulnsHeaderText = document.getElementById('vulns-header-text');
  (0, _util.setElementText)(vulnsHeaderText, "Connect an Application");

  // if app is not stored, render the table with buttons to add the domain
  (0, _util.getOrgApplications)().then(function (json) {
    if (!json) {
      throw new Error("Error getting applications");
    }
    var applications = _this3._filterApplications(storedApps, json.applications);

    // create a row for each application
    applications.forEach(function (app) {
      return _this3.createAppTableRow(app);
    });
  }).catch(function () {
    return new Error("Error getting applications");
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
    return applications.filter(function (app) {
      return !appIds.includes(app.app_id);
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
ApplicationTable.prototype.createAppTableRow = function (application) {
  var tr = new _PopupTableRow2.default(application, this.url, this.table.tBodies[0]);
  tr.appendChildren();
  tr.setAppId(application);
  // if the url is not a contrast url then show a collection of app name buttons that will let a user connect an app to a domain
  if (!(0, _util.isContrastTeamserver)(this.url.href)) {
    tr.setHost((0, _util.getHostFromUrl)(this.url));
    tr.createConnectButton();
  } else {
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
  }
};

ApplicationTable.prototype._changeTableVisibility = function () {
  this.table.classList.toggle('collapsed');
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