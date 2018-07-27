/*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
/*global
chrome,
document,
*/

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
      console.log("TABS", tabs);
      if (!tabs[0]) return;

      const tab   = tabs[0];
      const url   = new URL(tab.url);
      const host  = getHostFromUrl(url);
      const store = result[STORED_APPS_KEY];
      const app   = store ? store.filter(a => a[host])[0] : store;

      // console.log("app", app);
      // console.log("isContrastTeamserver(tab.url)", isContrastTeamserver(tab.url));

      console.log("APP", app);

      if (app && !isEmptyObject(app)) {
        getStoredCredentials()
        .then(items => {
          console.log("STORED CREDS", items);
          if (isCredentialed(items)) {
            console.log("IS CREDENTIALED");
            getStorageVulnsAndRender(items, app, tab);
          } else {
            throw new Error("Not Credentialed")
          }
        })
        .catch(error => new Error(error));
      }
    });
  });
}, false);
