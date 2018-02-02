document.addEventListener('DOMContentLoaded', function () {

  var needsCredentials;

  chrome.storage.sync.get(["contrast_username", "contrast_service_key", "contrast_api_key"], function (items) {
    // check if any values are undefined
    var noUsername = typeof items["contrast_username"] == 'undefined' || items["contrast_username"] == ''
    var noServiceKey = typeof items["contrast_service_key"] == 'undefined' || items["contrast_service_key"] == ''
    var noApiKey = typeof items["contrast_api_key"] == 'undefined' || items["contrast_api_key"] == ''

    // define var to check if we need to update our variables
    needsCredentials = noUsername || noServiceKey || noApiKey;
    //logging for debugging
    console.log(items["contrast_username"]);
    console.log(noUsername);
    console.log(items["contrast_service_key"]);
    console.log(noServiceKey);
    console.log(items["contrast_api_key"]);
    console.log(noApiKey);

    // find sections
    var signInSection = document.getElementById('sign-in');
    var activityFeedSection = document.getElementById('activity-feed');

    if (needsCredentials) {
      // if you need credentials, hide the activity feed
      signInSection.style.display = ''
      activityFeedSection.style.display = 'none'

      var signInButton = document.getElementById('sign-in-button');
      var extensionId = chrome.runtime.id;

      //signin button opens up settings page in new tab
      signInButton.addEventListener('click', function () {
        var settingsUrl = 'chrome-extension://' + String(extensionId) + '/settings.html';
        chrome.tabs.create({ url: settingsUrl });
      }, false);
    } else {
      // if you don't need credentials, hide the signin functionality
      signInSection.style.display = 'none'
      activityFeedSection.style.display = ''

      var configureButton = document.getElementById('configure');
      var extensionId = chrome.runtime.id;

      //configure button opens up settings page in new tab
      configureButton.addEventListener('click', function () {
        var settingsUrl = 'chrome-extension://' + String(extensionId) + '/settings.html';
        chrome.tabs.create({ url: settingsUrl });
      }, false);
    }
  });



}, false);
