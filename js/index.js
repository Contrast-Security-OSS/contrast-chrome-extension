/*global
chrome, document,
CONTRAST_USERNAME,
  CONTRAST_SERVICE_KEY,
  CONTRAST_API_KEY,
  CONTRAST_ORG_UUID,
  TEAMSERVER_URL,
  HTML_BODY,
  $,
  VALID_TEAMSERVER_HOSTNAMES,
  TEAMSERVER_ACCOUNT_PATH_SUFFIX,
  TEAMSERVER_INDEX_PATH_SUFFIX,
  URL
*/

function indexFunction() {
  "use strict";
  chrome.storage.sync.get([CONTRAST_USERNAME, CONTRAST_SERVICE_KEY, CONTRAST_API_KEY, TEAMSERVER_URL], function (items) {
    // check if any values are undefined
    var noUsername = items.contrast_username === undefined || items.contrast_username === '',
      noServiceKey = items.contrast_service_key === undefined || items.contrast_service_key === '',
      noApiKey = items.contrast_api_key === undefined || items.contrast_api_key === '',
      noTeamserverUrl = items.teamserver_url === undefined || items.teamserver_url === '',
      needsCredentials = noUsername || noServiceKey || noApiKey || noTeamserverUrl,
      extensionId,
      configureButton,
      visitOrgLink,
      userEmail,
      signInButtonConfigurationProblem,
      notConfiguredSection,
      configureExtension,
      noVulnerabilitiesFoundOnPageSection,
      vulnerabilitiesFoundOnPageSection,
      configureExtensionButton;

    // find sections
    notConfiguredSection = document.getElementById('not-configured');
    configureExtension = document.getElementById('configure-extension');
    vulnerabilitiesFoundOnPageSection = document.getElementById('vulnerabilities-found-on-page');
    noVulnerabilitiesFoundOnPageSection = document.getElementById('no-vulnerabilities-found-on-page');

    if (needsCredentials) {
      // if you need credentials, hide the activity feed

      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {

        var tab = tabs[0], url = new URL(tab.url);

        if (tab.url.startsWith("http") && VALID_TEAMSERVER_HOSTNAMES.includes(url.hostname)
          && tab.url.endsWith(TEAMSERVER_ACCOUNT_PATH_SUFFIX) && tab.url.indexOf(TEAMSERVER_INDEX_PATH_SUFFIX) !== -1) {
          configureExtension.style.display = '';

          configureExtensionButton = document.getElementById('configure-extension-button');
          configureExtensionButton.addEventListener('click', function () {
            chrome.tabs.sendMessage(tab.id, { url: tab.url }, function () {
              indexFunction();
              chrome.browserAction.setBadgeText({ tabId: tab.id, text: '' });
              return;
            });
          }, false);

        } else {
          notConfiguredSection.style.display = '';
        }
      });

      vulnerabilitiesFoundOnPageSection.style.display = 'none';
      noVulnerabilitiesFoundOnPageSection.style.display = 'none';
    } else {
      // if you don't need credentials, hide the signin functionality
      configureExtension.style.display = 'none';
      notConfiguredSection.style.display = 'none';
      noVulnerabilitiesFoundOnPageSection.style.display = '';

      userEmail = document.getElementById('user-email');
      userEmail.textContent = items.contrast_username;

      visitOrgLink = document.getElementById('visit-org');

      visitOrgLink.addEventListener('click', function () {
        var teamserverUrl = items.teamserver_url.substring(0, items.teamserver_url.indexOf("/Contrast/api"));
        chrome.tabs.create({ url: teamserverUrl });
      }, false);

      signInButtonConfigurationProblem = document.getElementById('sign-in-button-configuration-problem');

      signInButtonConfigurationProblem.addEventListener('click', function () {
        var settingsUrl = 'chrome-extension://' + String(extensionId) + '/settings.html';
        chrome.tabs.create({ url: settingsUrl });
      }, false);
    }

    configureButton = document.getElementById('configure');
    extensionId = chrome.runtime.id;

    //configure button opens up settings page in new tab
    configureButton.addEventListener('click', function () {
      var settingsUrl = 'chrome-extension://' + String(extensionId) + '/settings.html';
      chrome.tabs.create({ url: settingsUrl });
    }, false);
  });
}

document.addEventListener('DOMContentLoaded', indexFunction, false);
