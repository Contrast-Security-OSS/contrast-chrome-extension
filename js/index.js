/*global
  chrome,
  document,
  URL,
*/
import {
  getStoredCredentials,
  isCredentialed,
} from './util.js';

import ApplicationTable from './models/ApplicationTable.js';
import Config from './models/Config.js';

/**
 * indexFunction - Main function that's run, renders config button if user is on TS Your Account Page, otherwise renders vulnerability feed
 *
 * @return {void}
 */
function indexFunction() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

    const tab = tabs[0];
    const url = new URL(tab.url);

    getStoredCredentials()
    .then(credentials => {
      const credentialed = isCredentialed(credentials);
      const config = new Config(tab, url, credentialed);
      if (!credentialed) {
        config.getUserConfiguration();
      } else if (credentialed && config._isTeamserverAccountPage()) {
        config.getUserConfiguration();
        // renderApplicationsMenu(url);
        const table = new ApplicationTable(url);
        table.renderApplicationsMenu();
        config.renderContrastUsername(credentials);
      } else {
        const table = new ApplicationTable(url);
        table.renderActivityFeed();
        config.renderContrastUsername(credentials);
      }
      config.setGearIcon();
    })
    .catch(error => new Error(error));
  });
}


/**
 * Run when popup loads
 */
document.addEventListener('DOMContentLoaded', indexFunction, false);
