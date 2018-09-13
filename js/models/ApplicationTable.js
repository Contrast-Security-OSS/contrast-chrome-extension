import {
  STORED_APPS_KEY,
  setElementText,
  setElementDisplay,
  // isBlacklisted,
  getOrgApplications,
  getHostFromUrl,
  isContrastTeamserver,
  // changeElementVisibility,
} from '../util.js';

import Application from './Application.js';
import TableRow from './PopupTableRow.js';

export default function ApplicationTable(url) {
  this.table = document.getElementById('application-table');
  this.tableContainer = this.table.parentElement;
  this.url   = url;

  this.rollApplications = this.rollApplications.bind(this);
}

// NOTE: Used to prevent event listeners from being readded
ApplicationTable.listener = {
  attached: false,
  url: "",
};

ApplicationTable.showApps = false;
ApplicationTable.RIGHT_ARROW = `<svg fill="currentColor" preserveAspectRatio="xMidYMid meet" height="22" width="22" class="cs-react-icon css-1ovp8yv e1db9b1o0" viewBox="0 0 1024 1024" style="vertical-align: middle;"><g><path d="M826.2 654.6l-3.6-4.2-272-313c-9.2-10.6-23-17.2-38.4-17.2s-29.2 6.8-38.4 17.2L197.4 655c-3.4 5-5.4 11-5.4 17.4 0 17.4 14.8 31.6 33.2 31.6h573.6c18.4 0 33.2-14.2 33.2-31.6 0-6.6-2.2-12.8-5.8-17.8z"></path></g></svg>`;
ApplicationTable.DOWN_ARROW  = `<svg fill="currentColor" preserveAspectRatio="xMidYMid meet" height="22" width="22" class="cs-react-icon css-1ovp8yv e1db9b1o0" viewBox="0 0 1024 1024" style="vertical-align: middle;"><g><path d="M197.8 369.4l3.6 4.2 272 313c9.2 10.6 23 17.2 38.4 17.2s29.2-6.8 38.4-17.2L826.6 369c3.4-5 5.4-11 5.4-17.4 0-17.4-14.8-31.6-33.2-31.6H225.2c-18.4 0-33.2 14.2-33.2 31.6 0 6.6 2.2 12.8 5.8 17.8z"></path></g></svg>`;

/**
 * renderApplicationsMenu - renders a toggle for showing/hiding the table/menu listing all the applications in an organization
 *
 * @param  {URL<Object>} url a url object of the current tab
 * @return {void}
 */
ApplicationTable.prototype.renderApplicationsMenu = function() {
  console.log("render app menu");

  const tableElements = [
    document.getElementById('applications-heading-container'),
    document.getElementById('application-table-container-div'),
  ];

  const headings = [
    document.getElementById('applications-heading'),
    document.getElementById('applications-arrow'),
  ];

  headings.forEach(el => setElementDisplay(el, 'inline'));
  tableElements.forEach(el => setElementDisplay(el, 'block'));

  const arrow = document.getElementById('applications-arrow');
  if (ApplicationTable.showApps) {
    this._unrollApplications(arrow);
  }

  // NOTE: Used to prevent event listeners from being readded
  if (ApplicationTable.listener.attached
      && ApplicationTable.listener.url === this.url.href) {
        return;
      }
  for (let i = 0, len = headings.length; i < len; i++) {
    headings[i].addEventListener('click', this.rollApplications, false);
  }
  ApplicationTable.listener.attached = true;
  ApplicationTable.listener.url = this.url.href;
}


/**
 * @description - ApplicationTable.prototype.rollApplications - only appears on contrast "Your Account" page. Need a roll of applications due to presence of config button.
 *
 * @return {type}  description
 */
ApplicationTable.prototype.rollApplications = function() {
  ApplicationTable.showApps = !ApplicationTable.showApps;
  const arrow = document.getElementById('applications-arrow');
  if (ApplicationTable.showApps) {
    this._unrollApplications(arrow);
  } else {
    this._rollupApplications(arrow);
  }
}

ApplicationTable.prototype._unrollApplications = function(arrow) {
  arrow.innerHTML = ApplicationTable.DOWN_ARROW;

  // if less than 2 then only the heading row has been rendered
  if (document.getElementsByTagName('tr').length < 2) {
    getOrgApplications()
    .then(json => {
      if (!json) {
        throw new Error("Error getting applications");
      }
      json.applications.forEach(app => this.createAppTableRow(app));
    })
    .catch(error => new Error(error));
  }
  this.tableContainer.classList.remove('collapsed');
}

ApplicationTable.prototype._rollupApplications = function(arrow) {
  arrow.innerHTML = ApplicationTable.RIGHT_ARROW;
  this.tableContainer.classList.add('collapsed');
}

/**
 * renderActivityFeed - logic to render either the vulnerabilities in an app or the list of applications to connect to a domain. A user must connect a domain before the vulnerabilities section will be shown
 *
 * @param  {Object} items - teamserver credentials
 * @param  {URL<Object>} url - URL object of current tab
 * @return {type}
 */
ApplicationTable.prototype.renderActivityFeed = function() {
  // if (isBlacklisted(this.url.host)) {
  //   console.log("blacklisted domain");
  //   return;
  // }
  this.tableContainer.classList.remove('collapsed');

  chrome.storage.local.get(STORED_APPS_KEY, (storedApps) => {
    console.log("storedApps", storedApps);
    const host = getHostFromUrl(this.url);
    // look in stored apps array for app tied to host, if we are a site/domain tied to an app in contrast, render the vulnerabilities for that app
    if (_appIsConfigured(storedApps, host)) {
      console.log("app configured");
      const appTableContainer = document.getElementById('application-table-container-div');
      setElementDisplay(appTableContainer, "none");
      // if you don't need credentials, hide the signin functionality and don't render a table
    } else {
      this._showContrastApplications(storedApps);
    }
  });
}

