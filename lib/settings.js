"use strict";

var _util = require("./util.js");

function setAttributeValue(element, value) {
  element.setAttribute("value", !value ? "" : value);
} /*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
/*global
  chrome,
  document,
*/

document.addEventListener('DOMContentLoaded', function () {
  // Inputs
  var username = document.getElementById('contrast_username');
  var serviceKey = document.getElementById('contrast_service_key');
  var apiKey = document.getElementById('contrast_api_key');
  var orgUuid = document.getElementById('contrast_org_uuid');
  var teamserverUrl = document.getElementById('teamserver_url');

  (0, _util.getStoredCredentials)().then(function (items) {
    setAttributeValue(username, items.contrast_username);
    setAttributeValue(serviceKey, items.contrast_service_key);
    setAttributeValue(apiKey, items.contrast_api_key);
    setAttributeValue(orgUuid, items.contrast_org_uuid);
    setAttributeValue(teamserverUrl, items.teamserver_url);
  });

  var submitButton = document.getElementById('contrast-submit');

  // Run when form is submitted
  submitButton.addEventListener('click', function () {
    // retrieve values form inputs
    var usernameValue = username.value.trim();
    var serviceKeyValue = serviceKey.value.trim();
    var apiKeyValue = apiKey.value.trim();
    var orgUuidValue = orgUuid.value.trim();
    var teamserverUrlValue = (0, _util.processTeamserverUrl)(teamserverUrl.value.trim());

    //save values to local storage
    chrome.storage.local.set({
      'contrast_username': usernameValue,
      'contrast_service_key': serviceKeyValue,
      'contrast_api_key': apiKeyValue,
      'contrast_org_uuid': orgUuidValue,
      'teamserver_url': teamserverUrlValue
    }, function () {
      chrome.tabs.getCurrent(function (tab) {
        chrome.tabs.remove(tab.id, function () {
          return;
        });
      });
    });
  }, false);
}, false);