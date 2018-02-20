/*global
chrome, document,
CONTRAST_USERNAME,
  CONTRAST_SERVICE_KEY,
  CONTRAST_API_KEY,
  CONTRAST_ORG_UUID,
  TEAMSERVER_URL
*/
document.addEventListener('DOMContentLoaded', function () {

  "use strict";
  chrome.storage.sync.get([CONTRAST_USERNAME, CONTRAST_SERVICE_KEY, CONTRAST_API_KEY, TEAMSERVER_URL], function (items) {
    // check if any values are undefined
    var noUsername = items.contrast_username === undefined || items.contrast_username === '',
      noServiceKey = items.contrast_service_key === undefined || items.contrast_service_key === '',
      noApiKey = items.contrast_api_key === undefined || items.contrast_api_key === '',
      noTeamserverUrl = items.teamserver_url === undefined || items.teamserver_url === '',
      needsCredentials = noUsername || noServiceKey || noApiKey || noTeamserverUrl,
      signInSection,
      extensionId,
      signInButton,
      configureButton,
      visitOrgLink,
      vulnerabilitySection,
      userEmail,
      signInButtonConfigurationProblem,
      noResultsSection;

    // find sections
    signInSection = document.getElementById('sign-in');
    vulnerabilitySection = document.getElementById('vulnerabilities');

    if (needsCredentials) {
      // if you need credentials, hide the activity feed

      $(HTML_BODY).addClass("no-activity");
      signInSection.style.display = '';
      vulnerabilitySection.style.display = 'none';

      signInButton = document.getElementById('sign-in-button');
      extensionId = chrome.runtime.id;

      //signin button opens up settings page in new tab
      signInButton.addEventListener('click', function () {
        var settingsUrl = 'chrome-extension://' + String(extensionId) + '/settings.html';
        chrome.tabs.create({ url: settingsUrl });
      }, false);
    } else {
      // if you don't need credentials, hide the signin functionality
      signInSection.style.display = 'none';
      vulnerabilitySection.style.display = '';


      userEmail = document.getElementById('user-email');
      userEmail.textContent = items.contrast_username;

      configureButton = document.getElementById('configure');
      extensionId = chrome.runtime.id;

      //configure button opens up settings page in new tab
      configureButton.addEventListener('click', function () {
        var settingsUrl = 'chrome-extension://' + String(extensionId) + '/settings.html';
        chrome.tabs.create({ url: settingsUrl });
      }, false);

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
  });
}, false);
