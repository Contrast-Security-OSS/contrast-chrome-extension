// allow ununed vars in this file since they are used throughout other files
/*eslint no-unused-vars: "off"*/
/*global
XMLHttpRequest, btoa, chrome
*/
"use strict";

// keys for credentials
const CONTRAST_USERNAME    = "contrast_username"
const CONTRAST_SERVICE_KEY = "contrast_service_key"
const CONTRAST_API_KEY     = "contrast_api_key"
const CONTRAST_ORG_UUID    = "contrast_org_uuid"
const TEAMSERVER_URL       = "teamserver_url"

// Vulnerability Severity Levels
const SEVERITY_NOTE = "Note"
const SEVERITY_LOW = "Low"
const SEVERITY_MEDIUM = "Medium"
const SEVERITY_HIGH = "High"
const SEVERITY_CRITICAL = "Critical"

// Vulnerability Severity Icons
const SEVERITY_NOTE_ICON_PATH = "../img/note.png"
const SEVERITY_LOW_ICON_PATH = "../img/low.png"
const SEVERITY_MEDIUM_ICON_PATH = "../img/medium.png"
const SEVERITY_HIGH_ICON_PATH = "../img/high.png"
const SEVERITY_CRITICAL_ICON_PATH = "../img/critical.png"

const HTML_BODY = "body"
const TEAMSERVER_INDEX_PATH_SUFFIX  = "/Contrast/static/ng/index.html#/"
const TEAMSERVER_ACCOUNT_PATH_SUFFIX = "/account"
const TEAMSERVER_PROFILE_PATH_SUFFIX = "/account/profile"
const TEAMSERVER_API_PATH_SUFFIX = "/Contrast/api"
const VALID_TEAMSERVER_HOSTNAMES = [
  'app.contrastsecurity.com',
  'apptwo.contrastsecurity.com',
  'eval.contratsecurity.com',
  'localhost',
]

const CONTRAST_ICON_BADGE_BACKGROUND = "#E63025"
const CONTRAST_GREEN = "#65C0B2" // or is it #3CC3B2?
const CONTRAST_RED  = "#E63025"
const CONTRAST_ICON_BADGE_CONFIGURE_EXTENSION_BACKGROUND = "#FFD300"
const CONTRAST_ICON_BADGE_CONFIGURE_EXTENSION_TEXT = "*"
const CONTRAST_ICON_16 = "../img/contrast16.png"

const LISTENING_ON_DOMAIN = "<all_urls>"
const GATHER_FORMS_ACTION = "gatherForms"
const STORED_TRACES_KEY   = "traces"
const TRACES_REQUEST      = "getStoredTraces"
const STORED_APPS_KEY     = "APPS"

const BLACKLISTED_DOMAINS = [
  "chrome://",
  "file://",
  "/Contrast/static",
  "/Contrast/api",
  "/Contrast/s/",
  "google.com",
  "ajax.googleapis.com",
  "gstatic.net",
  "cloudfront.com",
  "developer.chrome",
  "facebook.com",
  "atlassian.net",
  "cloudfront.net",
  "cloudfront.com",
  "cdn.sstatic.net",
  "reddit.com",
]
const BLACKLIST_LENGTH    = BLACKLISTED_DOMAINS.length


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
  const requestUrl   = url + params
  const fetchOptions = {
    method: "GET",
    headers: new Headers({
      "Authorization": authHeader,
      "API-Key": apiKey,
      "Accept": "application/json",
    }),
  }
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

function getOrganizationVulnerabilitiesIdsUrl(teamserverUrl, orgUuid, appId) {
  if (teamserverUrl && orgUuid && appId) {
    return teamserverUrl + '/ng/' + orgUuid + '/traces/' + appId + '/ids';
  }
  else if (teamserverUrl && orgUuid) {
    return teamserverUrl + '/ng/' + orgUuid + '/orgtraces/ids';
  }
  throw new Error("an argument to getOrganizationVulnerabilitiesIdsUrl was undefined")
}

function getVulnerabilityShortUrl(teamserverUrl, orgUuid, traceUuid) {
  if (teamserverUrl && orgUuid && traceUuid) {
    return teamserverUrl + '/ng/' + orgUuid + '/orgtraces/' + traceUuid + "/short";
  }
  throw new Error("an argument to getVulnerabilityShortUrl was undefined")
}

function getVulnerabilityFilterUrl(teamserverUrl, orgUuid, traceUuid) {
  if (teamserverUrl && orgUuid && traceUuid) {
    return teamserverUrl + '/ng/' + orgUuid + '/orgtraces/filter/' + traceUuid + "?expand=request"; // ,events,notes,application,servers
  }
  throw new Error("an argument to getVulnerabilityFilterUrl was undefined")
}

function getApplicationsUrl(teamserverUrl, orgUuid) {
  if (teamserverUrl && orgUuid) {
    return teamserverUrl + "/ng/" + orgUuid + "/applications/name"
  }
  throw new Error("an argument to getApplicationsUrl was undefined")
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
    ], (items) => {
      if (!items) {
        reject("Error getting credentials")
      } else {
        resolve(items)
      }
    })
  })
}

/**
 * getOrganizationVulnerabilityIds - sets up the teamserver request
 *
 * @param  {String} urls - string of base64 encoded urls to send to TS as params
 * @param  {Function} onReadyStateChangeCallback description
 * @return {void}
 */
function getOrganizationVulnerabilityIds(urls, appId) {
  return getStoredCredentials()
  .then(items => {
    if (!items) throw new Error("Error retrieving credentials from storage")

    const url = getOrganizationVulnerabilitiesIdsUrl(items[TEAMSERVER_URL], items[CONTRAST_ORG_UUID], appId)
    const authHeader = getAuthorizationHeader(items[CONTRAST_USERNAME], items[CONTRAST_SERVICE_KEY])
    const params = "?urls=" + urls
    return fetchTeamserver(url, params, authHeader, items[CONTRAST_API_KEY]);
  })
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

function getApplications() {
  return getStoredCredentials()
  .then(items => {
    const url = getApplicationsUrl  (
      items[TEAMSERVER_URL], items[CONTRAST_ORG_UUID]
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
      teamserverUrlValue += "/api"
    }
    if (!teamserverUrlValue.startsWith("http")) {
      teamserverUrlValue = "https://" + teamserverUrlValue
    }
  }
  return teamserverUrlValue
}

function getHostFromUrl(url) {
  const host      = url.host.split(":").join("_")
  const hostArray = host.split(".")
  if (hostArray.length < 3) {
    return [hostArray[0]]
  } else if (hostArray.length === 3) {
    return [hostArray[1]]
  } else {
    return [hostname]
  }
}

function isBlacklisted(request) {
  if (!request || !request.url) return true
  const url = request.url.toLowerCase()

	for (let i = 0; i < BLACKLIST_LENGTH; i++) {
		if (url.includes(BLACKLISTED_DOMAINS[i].toLowerCase())) {
			return true
		}
	}
	return false
}

/**
 * updateTabBadge - updates the extension badge on the toolbar
 *
 * @param  {Object} tab    Gives the state of the current tab
 * @param  {String} text   What the badge should display
 * @return {void}
 */
function updateTabBadge(tab, text, color) {
	if (chrome.runtime.lastError) {
		return
	}
	try {
		if (!TAB_CLOSED && tab.index >= 0) { // tab is visible
			chrome.browserAction.setBadgeBackgroundColor({ color })
			chrome.browserAction.setBadgeText({ tabId: tab.id, text })
		}
	} catch (e) { return null }
		finally { TAB_CLOSED = false }
}
