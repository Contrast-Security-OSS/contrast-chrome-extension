/*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
/*global
  chrome,
  document,
*/

import {
  getStoredCredentials,
  processTeamserverUrl,
} from './util.js';

function setAttributeValue(element, value) {
  element.setAttribute("value", !value ? "" : value);
}

document.addEventListener('DOMContentLoaded', () => {
  // Inputs
  const username      = document.getElementById('contrast_username')
  const serviceKey    = document.getElementById('contrast_service_key')
  const apiKey        = document.getElementById('contrast_api_key')
  const orgUuid       = document.getElementById('contrast_org_uuid')
  const teamserverUrl = document.getElementById('teamserver_url')

  getStoredCredentials().then(items => {
    setAttributeValue(username, items.contrast_username)
    setAttributeValue(serviceKey, items.contrast_service_key)
    setAttributeValue(apiKey, items.contrast_api_key)
    setAttributeValue(orgUuid, items.contrast_org_uuid)
    setAttributeValue(teamserverUrl, items.teamserver_url)
  })

  const submitButton = document.getElementById('contrast-submit');

  // Run when form is submitted
  submitButton.addEventListener('click', () => {
    // retrieve values form inputs
    const usernameValue      = username.value.trim()
    const serviceKeyValue    = serviceKey.value.trim()
    const apiKeyValue        = apiKey.value.trim()
    const orgUuidValue       = orgUuid.value.trim()
    const teamserverUrlValue = processTeamserverUrl(teamserverUrl.value.trim());

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
