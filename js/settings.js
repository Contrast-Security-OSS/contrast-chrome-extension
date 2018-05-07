/*global
  chrome,
  document,
  getStoredCredentials
*/
"use strict";

function setAttributeValue(element, value) {
  element.setAttribute("value", !value ? "" : value);
}

document.addEventListener('DOMContentLoaded', () => {
  // Inputs
  "use strict";
  const username      = document.getElementById('contrast_username')
  const serviceKey    = document.getElementById('contrast_service_key')
  const apiKey        = document.getElementById('contrast_api_key')
  const orgUuid       = document.getElementById('contrast_org_uuid')
  const teamserverUrl = document.getElementById('teamserver_url')
  let submitButton;


  getStoredCredentials().then(items => {
    setAttributeValue(username, items.contrast_username)
    setAttributeValue(serviceKey, items.contrast_service_key)
    setAttributeValue(apiKey, items.contrast_api_key)
    setAttributeValue(orgUuid, items.contrast_org_uuid)
    setAttributeValue(teamserverUrl, items.teamserver_url)
  })


  submitButton = document.getElementById('contrast-submit');

  // Run when form is submitted
  submitButton.addEventListener('click', () => {
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
    chrome.storage.sync.set({
      'contrast_username': username.value.trim(),
      'contrast_service_key': serviceKey.value.trim(),
      'contrast_api_key': apiKey.value.trim(),
      'contrast_org_uuid': orgUuid.value.trim(),
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
