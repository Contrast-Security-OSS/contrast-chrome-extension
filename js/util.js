/*global
XMLHttpRequest, btoa, chrome
*/
"use strict";

const CONTRAST_USERNAME = "contrast_username", // storage key
      CONTRAST_SERVICE_KEY = "contrast_service_key", // storage key
      CONTRAST_API_KEY = "contrast_api_key", // storage key
      CONTRAST_ORG_UUID = "contrast_org_uuid", // storage key
      TEAMSERVER_URL = "teamserver_url", // storage key

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
        'localhost',
        // 'app.contrastsecurity.com',
        // 'apptwo.contrastsecurity.com',
        // 'eval.contratsecurity.com'
      ],

      CONTRAST_ICON_BADGE_BACKGROUND = "red",
      CONTRAST_ICON_BADGE_CONFIGURE_EXTENSION_BACKGROUND = "#FFD300",
      CONTRAST_ICON_BADGE_CONFIGURE_EXTENSION_TEXT = "*",

      LISTENING_ON_DOMAIN = "http://localhost/*",
      GATHER_FORMS_ACTION = "gatherForms",
      STORED_TRACES_KEY   = "traces",
      TRACES_REQUEST      = "getStoredTraces";
      // STORED_URLS_KEY     = "urls",

// ---------  TEAMSERVER XHR HELPER FUNCTIONS -------------
function sendXhr(url, params, authHeader, apiKey, onReadyStateChangeCallback) {

  const xhr = new XMLHttpRequest()
  const linkWithParams = url + params
  // console.log("url with params sent to teamserver", linkWithParams);
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

function getOrganizationVulnerabilitiesIdsUrl(teamserverUrl, orgUuid) {
  return teamserverUrl + '/ng/' + orgUuid + '/orgtraces/ids';
}

function getVulnerabilityShortUrl(teamserverUrl, orgUuid, traceUuid) {
  return teamserverUrl + '/ng/' + orgUuid + '/orgtraces/' + traceUuid + "/short";
}

function getVulnerabilityTeamserverUrl(teamserverUrl, orgUuid, traceUuid) {

  let contrastURL = teamserverUrl;
  if (teamserverUrl.endsWith("/api")) {
    contrastURL = teamserverUrl.substring(0, teamserverUrl.indexOf("/api"));
  }
  return contrastURL + '/static/ng/index.html#/' + orgUuid + '/vulns/' + traceUuid + "/overview";
}

/**
 * getOrganizationVulnerabilityesIds - sets up the teamserver request
 *
 * @param  {String} urls - string of base64 encoded urls to send to TS as params
 * @param  {Function} onReadyStateChangeCallback description
 * @return {void}
 */
function getOrganizationVulnerabilityesIds(urls, onReadyStateChangeCallback) {
  // console.log(onReadyStateChangeCallback);

  chrome.storage.local.get([
    CONTRAST_USERNAME,
    CONTRAST_SERVICE_KEY,
    CONTRAST_API_KEY,
    CONTRAST_ORG_UUID,
    TEAMSERVER_URL
  ], (items) => {
      const url = getOrganizationVulnerabilitiesIdsUrl(items[TEAMSERVER_URL], items[CONTRAST_ORG_UUID])
      const authHeader = getAuthorizationHeader(items[CONTRAST_USERNAME], items[CONTRAST_SERVICE_KEY])
      const params = "?urls=" + urls
      sendXhr(url, params, authHeader, items[CONTRAST_API_KEY], onReadyStateChangeCallback);
    });
}

function getVulnerabilityShort(traceUuid, onReadyStateChangeCallback) {

  chrome.storage.local.get([
    CONTRAST_USERNAME,
    CONTRAST_SERVICE_KEY,
    CONTRAST_API_KEY,
    CONTRAST_ORG_UUID,
    TEAMSERVER_URL], (items) => {
      if (isCredentialed(items)) {
        const url = getVulnerabilityShortUrl(items[TEAMSERVER_URL], items[CONTRAST_ORG_UUID], traceUuid)
        const authHeader = getAuthorizationHeader(items[CONTRAST_USERNAME], items[CONTRAST_SERVICE_KEY])

        sendXhr(url, "", authHeader, items[CONTRAST_API_KEY], onReadyStateChangeCallback);
      }
    });
}

// ---------  OTHER HELPER FUNCTIONS -------------

/**
 * isCredentialed - verifies that user has all fields filled in
 *
 * @param  {Object} credentials username, serviceKey, apiKey, etc.
 * @return {Boolean}            if all fields are complete
 */
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
  return !!values && values.length > 0 && values.every(item => !!item)
}

/**
 * removeDuplicatesFromArray - description
 *
 * @param  {Array} array array from which to remove duplicates
 * @return {Array}       new, deduped array
 */
function removeDuplicatesFromArray(array) {
  if (!!array && array.length > 0) {
    return array.filter((item, position, self) => self.indexOf(item) === position)
  }
  return []
}

/**
 * generateURLString - creates a string of base64 encoded urls to send to TS as params
 *
 * @param  {Array} traceUrls - array of urls retrieved from tab and form actions
 * @return {String} - string of base64 encoded urls to send to TS as params
 */
function generateURLString(traceUrls) {
	if (!traceUrls || traceUrls.length === 0) {
		// console.log("traceUrls in generateURLString", traceUrls);
		return ""
	}
	const urls = traceUrls.map(u => {
		let url;
		// first make an array of url paths
		url = new URL(u).pathname

		// second convert each path to base64 and return
		return btoa(url)
	})
	// return each base64 encoded url path with a common in between
	return urls.join(',')
}
