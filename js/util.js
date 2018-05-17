// allow ununed vars in this file since they are used throughout other files
/*eslint no-unused-vars: "off"*/
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
      TEAMSERVER_INDEX_PATH_SUFFIX  = "/Contrast/static/ng/index.html#/",
      TEAMSERVER_ACCOUNT_PATH_SUFFIX = "/account",
      TEAMSERVER_PROFILE_PATH_SUFFIX = "/account/profile",
      TEAMSERVER_API_PATH_SUFFIX = "/Contrast/api",
      VALID_TEAMSERVER_HOSTNAMES = [
        'app.contrastsecurity.com',
        'apptwo.contrastsecurity.com',
        'eval.contratsecurity.com',
        'localhost'
      ],

      CONTRAST_ICON_BADGE_BACKGROUND = "#E63025",
      CONTRAT_GREEN = "#65C0B2", // or is it #3CC3B2?
      CONTRAST_ICON_BADGE_CONFIGURE_EXTENSION_BACKGROUND = "#FFD300",
      CONTRAST_ICON_BADGE_CONFIGURE_EXTENSION_TEXT = "*",
      CONTRAST_ICON_16 = "../img/contrast16.png",

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
  return (
    fetch(requestUrl, fetchOptions)
    .then(response => {
      if (response.status === 200 && response.ok) {
        return response.json()
      }
      throw new Error(response)
    })
    .catch(error => false)
  )
}

function getAuthorizationHeader(username, serviceKey) {
  return btoa(username + ":" + serviceKey);
}

function getOrganizationVulnerabilitiesIdsUrl(teamserverUrl, orgUuid) {
  if (teamserverUrl && orgUuid) {
    return teamserverUrl + '/ng/' + orgUuid + '/orgtraces/ids';
  }
  throw new Error("argument to getOrganizationVulnerabilitiesIdsUrl was undefined")
}

function getVulnerabilityShortUrl(teamserverUrl, orgUuid, traceUuid) {
  if (teamserverUrl && orgUuid && traceUuid) {
    return teamserverUrl + '/ng/' + orgUuid + '/orgtraces/' + traceUuid + "/short";
  }
  throw new Error("argument to getVulnerabilityShortUrl was undefined")
}

function getVulnerabilityFilterUrl(teamserverUrl, orgUuid, traceUuid) {
  if (teamserverUrl && orgUuid && traceUuid) {
    return teamserverUrl + '/ng/' + orgUuid + '/orgtraces/filter/' + traceUuid + "?expand=request,events,notes,application,servers";
  }
  throw new Error("argument to getVulnerabilityFilterUrl was undefined")
}

function getVulnerabilityTeamserverUrl(teamserverUrl, orgUuid, traceUuid) {
  if (teamserverUrl && orgUuid && traceUuid) {
    let contrastURL = teamserverUrl;
    if (teamserverUrl.endsWith("/api")) {
      contrastURL = teamserverUrl.substring(0, teamserverUrl.indexOf("/api"));
    }
    return contrastURL + '/static/ng/index.html#/' + orgUuid + '/vulns/' + traceUuid + "/overview";
  }
  throw new Error("argument to getVulnerabilityTeamserverUrl was undefined")
}

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
 * getOrganizationVulnerabilityIds - sets up the teamserver request
 *
 * @param  {String} urls - string of base64 encoded urls to send to TS as params
 * @param  {Function} onReadyStateChangeCallback description
 * @return {void}
 */
function getOrganizationVulnerabilityIds(urls) {
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
 * deDupeArray - remove duplicate vlues from array
 *
 * @param  {Array} array array from which to remove duplicates
 * @return {Array}       new, deduped array
 */
function deDupeArray(array) {
  return array.filter((item, position, self) => self.indexOf(item) === position)
}

function notContrastRequest(url) {
  !url.includes(TEAMSERVER_API_PATH_SUFFIX) && !url.includes(TEAMSERVER_INDEX_PATH_SUFFIX)
}

/**
 * generateURLString - creates a string of base64 encoded urls to send to TS as params
 *
 * @param  {Array} traceUrls - array of urls retrieved from tab and form actions
 * @return {String} - string of base64 encoded urls to send to TS as params
 */
function generateURLString(traceUrls) {
	if (!traceUrls || traceUrls.length === 0) {
		return ""
	}

	// add a prefixed copy of each url to get endpoints that might have been registered in a different way, for example
	// http://localhost:3000/login vs /login
	const prefix = new URL(document.URL).origin
	const prefixedUrls = traceUrls.map(u => prefix + "/" + u)

	let urls = traceUrls.concat(prefixedUrls).map(u => {
		// return the full url
		// and the path / endpoint of the url
		return [
			btoa(u),
			btoa(new URL(u).pathname)
		]
	}).flatten()

	// return each base64 encoded url path with a common in between
	return urls.join(',')
}

/**
 * processTeamserverUrl - transforms a given url into a valid teamserver url
 *
 * @param  {String} teamserverUrlValue domain or domain:host
 * @return {String}                    processed teamserver url
 */
function processTeamserverUrl(teamserverUrlValue) {
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
  return teamserverUrlValue
}
