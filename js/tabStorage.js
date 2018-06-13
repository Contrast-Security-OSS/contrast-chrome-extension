/*global
	chrome,
	Helpers,
*/

const {
  retrieveApplicationFromStorage,
  CONTRAST__STORED_APP_LIBS,
} = Helpers;

import {
  getApplicationLibraries,
} from './libraries.js'

export function setupApplicationLibraries(application, tab) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(CONTRAST__STORED_APP_LIBS, (result) => {
      console.log("chrome storage get CONTRAST__STORED_APP_LIBS first", result);
      // no applications have been setup, first time method has been called
      if (!result || Object.keys(result).length === 0) {
        result = { [CONTRAST__STORED_APP_LIBS]: {} };
      }

      console.log("setupApplicationLibraries() result from get", result);

      const storedAppLibsId = "APP_LIBS__ID_" + Object.keys(application)[0];

      if (!result[CONTRAST__STORED_APP_LIBS][storedAppLibsId]) {
        console.log("adding app libs");
        _addAppLibsToStorage(tab, result, resolve, reject, storedAppLibsId, application);
      }

      else if (result[CONTRAST__STORED_APP_LIBS][storedAppLibsId].application && result[CONTRAST__STORED_APP_LIBS][storedAppLibsId].libraries.length === 0) {
        console.log("updating app libs");
        _updateAppLibsInStorage(tab, result, resolve, reject, storedAppLibsId);
      } else {
        resolve(result[CONTRAST__STORED_APP_LIBS][storedAppLibsId])
      }
    });
  });
}

/**
 * _addAppLibsToStorage - add application libraries to storage
 * @param  {Object} tab             the current tab
 * @param  {Object} result          the current app storage object
 * @param  {Function} resolve       promise resolve
 * @param  {Function} reject        promise reject
 * @param  {String} storedAppLibsId the id of the stored app
 * @param  {Object} application     the application object
 * @return {Promise}                promise of returned app libraries
 */
function _addAppLibsToStorage(tab, result, resolve, reject, storedAppLibsId, application) {
  getApplicationLibraries(tab)
  .then(libraries => {
    if (!libraries || libraries.length === 0) return;

    console.log("ADDING LIBS TO STORAGE RESULT BEFORE", result);

    result[CONTRAST__STORED_APP_LIBS][storedAppLibsId] = {
      application,
      libraries,
    }

    console.log("ADDING LIBS TO STORAGE RESULT AFTER", result);

    chrome.storage.local.set(result, (stored) => {
      chrome.storage.local.get(CONTRAST__STORED_APP_LIBS, (stored) => {
        console.log("application libraries stored", stored);
      })
    });
    resolve(result[CONTRAST__STORED_APP_LIBS][storedAppLibsId]);
  })
  .catch(error => new Error(error));
}

/**
 * _updateAppLibsInStorage - append app libraries to current app libraries
 *
 * @param  {Object} tab             the current tab
 * @param  {Object} result          the current app storage object
 * @param  {Function} resolve       promise resolve
 * @param  {Function} reject        promise reject
 * @param  {String} storedAppLibsId the id of the stored app
 * @return {Promise}                promise of returned app libraries
 */
function _updateAppLibsInStorage(tab, result, resolve, reject, storedAppLibsId) {
  getApplicationLibraries(tab)
  .then(libraries => {
    console.log("application libraries", libraries);
    if (!libraries || libraries.length === 0) return result;

    let libsObject = result[CONTRAST__STORED_APP_LIBS];

    console.log("CONTRAST__STORED_APP_LIBS before", libsObject);
    libsObject[storedAppLibsId].libraries = libsObject[storedAppLibsId].libraries.concat(libraries);
    console.log("CONTRAST__STORED_APP_LIBS after", libsObject);

    chrome.storage.local.set(libsObject, () => {
      chrome.storage.local.get(CONTRAST__STORED_APP_LIBS, (getted) => {
        console.log("application libraries were updated", getted);
      })
    });
    console.log("updated result obj", result[CONTRAST__STORED_APP_LIBS][storedAppLibsId]);
    return resolve(result[CONTRAST__STORED_APP_LIBS][storedAppLibsId]);
  })
  .catch(() => new Error("Error updating stored tab"));
}
