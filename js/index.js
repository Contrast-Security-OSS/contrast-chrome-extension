/*global
  chrome,
  document,
  VALID_TEAMSERVER_HOSTNAMES,
  TEAMSERVER_ACCOUNT_PATH_SUFFIX,
  TEAMSERVER_INDEX_PATH_SUFFIX,
  TEAMSERVER_PROFILE_PATH_SUFFIX,
  URL,
  getStoredCredentials,
  isCredentialed
*/
"use strict";
function setDisplayNone(element) {
  element.style.display = 'none'
}

function indexFunction() {
  getStoredCredentials().then(items => {

    let extensionId
    let configureExtension

    // find sections
    let notConfiguredSection = document.getElementById('not-configured');
    configureExtension = document.getElementById('configure-extension');
    let vulnerabilitiesFoundOnPageSection = document.getElementById('vulnerabilities-found-on-page');
    let noVulnerabilitiesFoundOnPageSection = document.getElementById('no-vulnerabilities-found-on-page');
    if (!isCredentialed(items)) {
      // if you need credentials, hide the activity feed

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

        const tab = tabs[0], url = new URL(tab.url);

        if (tab.url.startsWith("http") && VALID_TEAMSERVER_HOSTNAMES.includes(url.hostname)
          && (tab.url.endsWith(TEAMSERVER_ACCOUNT_PATH_SUFFIX) || tab.url.endsWith(TEAMSERVER_PROFILE_PATH_SUFFIX))
          && tab.url.indexOf(TEAMSERVER_INDEX_PATH_SUFFIX) !== -1) {
          configureExtension.style.display = '';

          let configureExtensionHost = document.getElementById('configure-extension-host');
          configureExtensionHost.textContent = "Make sure you trust this site: " + url.hostname;

          let configureExtensionButton = document.getElementById('configure-extension-button');
          configureExtensionButton.addEventListener('click', (e) => {
            configureExtensionButton.setAttribute('disabled', true)

            // credentials are set by sending a message to content-script
            chrome.tabs.sendMessage(tab.id, {
              url: tab.url,
              action: "INITIALIZE",
            }, (response) => {
              if (response === "INITIALIZED") {
                chrome.browserAction.setBadgeText({ tabId: tab.id, text: '' });
                setDisplayNone(noVulnerabilitiesFoundOnPageSection)

                // recurse on this method, credentials should have been set in content-script so this part of indexFunction will not be evaluated again
                indexFunction();
              } else {
                configureExtensionButton.removeAttribute('disabled')
              }
              return
            });
          }, false);

        } else {
          notConfiguredSection.style.display = '';
        }
      });

      setDisplayNone(vulnerabilitiesFoundOnPageSection)
    } else {
      // if you don't need credentials, hide the signin functionality
      setDisplayNone(configureExtension)
      setDisplayNone(notConfiguredSection)

      let userEmail = document.getElementById('user-email');
      userEmail.textContent = "User: " + items.contrast_username;

      let visitOrgLink = document.getElementById('visit-org');

      visitOrgLink.addEventListener('click', () => {
        const teamserverUrl = items.teamserver_url.substring(0, items.teamserver_url.indexOf("/Contrast/api"));
        chrome.tabs.create({ url: teamserverUrl });
      }, false);

      let signInButtonConfigurationProblem = document.getElementById('sign-in-button-configuration-problem');

      signInButtonConfigurationProblem.addEventListener('click', () => {
        const settingsUrl = 'chrome-extension://' + String(extensionId) + '/settings.html';
        chrome.tabs.create({ url: settingsUrl });
      }, false);
    }

    let configureButton = document.getElementById('configure');
    extensionId = chrome.runtime.id;

    //configure button opens up settings page in new tab
    configureButton.addEventListener('click', () => {
      const settingsUrl = 'chrome-extension://' + String(extensionId) + '/settings.html';
      chrome.tabs.create({ url: settingsUrl });
    }, false);
  });
}

document.addEventListener('DOMContentLoaded', indexFunction, false);
