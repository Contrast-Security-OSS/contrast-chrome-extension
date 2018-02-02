const CONTRAST_USERNAME = "contrast_username";
const CONTRAST_SERVICE_KEY = "contrast_service_key";
const CONTRAST_API_KEY = "contrast_api_key";
const CONTRAST_ORG_UUID = "contrast_org_uuid";
const TEAMSERVER_URL = "teamserver_url";

// --------- HELPER FUNCTIONS -------------
function getXhr(url, params, authHeader, apiKey, onReadyStateChangeCallback) {
  var xhr = new XMLHttpRequest();
  var linkWithParams = url + params;

  xhr.open('GET', linkWithParams, true);
  xhr.setRequestHeader("Authorization", authHeader);
  xhr.setRequestHeader("API-Key", apiKey);
  xhr.setRequestHeader("Accept", "application/json");
  xhr.onreadystatechange = onReadyStateChangeCallback(xhr);

  return xhr;
}

function getAuthorizationHeader(username, serviceKey) {
  return btoa(username + ":" + serviceKey);
}

function getActivitiesUrl(teamserverUrl, orgUuid) {
  return teamserverUrl + '/ng/' + orgUuid + '/events';
}

function getOrganizationVulnerabilitiesIdsUrl(teamserverUrl, orgUuid) {
  return teamserverUrl + '/ng/' + orgUuid + '/orgtraces/ids';
}

function getVulnerabilityShortUrl(teamserverUrl, orgUuid, traceUuid) {
  return teamserverUrl + '/ng/' + orgUuid + '/orgtraces/' + traceUuid + "/short";
}

// --------- HELPER FUNCTIONS -------------


function getActivities(onReadyStateChangeCallback) {

  chrome.storage.sync.get([CONTRAST_USERNAME,
    CONTRAST_SERVICE_KEY,
    CONTRAST_API_KEY,
    CONTRAST_ORG_UUID,
    TEAMSERVER_URL], function (items) {

      var url = getActivitiesUrl(items[TEAMSERVER_URL], items[CONTRAST_ORG_UUID]);
      var authHeader = getAuthorizationHeader(items[CONTRAST_USERNAME], items[CONTRAST_SERVICE_KEY]);
      var xhr = getXhr(url, "", authHeader, items[CONTRAST_API_KEY], onReadyStateChangeCallback);

      xhr.send();
    });
}

function getOrganizationVulnerabilityesIds(filterText, onReadyStateChangeCallback) {

  chrome.storage.sync.get([CONTRAST_USERNAME,
    CONTRAST_SERVICE_KEY,
    CONTRAST_API_KEY,
    CONTRAST_ORG_UUID,
    TEAMSERVER_URL], function (items) {

      var url = getOrganizationVulnerabilitiesIdsUrl(items[TEAMSERVER_URL], items[CONTRAST_ORG_UUID]);
      var authHeader = getAuthorizationHeader(items[CONTRAST_USERNAME], items[CONTRAST_SERVICE_KEY]);
      var params = "?filterText=" + encodeURIComponent(filterText);
      var xhr = getXhr(url, params, authHeader, items[CONTRAST_API_KEY], onReadyStateChangeCallback);

      xhr.send();
    });
}

function getVulnerabilityShort(traceUuid, onReadyStateChangeCallback) {

  chrome.storage.sync.get([CONTRAST_USERNAME,
    CONTRAST_SERVICE_KEY,
    CONTRAST_API_KEY,
    CONTRAST_ORG_UUID,
    TEAMSERVER_URL], function (items) {

      var url = getVulnerabilityShortUrl(items[TEAMSERVER_URL], items[CONTRAST_ORG_UUID], traceUuid);
      var authHeader = getAuthorizationHeader(items[CONTRAST_USERNAME], items[CONTRAST_SERVICE_KEY]);
      var xhr = getXhr(url, "", authHeader, items[CONTRAST_API_KEY], onReadyStateChangeCallback);

      xhr.send();
    });
}