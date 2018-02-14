const CONTRAST_USERNAME = "contrast_username";
const CONTRAST_SERVICE_KEY = "contrast_service_key";
const CONTRAST_API_KEY = "contrast_api_key";
const CONTRAST_ORG_UUID = "contrast_org_uuid";
const TEAMSERVER_URL = "teamserver_url";

const SEVERITY_NOTE = "Note";
const SEVERITY_LOW = "Low";
const SEVERITY_MEDIUM = "Medium";
const SEVERITY_HIGH = "High";
const SEVERITY_CRITICAL = "Critical";

const SEVERITY_NOTE_ICON_PATH = "../img/note.png";
const SEVERITY_LOW_ICON_PATH = "../img/low.png";
const SEVERITY_MEDIUM_ICON_PATH = "../img/medium.png";
const SEVERITY_HIGH_ICON_PATH = "../img/high.png";
const SEVERITY_CRITICAL_ICON_PATH = "../img/critical.png";

const HTML_BODY = "body";

// --------- HELPER FUNCTIONS -------------
function sendXhr(url, params, authHeader, apiKey, onReadyStateChangeCallback) {
  var xhr = new XMLHttpRequest();
  var linkWithParams = url + params;

  xhr.open('GET', linkWithParams, true);
  xhr.setRequestHeader("Authorization", authHeader);
  xhr.setRequestHeader("API-Key", apiKey);
  xhr.setRequestHeader("Accept", "application/json");
  xhr.onreadystatechange = onReadyStateChangeCallback(xhr);
  xhr.send();
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

function getVulnerabilityTeamserverUrl(teamserverUrl, orgUuid, traceUuid) {
  var contrastURl = teamserverUrl;
  if (teamserverUrl.endsWith("/api")) {
    contrastURl = teamserverUrl.substring(0, teamserverUrl.indexOf("/api"));
  }
  return contrastURl + '/static/ng/index.html#/' + orgUuid + '/vulns/' + traceUuid + "/overview";
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
      sendXhr(url, "", authHeader, items[CONTRAST_API_KEY], onReadyStateChangeCallback);
    });
}

function getOrganizationVulnerabilityesIds(urls, onReadyStateChangeCallback) {

  chrome.storage.sync.get([CONTRAST_USERNAME,
    CONTRAST_SERVICE_KEY,
    CONTRAST_API_KEY,
    CONTRAST_ORG_UUID,
    TEAMSERVER_URL], function (items) {

      var url = getOrganizationVulnerabilitiesIdsUrl(items[TEAMSERVER_URL], items[CONTRAST_ORG_UUID]);
      var authHeader = getAuthorizationHeader(items[CONTRAST_USERNAME], items[CONTRAST_SERVICE_KEY]);
      var params = "?urls=" + btoa(urls);
      sendXhr(url, params, authHeader, items[CONTRAST_API_KEY], onReadyStateChangeCallback);
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
      sendXhr(url, "", authHeader, items[CONTRAST_API_KEY], onReadyStateChangeCallback);
    });
}
