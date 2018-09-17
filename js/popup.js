/*global
chrome,
document,
*/

// import {
//   renderVulnerableLibraries,
// } from './libraries/showLibraries.js'
import { getStorageVulnsAndRender, hideLoadingIcon } from "./popupMethods.js";
import {
  STORED_APPS_KEY,
  getStoredCredentials,
  isCredentialed,
  getHostFromUrl,
  isEmptyObject,
  setElementDisplay
} from "./util.js";

document.addEventListener(
  "DOMContentLoaded",
  () => {
    chrome.storage.local.get(STORED_APPS_KEY, result => {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        if (!tabs[0]) return;

        const tab = tabs[0];
        const url = new URL(tab.url);
        const host = getHostFromUrl(url);
        const store = result[STORED_APPS_KEY];
        const app = store ? store.filter(a => a[host])[0] : store;

        if (app && !isEmptyObject(app)) {
          getStoredCredentials()
            .then(items => {
              if (isCredentialed(items)) {
                renderLoadingIcon();
                getStorageVulnsAndRender(items, app, tab);
                // renderVulnerableLibraries(tab, app)
              } else {
                throw new Error("Not Credentialed");
              }
            })
            .catch(error => new Error(error));
        } else {
          const vulnsFound = document.getElementById(
            "vulnerabilities-found-on-page"
          );
          setElementDisplay(vulnsFound, "none");
          hideLoadingIcon();
        }
      });
    });
  },
  false
);

function renderLoadingIcon() {
  const loading = document.getElementById("vulns-loading");
  loading.style.display = "block";
}
