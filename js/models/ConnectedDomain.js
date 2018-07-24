import {
  STORED_APPS_KEY,
  setElementDisplay,
} from '../util.js'

import Application from './Application.js'

export default function ConnectedDomain(host, application) {
  this.host = host;
  this.application = application;
}

ConnectedDomain.prototype.connectDomain = function() {
  return this._addDomainToStorage();
}

/**
 * _addDomainToStorage - add a domain + app name connection to chrome storage
 *
 * @param  {String} host        the host/domain of the application
 * @param  {String} application the name of the application
 * @return {Promise}            if storing the data succeeded
 */
ConnectedDomain.prototype._addDomainToStorage = function() {
  const { host, application } = this;

  return new Promise((resolve, reject) => {
    chrome.storage.local.get(STORED_APPS_KEY, (result) => {
      if (chrome.storage.lastError) {
        reject(new Error("Error retrieving stored apps"));
      }

      // no applications stored so result[STORED_APPS_KEY] is undefined
      if (!result[STORED_APPS_KEY]) result[STORED_APPS_KEY] = [];
      const app = new Application(host, application);
      const updatedStoredApps = result[STORED_APPS_KEY].concat(app);

      const applicationTable = document.getElementById("application-table");
      chrome.storage.local.set({ [STORED_APPS_KEY]: updatedStoredApps }, () => {
        setElementDisplay(applicationTable, "none");
        resolve(!chrome.storage.lastError);
      });
    });
  });
}


ConnectedDomain.prototype.disconnectDomain = function(storedApps, tableRow) {
  return this._removeDomainFromStorage(storedApps, tableRow)
}

/**
 * _removeDomainFromStorage - removes an application + domain connection from storage
 *
 * @param  {String} host               the host/domain of the application
 * @param  {Array<String>} storedApps  the array of stored apps
 * @param  {String} application        the name of the application to remove
 * @param  {Node} disconnectButton     button user clicks remove an application
 * @return {Promise}                   if the removal succeeded
 */
ConnectedDomain.prototype._removeDomainFromStorage = function(storedApps, tableRow) {
  return new Promise((resolve, reject) => {
    const updatedStoredApps = this._filterOutApp(storedApps);

    chrome.storage.local.set({ [STORED_APPS_KEY]: updatedStoredApps }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError));
      }
      tableRow.removeDomainAndButton();
      resolve(!chrome.runtime.lastError);
    });
  });
}

/**
 * @description ConnectedDomain.prototype._filterOutApp - create a new array of connected apps that does not include the application belonging to this
 *
 * @param  {Array<Application>} storedApps - connected apps in chrome storage
 * @return {Array<Application>}            - filtered apps in chrome storage
 */
ConnectedDomain.prototype._filterOutApp = function(storedApps) {
  return storedApps[STORED_APPS_KEY].filter(app => {
    return app.id !== this.application.id;
  });
}
