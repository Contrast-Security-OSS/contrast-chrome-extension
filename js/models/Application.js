import {
  STORED_APPS_KEY,
  CONTRAST_CONFIGURE_TEXT,
  CONTRAST_YELLOW,
  CONTRAST_GREEN,
  setElementText,
  setElementDisplay,
  getOrgApplications,
  getHostFromUrl,
  isBlacklisted,
  updateTabBadge,
} from '../util.js'

export default function Application(host, teamserverApplication) {
  this[host]  = teamserverApplication.app_id;
  this.id     = teamserverApplication.app_id;
  this.name   = teamserverApplication.name;
  this.domain = host;
  this.host   = host;
}

/**
* retrieveApplicationFromStorage - get the name of an application from storage by using those host/domain name of the current tab url
*
* @param  {Object} tab           - the active tab in the active window
* @return {Promise<Application>} - a connected application
*/
Application.retrieveApplicationFromStorage = function(tab) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(STORED_APPS_KEY, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error("Error retrieving stored applications"));
      }

      if (!result || !result[STORED_APPS_KEY]) {
        result = { APPS: [] };
      }

      const url  = new URL(tab.url);
      const host = getHostFromUrl(url);

      const application = result[STORED_APPS_KEY].filter(app => {
        return app.host === host;
      })[0];
      // application = result[STORED_APPS_KEY].filter(app => app[host])[0];

      if (!application) {
        if (!isBlacklisted(tab.url) && !chrome.runtime.lastError) {
          try {
            updateTabBadge(tab, CONTRAST_CONFIGURE_TEXT, CONTRAST_YELLOW);
          } catch (e) {
            console.log(e);
            reject(new Error("Error updating tab badge"))
          }
        } else if (isBlacklisted(tab.url) && !chrome.runtime.lastError) {
          try {
            updateTabBadge(tab, '', CONTRAST_GREEN);
          } catch (e) {
            reject(new Error("Error updating tab badge"))
          }
        }
        resolve(null);
      } else {
        resolve(application);
      }
    });
  });
}


/**
 * @description - filters an array of storedapps to get a single application
 *
 * @param  {Array<Application>} storedApps - connected apps in chrome storage
 * @param  {Object} application            - an application from an Org
 * @return {Array<Application>}            - array of 1 connected app
 */
Application.getStoredApp = function(storedApps, application) {
  if (!application) throw new Error("application must be defined");
  return storedApps[STORED_APPS_KEY].filter(app => {
    console.log("app", app, application);
    return app.id === application.app_id;
  })[0];
}

/**
 * @description - can't use a colon in app name (because objects), sub colon for an underscore. Needed when dealing with ports in app name like localhost:8080
 *
 * @param  {Application} storedApp - the connected application
 * @return {String}                - app domain with colon swapped in/out
 */
Application.subDomainColonForUnderscore = function(storedApp) {
  let domain;
  if (typeof storedApp === "object") {
    domain = Object.keys(storedApp)[0];
  } else { // storedApp is a string
    domain = storedApp;
  }
  return this._subColonOrUnderscore(domain);
}

/**
 * @description - Replaces all colons with underscores or all underscores with colons
 *
 * @param  {String} string - the string to replace the characters on
 * @return {String}        - a string with characters replaced
 */
Application._subColonOrUnderscore = function(string) {
  if (string.includes("_")) {
    return string.split("_").join(":"); // local dev stuff
  } else if (string.includes(":")) {
    return string.split(":").join("_"); // local dev stuff
  }
  return string;
}

/**
 * _setCurrentApplication - description
 *
 * @param  {Object} application application to set as the CURRENT_APPLICATION
 * @return {Object}           	the new CURRENT_APPLICATION
 */
Application.setCurrentApplication = function(application) {
	window.CURRENT_APPLICATION = application;
	return application;
}