ApplicationTable.prototype._showContrastApplications = function(storedApps) {
  // transitions on these classes, not a simple display none/table
  // this._changeTableVisibility(true);
  const vulnsSection = document.getElementById("vulnerabilities-section");
  const scanLibsText = document.getElementById('scan-libs-text');
  const appHeading = document.getElementById('applications-heading-container');
  setElementDisplay(vulnsSection, "none");
  setElementDisplay(scanLibsText, "none");
  setElementDisplay(appHeading, "none");

  // NOTE: Ugly but leave for now
  const vulnsHeaderText = document.getElementById('vulns-header-text');
  const vulnsHeader = vulnsHeaderText.parentElement.parentElement;
  setElementDisplay(vulnsHeader.lastElementChild, "none");
  setElementText(vulnsHeaderText, "Connect Applications");
  vulnsHeaderText.style.fontSize = '4.5vw';
  vulnsHeader.style.border = 'none';

  const configuredFooter = document.getElementById('configured-footer');
  configuredFooter.style.border = 'none';

  // if app is not stored, render the table with buttons to add the domain
  getOrgApplications()
  .then(json => {
    if (!json) {
      throw new Error("Error getting applications");
    }
    // console.log("json", json);
    const applications = this._filterApplications(storedApps, json.applications);

    // create a row for each application
    this.createTableRows(applications, storedApps)
  })
  .catch(() => {
    return new Error("Error getting applications");
  });
}

ApplicationTable.prototype.createTableRows = function(applications, storedApps) {
  applications.forEach(app => this.createAppTableRow(app, storedApps));
}

/**
 * @description - Filters an Organization's applications returning only those ones that have NOT been connected to a domain.
 *
 * @param {Array<Application>} storedApps - connected apps in chrome storage
 * @param {Array<Object>} applications    - organization's applications from TS
 * @return {Array<Application>}           - connected applications
 */
ApplicationTable.prototype._filterApplications = function(storedApps, applications) {
  // if there are apps in storage and we aren't on a contrast page, filter apps so that we only show ones that have NOT been connected to a domain
  if (!!storedApps[STORED_APPS_KEY] && !isContrastTeamserver(this.url.href)) {
    const appIds = storedApps[STORED_APPS_KEY].map(app => app.id).flatten();

    // include in applications if it's not in storage
    // return applications.filter(app => !appIds.includes(app.app_id));
    return applications.map(app => {
      app.connectedAlready = appIds.includes(app.app_id);
      return app;
    });
  }
  return applications;
}

/**
 * @description - renders a table row, either with a button if it's not a contrast url, or with a domain (or blank) if it's a contrast url showing in tab
 *
 * @param  {Object} application the contrast application from TS
 * @return {void} - adds rows to a table
 */
ApplicationTable.prototype.createAppTableRow = function(application, appsInStorage) {
  const tr = new TableRow(application, this.url, this.table.tBodies[0]);
  tr.appendChildren();
  // tr.setAppId(application);
  // if the url is not a contrast url then show a collection of app name buttons that will let a user connect an app to a domain
  if (!isContrastTeamserver(this.url.href)) {
    if (application.connectedAlready) {
      const storedApp = Application.getStoredApp(appsInStorage, application);
      setElementText(tr.nameTD, application.name);
      tr.setHost(storedApp.host);
      tr.renderDisconnect(appsInStorage, storedApp);
    } else {
      tr.setHost(getHostFromUrl(this.url));
      tr.createConnectButton();
    }
  } else if (!appsInStorage) {
    // on a contrast page - render the full collection of apps in a user org with respective domains
    chrome.storage.local.get(STORED_APPS_KEY, (storedApps) => {
      if (chrome.runtime.lastError) return;

      // storedApps has not been defined yet
      if (!storedApps || !storedApps[STORED_APPS_KEY]) {
        storedApps = { [STORED_APPS_KEY]: [] }
      }
      const storedApp = Application.getStoredApp(storedApps, application);
      setElementText(tr.nameTD, application.name);

      if (!!storedApp) {
        tr.setHost(storedApp.host);
        tr.renderDisconnect(storedApps, storedApp);
      }
    });
  } else {
    const storedApp = Application.getStoredApp(appsInStorage, application);
    setElementText(tr.nameTD, application.name);

    if (!!storedApp) {
      tr.setHost(storedApp.host);
      tr.renderDisconnect(appsInStorage, storedApp);
    }
  }
}

ApplicationTable.prototype._changeTableVisibility = function() {
  this.table.classList.toggle('collapsed');
  // if (!show) {
  //   this.table.classList.remove(ApplicationTable.TABLE_VISIBLE_CLASS);
  //   this.table.classList.add(ApplicationTable.TABLE_HIDDEN_CLASS);
  // } else {
  //   this.table.classList.add(ApplicationTable.TABLE_VISIBLE_CLASS);
  //   this.table.classList.remove(ApplicationTable.TABLE_HIDDEN_CLASS);
  // }
}

function _appIsConfigured(result, host) {
  return result[STORED_APPS_KEY] && result[STORED_APPS_KEY].filter(app => app[host])[0]
}
