document.addEventListener('DOMContentLoaded', function () {
  // Inputs
  var username = document.getElementById('contrast_username');
  var serviceKey = document.getElementById('contrast_service_key');
  var apiKey = document.getElementById('contrast_api_key');
  var orgUuid = document.getElementById('contrast_org_uuid');
  var teamserverUrl = document.getElementById('teamserver_url');

  var submitButton = document.getElementById('contrast-submit');

  // Run when form is submitted
  submitButton.addEventListener('click', function () {
    // retrieve values form inputs
    var usernameValue = username.value;
    var serviceKeyValue = serviceKey.value;
    var apiKeyValue = apiKey.value;
    var orgUuidValue = orgUuid.value;
    var teamserverUrlValue = teamserverUrl.value;

    while (teamserverUrlValue.endsWith("/")) {
      teamserverUrlValue = teamserverUrlValue.slice(0, -1);
    }

    if (!teamserverUrlValue.endsWith("/api")) {
      if (!teamserverUrlValue.endsWith("/Contrast")) {
        teamserverUrlValue += "/Contrast";
      }
      teamserverUrlValue += "/api";
    }
    if (!teamserverUrlValue.startsWith("http")) {
      teamserverUrlValue = "https://" + teamserverUrlValue;
    }

    //save values to local storage
    chrome.storage.sync.set({
      'contrast_username': usernameValue,
      'contrast_service_key': serviceKeyValue,
      'contrast_api_key': apiKeyValue,
      'contrast_org_uuid': orgUuidValue,
      'teamserver_url': teamserverUrlValue
    }, function () {
      console.log('Contrast values saved');
      chrome.tabs.getCurrent(function (tab) {
        chrome.tabs.remove(tab.id, function () { });
      });


    });
  }, false);

}, false);
