/*jslint white: true */
/*global
chrome, document
*/
document.addEventListener('DOMContentLoaded', function () {

  "use strict";
  chrome.storage.sync.get(["contrast_username", "contrast_service_key", "contrast_api_key", "teamserver_url"], function (items) {
    // check if any values are undefined
    var noUsername = items.contrast_username === undefined || items.contrast_username === '',
      noServiceKey = items.contrast_service_key === undefined || items.contrast_service_key === '',
      noApiKey = items.contrast_api_key === undefined || items.contrast_api_key === '',
      noTeamserverUrl = items.teamserver_url === undefined || items.teamserver_url === '',
      needsCredentials = noUsername || noServiceKey || noApiKey || noTeamserverUrl;

    // find sections
    var signInSection = document.getElementById('sign-in'),
      activityFeedSection = document.getElementById('activity-feed'),
      extensionId;

    if (needsCredentials) {
      // if you need credentials, hide the activity feed
      signInSection.style.display = '';
      activityFeedSection.style.display = 'none';

      var signInButton = document.getElementById('sign-in-button');
      extensionId = chrome.runtime.id;

      //signin button opens up settings page in new tab
      signInButton.addEventListener('click', function () {
        var settingsUrl = 'chrome-extension://' + String(extensionId) + '/settings.html';
        chrome.tabs.create({ url: settingsUrl });
      }, false);
    } else {
      // if you don't need credentials, hide the signin functionality
      signInSection.style.display = 'none';
      activityFeedSection.style.display = '';

      var configureButton = document.getElementById('configure');
      extensionId = chrome.runtime.id;

      //configure button opens up settings page in new tab
      configureButton.addEventListener('click', function () {
        var settingsUrl = 'chrome-extension://' + String(extensionId) + '/settings.html';
        chrome.tabs.create({ url: settingsUrl });
      }, false);

      var visitOrgLink = document.getElementById('visit-org');

      visitOrgLink.addEventListener('click', function () {
        var teamserverUrl = items.teamserver_url.substring(0, items.teamserver_url.indexOf("/Contrast/api"));
        chrome.tabs.create({ url: teamserverUrl });
      }, false);
    }
  });
}, false);

