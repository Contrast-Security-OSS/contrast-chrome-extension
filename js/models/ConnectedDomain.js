/*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
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
        return reject(new Error("Error retrieving stored apps"));
      }

      // no applications stored so result[STORED_APPS_KEY] is undefined
      if (!result[STORED_APPS_KEY]) result[STORED_APPS_KEY] = [];

      // Verify that the domain of the app to be connected isn't already in use by the extension
      if (!this._verifyDomainNotInUse(result[STORED_APPS_KEY], host)) {
        return reject(new Error(`The Domain ${host} is already in use by another application: ${app.name}. Please either first disconnect that application or run this application on a different domain/port.`));
      }

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

ConnectedDomain.prototype._verifyDomainNotInUse = function(storedApps, host) {
  if (storedApps.length > 0) {
    for (let i = 0, len = storedApps.length; i < len; i++) {
      let app = storedApps[i];
      if (app.domain === host) {
        return false;
      }
    }
  }
  return true;
}


ConnectedDomain.prototype.disconnectDomain = function() {
  return this._removeDomainFromStorage()
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
ConnectedDomain.prototype._removeDomainFromStorage = function() {
  return new Promise((resolve, reject) => {

    chrome.storage.local.get(STORED_APPS_KEY, (result) => {
      const updatedStoredApps = this._filterOutApp(result);

      chrome.storage.local.set({ [STORED_APPS_KEY]: updatedStoredApps }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError));
        }
        resolve(!chrome.runtime.lastError);
      });
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
