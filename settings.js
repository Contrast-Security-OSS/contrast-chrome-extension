document.addEventListener('DOMContentLoaded', function () {
  // Inputs
  var username = document.getElementById('contrast_username');
  var serviceKey = document.getElementById('contrast_service_key');
  var apiKey = document.getElementById('contrast_api_key');
  var orgUuid = document.getElementById('contrast_org_uuid');
  var teamserverUrl = document.getElementById('teamserver_url');


  chrome.storage.sync.get(["contrast_username",
    "contrast_service_key",
    "contrast_api_key",
    "contrast_org_uuid",
    "teamserver_url"], function (items) {
      username.setAttribute("value", items["contrast_username"]);
      serviceKey.setAttribute("value", items["contrast_service_key"]);
      apiKey.setAttribute("value", items["contrast_api_key"]);
      orgUuid.setAttribute("value", items["contrast_org_uuid"]);
      teamserverUrl.setAttribute("value", items["teamserver_url"]);
    });


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
