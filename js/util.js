/*global
XMLHttpRequest, btoa, chrome
*/
var CONTRAST_USERNAME = "contrast_username",
  CONTRAST_SERVICE_KEY = "contrast_service_key",
  CONTRAST_API_KEY = "contrast_api_key",
  CONTRAST_ORG_UUID = "contrast_org_uuid",
  TEAMSERVER_URL = "teamserver_url",

  SEVERITY_NOTE = "Note",
  SEVERITY_LOW = "Low",
  SEVERITY_MEDIUM = "Medium",
  SEVERITY_HIGH = "High",
  SEVERITY_CRITICAL = "Critical",

  SEVERITY_NOTE_ICON_PATH = "../img/note.png",
  SEVERITY_LOW_ICON_PATH = "../img/low.png",
  SEVERITY_MEDIUM_ICON_PATH = "../img/medium.png",
  SEVERITY_HIGH_ICON_PATH = "../img/high.png",
  SEVERITY_CRITICAL_ICON_PATH = "../img/critical.png",

  HTML_BODY = "body",
  TEAMSERVER_INDEX_PATH_SUFFIX = "/Contrast/static/ng/index.html#/",
  TEAMSERVER_ACCOUNT_PATH_SUFFIX = "/account",
  TEAMSERVER_API_PATH_SUFFIX = "/Contrast/api";

// --------- HELPER FUNCTIONS -------------
function sendXhr(url, params, authHeader, apiKey, onReadyStateChangeCallback) {
  "use strict";
  var xhr = new XMLHttpRequest(),
    linkWithParams = url + params;

  xhr.open('GET', linkWithParams, true);
  xhr.setRequestHeader("Authorization", authHeader);
  xhr.setRequestHeader("API-Key", apiKey);
  xhr.setRequestHeader("Accept", "application/json");
  xhr.onreadystatechange = onReadyStateChangeCallback(xhr);
  xhr.send();
}

function getAuthorizationHeader(username, serviceKey) {
  "use strict";
  return btoa(username + ":" + serviceKey);
}

function getActivitiesUrl(teamserverUrl, orgUuid) {
  "use strict";
  return teamserverUrl + '/ng/' + orgUuid + '/events';
}

function getOrganizationVulnerabilitiesIdsUrl(teamserverUrl, orgUuid) {
  "use strict";
  return teamserverUrl + '/ng/' + orgUuid + '/orgtraces/ids';
}

function getVulnerabilityShortUrl(teamserverUrl, orgUuid, traceUuid) {
  "use strict";
  return teamserverUrl + '/ng/' + orgUuid + '/orgtraces/' + traceUuid + "/short";
}

function getVulnerabilityTeamserverUrl(teamserverUrl, orgUuid, traceUuid) {
  "use strict";
  var contrastURl = teamserverUrl;
  if (teamserverUrl.endsWith("/api")) {
    contrastURl = teamserverUrl.substring(0, teamserverUrl.indexOf("/api"));
  }
  return contrastURl + '/static/ng/index.html#/' + orgUuid + '/vulns/' + traceUuid + "/overview";
}

// --------- HELPER FUNCTIONS -------------


function getActivities(onReadyStateChangeCallback) {
  "use strict";
  chrome.storage.sync.get([CONTRAST_USERNAME,
    CONTRAST_SERVICE_KEY,
    CONTRAST_API_KEY,
    CONTRAST_ORG_UUID,
    TEAMSERVER_URL], function (items) {

      var url = getActivitiesUrl(items[TEAMSERVER_URL], items[CONTRAST_ORG_UUID]),
        authHeader = getAuthorizationHeader(items[CONTRAST_USERNAME], items[CONTRAST_SERVICE_KEY]);
      sendXhr(url, "", authHeader, items[CONTRAST_API_KEY], onReadyStateChangeCallback);
    });
}

function getOrganizationVulnerabilityesIds(urls, onReadyStateChangeCallback) {
  "use strict";
  chrome.storage.sync.get([CONTRAST_USERNAME,
    CONTRAST_SERVICE_KEY,
    CONTRAST_API_KEY,
    CONTRAST_ORG_UUID,
    TEAMSERVER_URL], function (items) {

      var url = getOrganizationVulnerabilitiesIdsUrl(items[TEAMSERVER_URL], items[CONTRAST_ORG_UUID]),
        authHeader = getAuthorizationHeader(items[CONTRAST_USERNAME], items[CONTRAST_SERVICE_KEY]),
        params = "?urls=" + btoa(urls);
      sendXhr(url, params, authHeader, items[CONTRAST_API_KEY], onReadyStateChangeCallback);
    });
}

function getVulnerabilityShort(traceUuid, onReadyStateChangeCallback) {
  "use strict";
  chrome.storage.sync.get([CONTRAST_USERNAME,
    CONTRAST_SERVICE_KEY,
    CONTRAST_API_KEY,
    CONTRAST_ORG_UUID,
    TEAMSERVER_URL], function (items) {

      var url = getVulnerabilityShortUrl(items[TEAMSERVER_URL], items[CONTRAST_ORG_UUID], traceUuid),
        authHeader = getAuthorizationHeader(items[CONTRAST_USERNAME], items[CONTRAST_SERVICE_KEY]);
      sendXhr(url, "", authHeader, items[CONTRAST_API_KEY], onReadyStateChangeCallback);
    });
}
