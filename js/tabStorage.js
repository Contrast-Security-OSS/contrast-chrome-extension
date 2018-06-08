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

export function setupCurrentTab(tab) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(CONTRAST__STORED_APP_LIBS, (result) => {
      // tab is not in storage, look up vulnerabilities and libraries
      if (!result || Object.keys(result).length === 0) {
        result = { [CONTRAST__STORED_APP_LIBS]: {} };
      }

      chrome.storage.local.remove(CONTRAST__STORED_APP_LIBS)

      retrieveApplicationFromStorage(tab)
      .then(application => {
        const storedAppLibsId = "APP_LIBS__ID_" + Object.keys(application)[0]

        if (!result[CONTRAST__STORED_APP_LIBS][storedAppLibsId]) {
          return _addAppLibsToStorage(tab, result, resolve, reject, storedAppLibsId, application)
        }

        else if (result[CONTRAST__STORED_APP_LIBS][storedAppLibsId].application && result[CONTRAST__STORED_APP_LIBS][storedAppLibsId].libraries.length === 0) {

          return _updateAppLibsInStorage(tab, result, resolve, reject, storedAppLibsId)
        }
        return resolve(result[CONTRAST__STORED_APP_LIBS][storedAppLibsId])
      })
    });
  });
}

function _addAppLibsToStorage(tab, result, resolve, reject, storedAppLibsId, application) {
  getApplicationLibraries(tab)
  .then(libraries => {
    if (!libraries) return;

    result[CONTRAST__STORED_APP_LIBS][storedAppLibsId] = {
      application,
      libraries,
    }



    chrome.storage.local.set(result);
    resolve(result[CONTRAST__STORED_APP_LIBS][storedAppLibsId]);
  })
  .catch(error => new Error(error));
}

function _updateAppLibsInStorage(tab, result, resolve, reject, storedAppLibsId) {
  Promise.resolve(getApplicationLibraries(tab))
  .then(libraries => {
    if (libraries.length === 0) return [];

    let tabObject = result[CONTRAST__STORED_APP_LIBS][storedAppLibsId];
    tabObject.libraries = tabObject.libraries.concat(libraries);

    chrome.storage.local.set(tabObject);
    return resolve(result[CONTRAST__STORED_APP_LIBS][storedAppLibsId])
  })
  .catch(() => new Error("Error updating stored tab"));
}
