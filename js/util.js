// allow ununed vars in this file since they are used throughout other files
/*eslint no-unused-vars: "off"*/
/*global
XMLHttpRequest, btoa, chrome
*/
"use strict";
const CONTRAST_USERNAME = "contrast_username",
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
      TEAMSERVER_PROFILE_PATH_SUFFIX = "/account/profile",
      TEAMSERVER_API_PATH_SUFFIX = "/Contrast/api",
      VALID_TEAMSERVER_HOSTNAMES = [
        'app.contrastsecurity.com',
        'apptwo.contrastsecurity.com',
        'eval.contratsecurity.com',
        'localhost'
      ],

      CONTRAST_ICON_BADGE_BACKGROUND = "red",
      CONTRAT_GREEN = "#65C0B2",
      CONTRAST_ICON_BADGE_CONFIGURE_EXTENSION_BACKGROUND = "#FFD300",
      CONTRAST_ICON_BADGE_CONFIGURE_EXTENSION_TEXT = "*",

      LISTENING_ON_DOMAIN = "<all_urls>",
      GATHER_FORMS_ACTION = "gatherForms",
      STORED_TRACES_KEY   = "traces",
      TRACES_REQUEST      = "getStoredTraces";


/**
 * Array.prototype.flatten - reduce multi-dimensional arrays to single dimension
 *
 * add the .flatten() method to Array instances
 * the empty array is the initial value of the new array
 *
 * @return {Array}
 */
Array.prototype.flatten = function() {
	return this.reduce((newArray, val) => newArray.concat(val), []);
}


/**
 * String.prototype.titleize - capitalize the first letter of each word in a string, regardless of special characters
 * https://stackoverflow.com/a/6251509/6410635
 * https://stackoverflow.com/a/196991/6410635
 *
 * @return {String} titleized string
 */
String.prototype.titleize = function() {
  return this.replace(/\b([a-z])/g, function(captured) {
    return captured.charAt(0).toUpperCase() + captured.substr(1).toLowerCase()
  })
}

// --------- HELPER FUNCTIONS -------------

function fetchTeamserver(url, params, authHeader, apiKey) {
  const fetchOptions = {
    method: "GET",
    headers: new Headers({
      "Authorization": authHeader,
      "API-Key": apiKey,
      "Accept": "application/json"
    })
  }
  const requestUrl = url + params
  return(
    fetch(requestUrl, fetchOptions)
    .then(response => {
      if (response.status === 200 && response.ok) {
        return response.json()
      } else {
        return false
      }
    })
    .catch(error => "error fetching from teamserver")
  )
}

function getAuthorizationHeader(username, serviceKey) {
  return btoa(username + ":" + serviceKey);
}

function getOrganizationVulnerabilitiesIdsUrl(teamserverUrl, orgUuid) {
  return teamserverUrl + '/ng/' + orgUuid + '/orgtraces/ids';
}

function getVulnerabilityShortUrl(teamserverUrl, orgUuid, traceUuid) {
  return teamserverUrl + '/ng/' + orgUuid + '/orgtraces/' + traceUuid + "/short";
}

function getVulnerabilityFilterUrl(teamserverUrl, orgUuid, traceUuid) {
  return teamserverUrl + '/ng/' + orgUuid + '/orgtraces/filter/' + traceUuid + "?expand=request,events,notes,application,servers";
}

function getVulnerabilityTeamserverUrl(teamserverUrl, orgUuid, traceUuid) {

  let contrastURl = teamserverUrl;
  if (teamserverUrl.endsWith("/api")) {
    contrastURl = teamserverUrl.substring(0, teamserverUrl.indexOf("/api"));
  }
  return contrastURl + '/static/ng/index.html#/' + orgUuid + '/vulns/' + traceUuid + "/overview";
}

// --------- HELPER FUNCTIONS -------------

/**
 * getStoredCredentials - retrieve teamserver credentials from chrome storage
 *
 * @return {Promise} - a promise that resolves to an object of stored teamserver credentials
 */
function getStoredCredentials() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([
      CONTRAST_USERNAME,
      CONTRAST_SERVICE_KEY,
      CONTRAST_API_KEY,
      CONTRAST_ORG_UUID,
      TEAMSERVER_URL
    ], items => resolve(items))
  })
}

/**
 * getOrganizationVulnerabilityesIds - sets up the teamserver request
 *
 * @param  {String} urls - string of base64 encoded urls to send to TS as params
 * @param  {Function} onReadyStateChangeCallback description
 * @return {void}
 */
function getOrganizationVulnerabilityesIds(urls) {
  return getStoredCredentials()
  .then(items => {
    const url = getOrganizationVulnerabilitiesIdsUrl(items[TEAMSERVER_URL], items[CONTRAST_ORG_UUID])
    const authHeader = getAuthorizationHeader(items[CONTRAST_USERNAME], items[CONTRAST_SERVICE_KEY])
    const params = "?urls=" + urls
    return fetchTeamserver(url, params, authHeader, items[CONTRAST_API_KEY]);
  });
}

function getVulnerabilityShort(traceUuid) {
  return getStoredCredentials()
  .then(items => {
    const url = getVulnerabilityShortUrl(
      items[TEAMSERVER_URL], items[CONTRAST_ORG_UUID], traceUuid
    )
    const authHeader = getAuthorizationHeader(
      items[CONTRAST_USERNAME], items[CONTRAST_SERVICE_KEY]
    );

    return fetchTeamserver(url, "", authHeader, items[CONTRAST_API_KEY]);
  })
}

function getVulnerabilityFilter(traceUuid) {
  return getStoredCredentials()
  .then(items => {
    const url = getVulnerabilityFilterUrl(
      items[TEAMSERVER_URL], items[CONTRAST_ORG_UUID], traceUuid
    )
    const authHeader = getAuthorizationHeader(
      items[CONTRAST_USERNAME], items[CONTRAST_SERVICE_KEY]
    );

    return fetchTeamserver(url, "", authHeader, items[CONTRAST_API_KEY]);
  })
}

function isCredentialed(credentials) {
  // ES5
  // check if any values are undefined
  // var noUsername = items.contrast_username === undefined || items.contrast_username === '',
  // noServiceKey = items.contrast_service_key === undefined || items.contrast_service_key === '',
  // noApiKey = items.contrast_api_key === undefined || items.contrast_api_key === '',
  // noTeamserverUrl = items.teamserver_url === undefined || items.teamserver_url === '',
  // return noUsername || noServiceKey || noApiKey || noTeamserverUrl;

  // ES6
  const values = Object.values(credentials)
  return values.length > 0 && values.every(item => !!item)
}

function deDupeArray(array) {
  return array.filter((item, position, self) => self.indexOf(item) === position)
}

function notContrastRequest(url) {
  !url.includes(TEAMSERVER_API_PATH_SUFFIX) && !url.includes(TEAMSERVER_INDEX_PATH_SUFFIX)
}
