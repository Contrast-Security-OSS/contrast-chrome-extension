/*global
chrome, document,
CONTRAST_USERNAME,
  CONTRAST_SERVICE_KEY,
  CONTRAST_API_KEY,
  CONTRAST_ORG_UUID,
  TEAMSERVER_URL
*/
"use strict";
document.addEventListener('DOMContentLoaded', () => {
  // Inputs
  let username = document.getElementById('contrast_username'),
      serviceKey = document.getElementById('contrast_service_key'),
      apiKey = document.getElementById('contrast_api_key'),
      orgUuid = document.getElementById('contrast_org_uuid'),
      teamserverUrl = document.getElementById('teamserver_url'),
      submitButton;


  chrome.storage.local.get([
    CONTRAST_USERNAME,
    CONTRAST_SERVICE_KEY,
    CONTRAST_API_KEY,
    CONTRAST_ORG_UUID,
    TEAMSERVER_URL], (items) => {
      if (isCredentialed(items)) {
        username.setAttribute("value", items.contrast_username === undefined ? "" : items.contrast_username);
        serviceKey.setAttribute("value", items.contrast_service_key === undefined ? "" : items.contrast_service_key);
        apiKey.setAttribute("value", items.contrast_api_key === undefined ? "" : items.contrast_api_key);
        orgUuid.setAttribute("value", items.contrast_org_uuid === undefined ? "" : items.contrast_org_uuid);
        teamserverUrl.setAttribute("value", items.teamserver_url === undefined ? "" : items.teamserver_url);
      }
    });


  submitButton = document.getElementById('contrast-submit');

  // Run when form is submitted
  submitButton.addEventListener('click', () => {
    // retrieve values form inputs
    const usernameValue = username.value.trim(),
          serviceKeyValue = serviceKey.value.trim(),
          apiKeyValue = apiKey.value.trim(),
          orgUuidValue = orgUuid.value.trim();

    let teamserverUrlValue = teamserverUrl.value.trim();

    if (teamserverUrlValue.length > 0) {
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
    }


    //save values to local storage
    chrome.storage.local.set({
      'contrast_username': usernameValue,
      'contrast_service_key': serviceKeyValue,
      'contrast_api_key': apiKeyValue,
      'contrast_org_uuid': orgUuidValue,
      'teamserver_url': teamserverUrlValue
    }, () => {
      chrome.tabs.getCurrent(tab => {
        chrome.tabs.remove(tab.id, () => {
          return;
        });
      });
    });

  }, false);

}, false);
