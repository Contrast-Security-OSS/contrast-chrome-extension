import {
  STORED_APPS_KEY,
  setElementText,
  setElementDisplay,
  changeElementVisibility,
  getOrgApplications,
  getHostFromUrl,
  isContrastTeamserver,
  hideElementAfterTimeout
} from "../util.js";

import Application from "./Application.js";
import TableRow from "./PopupTableRow.js";

export default function ApplicationTable(url) {
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
ApplicationTable.prototype.renderApplicationsMenu = async function() {
  if (document.getElementsByTagName("tr").length < 2) {
    const json = await getOrgApplications();
    if (!json || json instanceof Error) {
      renderFailureMessage(
        "Error Getting Applications. Make sure your credentials are correct."
      );
      return;
    }
    const storedApps = await this._getStoredApplications();
    const applications = this._filterApplications(
      storedApps,
      json.applications
    );
    if (storedApps) {
      applications.forEach(app => this.createAppTableRow(app, storedApps));
    }
  }
};

/**
 * renderActivityFeed - logic to render either the vulnerabilities in an app or the list of applications to connect to a domain. A user must connect a domain before the vulnerabilities section will be shown
 *
 * @param  {Object} items - teamserver credentials
 * @param  {URL<Object>} url - URL object of current tab
 * @return {type}
 */
ApplicationTable.prototype.renderActivityFeed = async function() {
  // if (isBlacklisted(this.url.host)) {
  //   return;
  // }
  this.tableContainer.classList.remove("collapsed");

  const storedApps = await this._getStoredApplications();
  if (storedApps) {
    const host = getHostFromUrl(this.url);
    // look in stored apps array for app tied to host, if we are a site/domain tied to an app in contrast, render the vulnerabilities for that app
    if (_appIsConfigured(storedApps, host)) {
      const appTableContainer = document.getElementById(
        "application-table-container-section"
      );
      setElementDisplay(appTableContainer, "none");
      // if you don't need credentials, hide the signin functionality and don't render a table
    } else {
      this._showContrastApplications(storedApps);
    }
  }
};

ApplicationTable.prototype._getStoredApplications = function() {
  return new Promise(resolve => {
    chrome.storage.local.get(STORED_APPS_KEY, storedApps => {
      if (!chrome.runtime.lastError) {
        return resolve(storedApps);
      }
      return resolve(null);
    });
  });
};

ApplicationTable.prototype._showContrastApplications = function(storedApps) {
  const vulnsSection = document.getElementById("vulnerabilities-section");
  // const scanLibsText = document.getElementById('scan-libs-text');
  setElementDisplay(vulnsSection, "none");
  // setElementDisplay(scanLibsText, "none");

  // NOTE: Ugly but leave for now
  const vulnsHeaderText = document.getElementById("vulns-header-text");
  const vulnsHeader = vulnsHeaderText.parentElement.parentElement;
  // setElementDisplay(vulnsHeader.lastElementChild, "none");
  setElementText(vulnsHeaderText, "Connect Applications");
  vulnsHeaderText.style.fontSize = "4.5vw";
  vulnsHeader.style.border = "none";

  const configuredFooter = document.getElementById("configured-footer");
  configuredFooter.style.border = "none";

  // if app is not stored, render the table with buttons to add the domain
  getOrgApplications()
    .then(json => {
      if (!json || json instanceof Error) {
        renderFailureMessage(
          "Error Getting Applications. Make sure your credentials are correct.",
          5000
        );
        return;
      }
      const applications = this._filterApplications(
        storedApps,
        json.applications
      );

      // create a row for each application
      this.createTableRows(applications, storedApps);
    })
    .catch(() => {
      renderFailureMessage(
        "Error Getting Applications. Make sure your credentials are correct.",
        5000
      );
    });
};

ApplicationTable.prototype.createTableRows = function(
  applications,
  storedApps
) {
  applications.forEach(app => this.createAppTableRow(app, storedApps));
};

/**
 * @description - Filters an Organization's applications returning only those ones that have NOT been connected to a domain.
 *
 * @param {Array<Application>} storedApps - connected apps in chrome storage
 * @param {Array<Object>} applications    - organization's applications from TS
 * @return {Array<Application>}           - connected applications
 */
ApplicationTable.prototype._filterApplications = function(
  storedApps,
  applications
) {
  // if there are apps in storage and we aren't on a contrast page, filter apps so that we only show ones that have NOT been connected to a domain
  if (storedApps[STORED_APPS_KEY] && !isContrastTeamserver(this.url.href)) {
    const appIds = storedApps[STORED_APPS_KEY].map(app => app.id).flatten();

    // include in applications if it's not in storage
    // return applications.filter(app => !appIds.includes(app.app_id));
    return applications.map(app => {
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
ApplicationTable.prototype.createAppTableRow = function(
  application,
  appsInStorage
) {
  if (!application || !application.name) return;

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
    chrome.storage.local.get(STORED_APPS_KEY, storedApps => {
      if (chrome.runtime.lastError) return;

      // storedApps has not been defined yet
      if (!storedApps || !storedApps[STORED_APPS_KEY]) {
        storedApps = { [STORED_APPS_KEY]: [] };
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
};

function _appIsConfigured(result, host) {
  return (
    result[STORED_APPS_KEY] &&
    result[STORED_APPS_KEY].filter(app => app[host])[0]
  );
}

function renderFailureMessage(message, timeout) {
  const configButton = document.getElementById("configure-extension-button");
  const failure = document.getElementById("config-failure");
  const failureMessage = document.getElementById("config-failure-message");
  if (message) setElementText(failureMessage, message.toString());
  changeElementVisibility(failure);
  setElementDisplay(configButton, "none");
  hideElementAfterTimeout(
    failure,
    () => {
      configButton.removeAttribute("disabled");
      setElementDisplay(configButton, "block");
    },
    timeout
  );
}
