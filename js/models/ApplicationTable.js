import {
  STORED_APPS_KEY,
  setElementText,
  setElementDisplay,
  getStoredApp,
  isBlacklisted,
  getApplications,
  getHostFromUrl,
  isContrastTeamserver,
} from '../util.js'

import TableRow from './PopupTableRow.js'

export default function ApplicationTable(url) {
  this.table = document.getElementById('application-table');
  this.url = url;
}

ApplicationTable.TABLE_VISIBLE_CLASS = 'application-table-visible';
ApplicationTable.TABLE_HIDDEN_CLASS  = 'application-table-hidden';

/**
 * renderApplicationsMenu - renders a toggle for showing/hiding the table/menu listing all the applications in an organization
 *
 * @param  {URL<Object>} url a url object of the current tab
 * @return {void}
 */
ApplicationTable.prototype.renderApplicationsMenu = function() {
  const headings = {
    heading: document.getElementById('applications-heading'),
    container: document.getElementById('applications-heading-container')
  }

  setElementDisplay(headings.container, "block");

  for (let key in headings) {
    headings[key].addEventListener('click', () => {
      this.rollApplications(applicationTable);
    });
  }
}

// only appears on contrast "Your Account" page.
// Need a roll of applications due to presence of config button
ApplicationTable.prototype.rollApplications = function(applicationTable) {
  const applicationsArrow = document.getElementById('applications-arrow');
  if (applicationsArrow.innerText === ' ▶') {
    this._unrollApplications(applicationsArrow);
  } else {
    this._rollupApplications(applicationsArrow);
  }
}

ApplicationTable.prototype._unrollApplications = function(applicationTable) {
  setElementText(applicationsArrow, ' ▼');
  this._changeTableVisibility(true);

  // if less than 2 then only the heading row has been rendered
  if (document.getElementsByTagName('tr').length < 2) {
    getApplications()
    .then(json => {
      if (!json) {
        throw new Error("Error getting applications");
      }
      json.applications.forEach(app => this.createAppTableRow(app));
    })
    .catch(error => new Error(error));
  }
}

ApplicationTable.prototype._rollupApplications = function(arrow) {
  this._changeTableVisibility(false);
  setElementText(arrow, ' ▶');
}

/**
 * renderActivityFeed - logic to render either the vulnerabilities in an app or the list of applications to connect to a domain. A user must connect a domain before the vulnerabilities section will be shown
 *
 * @param  {Object} items - teamserver credentials
 * @param  {URL<Object>} url - URL object of current tab
 * @return {type}
 */
ApplicationTable.prototype.renderActivityFeed = function() {
  if (isBlacklisted(this.url.host)) return;

  chrome.storage.local.get(STORED_APPS_KEY, (storedApps) => {
    const host = getHostFromUrl(this.url);
    // look in stored apps array for app tied to host, if we are a site/domain tied to an app in contrast, render the vulnerabilities for that app
    if (_appIsConfigured(storedApps, host)) {
      // if you don't need credentials, hide the signin functionality and don't render a table
      _hideConfigurationElements();
    } else {
      this._showContrastApplications(storedApps);
    }
  });
}

ApplicationTable.prototype._showContrastApplications = function(storedApps) {
  // transitions on these classes, not a simple display none/table
  this._changeTableVisibility(true);

  const vulnsFound = document.getElementById("vulnerabilities-found-on-page");
  setElementDisplay(vulnsFound, "none");

  // if app is not stored, render the table with buttons to add the domain
  getApplications()
  .then(json => {
    if (!json) {
      throw new Error("Error getting applications");
    }
    const applications = this._filterApplications(storedApps, json.applications);

    // create a row for each application
    applications.forEach(app => this.createAppTableRow(app));
  })
  .catch(error => {
    console.log(error);
    throw new Error("Error getting applications");
  });
}

ApplicationTable.prototype._filterApplications = function(storedApps, applications) {
  // if there are apps in storage and we aren't on a contrast page, filter apps so that we only show ones that have NOT been connected to a domain
  if (!!storedApps[STORED_APPS_KEY] && !isContrastTeamserver(this.url.href)) {
    const appIds = storedApps[STORED_APPS_KEY].map(Object.values).flatten();

    // include in applications if it's not in storage
    return applications.filter(app => !appIds.includes(app.app_id));
  }
  return applications;
}

/**
 * createAppTableRow - renders a table row, either with a button if it's not a contrast url, or with a domain (or blank) if it's a contrast url showing in tab
 *
 * @param  {Object} application the contrast application
 * @param  {Object} url         the URL() of the current tab
 * @return {void} - adds rows to a table
 */
ApplicationTable.prototype.createAppTableRow = function(application) {
  const tr = new TableRow(application, this.url, this.table.tBodies[0]);
  tr.appendChildren();
  tr.setAppId(application);
  this._changeTableVisibility(true);
  // if the url is not a contrast url then show a collection of app name buttons that will let a user connect an app to a domain
  if (!isContrastTeamserver(this.url.href)) {
    tr.setHost(getHostFromUrl(this.url));
    tr.createConnectButton();
  } else {
    // on a contrast page - render the full collection of apps in a user org with respective domains
    chrome.storage.local.get(STORED_APPS_KEY, (storedApps) => {
      if (chrome.runtime.lastError) return;

      // storedApps has not been defined yet
      if (!storedApps || !storedApps[STORED_APPS_KEY]) {
        storedApps = { [STORED_APPS_KEY]: [] }
      }
      const storedApp = getStoredApp(storedApps, application);

      setElementText(tr.nameTD, application.name);

      if (!!storedApp) {
        tr.setHost(Object.keys(storedApp)[0]);
        tr.renderDisconnect(storedApps, storedApp);
      }
    });
  }
}

ApplicationTable.prototype._changeTableVisibility = function(show) {
  if (!show) {
    this.table.classList.remove(ApplicationTable.TABLE_VISIBLE_CLASS);
    this.table.classList.add(ApplicationTable.TABLE_HIDDEN_CLASS);
  } else {
    this.table.classList.add(ApplicationTable.TABLE_VISIBLE_CLASS);
    this.table.classList.remove(ApplicationTable.TABLE_HIDDEN_CLASS);
  }
}

function _appIsConfigured(result, host) {
  return result[STORED_APPS_KEY] && result[STORED_APPS_KEY].filter(app => app[host])[0]
}

function _hideConfigurationElements() {
  const elements = [
    document.getElementById('not-configured'),
    document.getElementById('configure-extension'),
  ]

  elements.forEach(el => setElementDisplay(el, "none"));
}
