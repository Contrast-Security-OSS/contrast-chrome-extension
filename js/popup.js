/*global
chrome,
document,
*/

import {
  renderVulnerableLibraries,
} from './libraries/showLibraries.js'
import { getStorageVulnsAndRender } from './popupMethods.js';
import {
  STORED_APPS_KEY,
  getStoredCredentials,
  isCredentialed,
  getHostFromUrl,
  isEmptyObject,
} from './util.js'

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(STORED_APPS_KEY, (result) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return;

      const tab   = tabs[0];
      const url   = new URL(tab.url);
      const host  = getHostFromUrl(url);
      const store = result[STORED_APPS_KEY];
      const app   = store ? store.filter(a => a[host])[0] : store;


      if (app && !isEmptyObject(app)) {
        getStoredCredentials()
        .then(items => {
          if (isCredentialed(items)) {
            getStorageVulnsAndRender(items, app, tab);
            // renderVulnerableLibraries(tab, app)
          } else {
            throw new Error("Not Credentialed")
          }
        })
        .catch(error => new Error(error));
      }
    });
  });
}, false);
