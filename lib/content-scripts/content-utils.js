"use strict";

var _values = require("babel-runtime/core-js/object/values");

var _values2 = _interopRequireDefault(_values);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _defineProperty2 = require("babel-runtime/helpers/defineProperty");

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _SEVERITY;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
// allow ununed vars in this file since they are used throughout other files
/*eslint no-unused-vars: "off"*/
/*global
btoa,
chrome
*/

// keys for credentials
var CONTRAST_USERNAME = "contrast_username";
var CONTRAST_SERVICE_KEY = "contrast_service_key";
var CONTRAST_API_KEY = "contrast_api_key";
var CONTRAST_ORG_UUID = "contrast_org_uuid";
var TEAMSERVER_URL = "teamserver_url";

// Vulnerability Severity Levels
var SEVERITY_NOTE = "Note";
var SEVERITY_LOW = "Low";
var SEVERITY_MEDIUM = "Medium";
var SEVERITY_HIGH = "High";
var SEVERITY_CRITICAL = "Critical";

// Useful for ordering vulnerabilities by severity
var SEVERITY = (_SEVERITY = {}, (0, _defineProperty3.default)(_SEVERITY, SEVERITY_NOTE, 0), (0, _defineProperty3.default)(_SEVERITY, SEVERITY_LOW, 1), (0, _defineProperty3.default)(_SEVERITY, SEVERITY_MEDIUM, 2), (0, _defineProperty3.default)(_SEVERITY, SEVERITY_HIGH, 3), (0, _defineProperty3.default)(_SEVERITY, SEVERITY_CRITICAL, 4), _SEVERITY);

// Vulnerability Severity Icons
var SEVERITY_NOTE_ICON_PATH = "../img/note.png";
var SEVERITY_LOW_ICON_PATH = "../img/low.png";
var SEVERITY_MEDIUM_ICON_PATH = "../img/medium.png";
var SEVERITY_HIGH_ICON_PATH = "../img/high.png";
var SEVERITY_CRITICAL_ICON_PATH = "../img/critical.png";

var TEAMSERVER_INDEX_PATH_SUFFIX = "/Contrast/static/ng/index.html#/";
var TEAMSERVER_ACCOUNT_PATH_SUFFIX = "/account";
var TEAMSERVER_PROFILE_PATH_SUFFIX = "/account/profile";
var TEAMSERVER_API_PATH_SUFFIX = "/Contrast/api";
var VALID_TEAMSERVER_HOSTNAMES = ['app.contrastsecurity.com', 'apptwo.contrastsecurity.com', 'eval.contratsecurity.com', 'alpha.contrastsecurity.com', 'localhost'];

// Contrast stylings and configuration text
var CONTRAST_GREEN = "#65C0B2"; // or is it #3CC3B2?;
var CONTRAST_RED = "#E63025";
var CONTRAST_YELLOW = "#FFD300";
var CONTRAST_CONFIGURE_TEXT = "*";

// chrome storage and message event keys
var LISTENING_ON_DOMAIN = ["<all_urls>"];
var GATHER_FORMS_ACTION = "contrast__gatherForms";
var GATHER_SCRIPTS = 'contrast__gather_scripts';
var STORED_TRACES_KEY = "contrast__traces";
var TRACES_REQUEST = "contrast__getStoredTraces";
var STORED_APPS_KEY = "contrast__APPS";
var LOADING_DONE = "contrast__LOADING_DONE_requests";
var HIGHLIGHT_VULNERABLE_FORMS = "contrast__highlight_vuln_forms";
var APPLICATION_CONNECTED = 'contrast__application__connected';
var APPLICATION_DISCONNECTED = 'contrast__application__disconnected';
var CONNECTED_APP_DOMAINS = 'contrast__connected_app_domains';
var CONTRAST__STORED_APP_LIBS = 'contrast__stored_libraries';
var CONTRAST_WAPPALIZE = 'contrast__wappalzye';

// don't look for vulnerabilities on these domains
var BLACKLISTED_DOMAINS = ["chrome://", "file://", "/Contrast/api/ng/", "/Contrast/s/", "google.com", "ajax.googleapis.com", "gstatic.net", "cloudfront.com", "developer.chrome", "facebook.com", "atlassian.net", "cloudfront.net", "cloudfront.com", "cdn.sstatic.net", "reddit.com"];
var BLACKLIST_LENGTH = BLACKLISTED_DOMAINS.length;

/**
* Array.prototype.flatten - reduce multi-dimensional arrays to single dimension
*
* add the .flatten() method to Array instances
* the empty array is the initial value of the new array
*
* @return {Array}
*/
Array.prototype.flatten = function () {
  return this.reduce(function (newArray, val) {
    return newArray.concat(val);
  }, []);
};

/**
* String.prototype.titleize - capitalize the first letter of each word in a string, regardless of special characters
* https://stackoverflow.com/a/6251509/6410635
* https://stackoverflow.com/a/196991/6410635
*
* @return {String} titleized string
*/
String.prototype.titleize = function () {
  return this.replace(/\b([a-z])/g, function (captured) {
    return captured.charAt(0).toUpperCase() + captured.substr(1).toLowerCase();
  });
};

// --------- HELPER FUNCTIONS -------------

function fetchTeamserver(url, params, authHeader, apiKey) {
  var requestUrl = url + params;
  var fetchOptions = {
    method: "GET",
    headers: new Headers({
      "Authorization": authHeader,
      "API-Key": apiKey,
      "Accept": "application/json"
    })
  };
  return fetch(requestUrl, fetchOptions).then(function (response) {
    if (response.status === 200 && response.ok) {
      return response.json();
    }
    throw new Error(response);
  }).catch(function (error) {
    return new Error(error);
  });
}

function getAuthorizationHeader(username, serviceKey) {
  return btoa(username + ":" + serviceKey);
}

function getOrganizationVulnerabilitiesIdsUrl(teamserverUrl, orgUuid, appId) {
  if (teamserverUrl && orgUuid && appId) {
    return teamserverUrl + '/ng/' + orgUuid + '/traces/' + appId + '/ids';
  } else if (teamserverUrl && orgUuid) {
    return teamserverUrl + '/ng/' + orgUuid + '/orgtraces/ids';
  }
  throw new Error("an argument to getOrganizationVulnerabilitiesIdsUrl was undefined");
}

function getVulnerabilityShortUrl(teamserverUrl, orgUuid, traceUuid) {
  if (teamserverUrl && orgUuid && traceUuid) {
    return teamserverUrl + '/ng/' + orgUuid + '/orgtraces/' + traceUuid + "/short";
  }

  throw new Error("an argument to getVulnerabilityShortUrl was undefined");
}

function getApplicationsUrl(teamserverUrl, orgUuid) {
  if (teamserverUrl && orgUuid) {
    return teamserverUrl + "/ng/" + orgUuid + "/applications/name";
  }
  throw new Error("an argument to getApplicationsUrl was undefined");
}

/**
 * getVulnerabilityTeamserverUrl - open new tab in contrast showing vulnerability
 *
 * @param  {String} teamserverUrl
 * @param  {String} orgUuid
 * @param  {String} traceUuid
 * @return {String}
 */
function getVulnerabilityTeamserverUrl(teamserverUrl, orgUuid, traceUuid) {
  if (teamserverUrl && orgUuid && traceUuid) {
    var contrastURL = teamserverUrl;
    if (teamserverUrl.endsWith("/api")) {
      contrastURL = teamserverUrl.substring(0, teamserverUrl.indexOf("/api"));
    }
    return contrastURL + '/static/ng/index.html#/' + orgUuid + '/vulns/' + traceUuid + "/overview";
  }

  throw new Error("argument to getVulnerabilityTeamserverUrl was undefined");
}

/**
* getStoredCredentials - retrieve teamserver credentials from chrome storage
*
* @return {Promise} - a promise that resolves to an object of stored teamserver credentials
*/
function getStoredCredentials() {
  return new _promise2.default(function (resolve, reject) {
    chrome.storage.local.get([CONTRAST_USERNAME, CONTRAST_SERVICE_KEY, CONTRAST_API_KEY, CONTRAST_ORG_UUID, TEAMSERVER_URL], function (items) {
      if (!items) {
        reject(new Error("Error getting credentials"));
      } else {
        resolve(items);
      }
    });
  });
}

/**
 * getOrganizationVulnerabilityIds - sets up the teamserver request
 *
 * @param  {String} urls - string of base64 encoded urls to send to TS as params
 * @param  {Function} onReadyStateChangeCallback description
 * @return {void}
 */

function getOrganizationVulnerabilityIds(urls, appId) {
  return getStoredCredentials().then(function (items) {
    if (!items) throw new Error("Error retrieving credentials from storage");

    var url = getOrganizationVulnerabilitiesIdsUrl(items[TEAMSERVER_URL], items[CONTRAST_ORG_UUID], appId);
    var authHeader = getAuthorizationHeader(items[CONTRAST_USERNAME], items[CONTRAST_SERVICE_KEY]);
    var params = "?urls=" + urls;
    return fetchTeamserver(url, params, authHeader, items[CONTRAST_API_KEY]);
  });
}

/**
 * getVulnerabilityShort - Gets more details about a trace
 *
 * @param  {String} traceUuid the uuid of the trace we're getting details about
 * @return {Promise<Object} A promise containing details about the trace
 */
function getVulnerabilityShort(traceUuid) {
  return getStoredCredentials().then(function (items) {
    var url = getVulnerabilityShortUrl(items[TEAMSERVER_URL], items[CONTRAST_ORG_UUID], traceUuid);
    var authHeader = getAuthorizationHeader(items[CONTRAST_USERNAME], items[CONTRAST_SERVICE_KEY]);

    return fetchTeamserver(url, "", authHeader, items[CONTRAST_API_KEY]);
  });
}

/**
 * getApplications - Get the applications that belong to an organization
 *
 * @return {Promise<Array>} A promise containing a list of applications in an organization
 */
function getOrgApplications() {
  return getStoredCredentials().then(function (items) {
    var url = getApplicationsUrl(items[TEAMSERVER_URL], items[CONTRAST_ORG_UUID]);
    var authHeader = getAuthorizationHeader(items[CONTRAST_USERNAME], items[CONTRAST_SERVICE_KEY]);

    return fetchTeamserver(url, "", authHeader, items[CONTRAST_API_KEY]);
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
  var values = (0, _values2.default)(credentials);

  return !!values && values.length > 0 && values.every(function (item) {
    return !!item;
  });
}

/**
* deDupeArray - remove duplicate vlues from array, indexOf finds the index of the first item in an array, so all similar items after the first will evaluate to false when compared to their position
*
* @param  {Array} array array from which to remove duplicates
* @return {Array}       new, deduped array
*/
function deDupeArray(array) {
  return array.filter(function (item, position, self) {
    return self.indexOf(item) === position;
  });
}

/**
* getHostFromUrl - extract the host/domain name from the url
*
* @param  {String} url the url from which to extract the domain/host
* @return {String}     the domain of the website, underscored if port
*/
function getHostFromUrl(url) {
  var host = url.host.replace(":", "_");
  var hostArray = host.split(".");

  if (hostArray.length < 3) {
    return hostArray[0];
  } else if (hostArray.length === 3) {
    return hostArray[1];
  }
  return host;
}

/**
* isBlacklisted - checks if a url contains a string from the blacklist
*
* @param  {String} url - the url to check against
* @return {Boolean}      if the url is in the blacklist
*/
function isBlacklisted(url) {
  if (typeof url !== "string") throw new Error("url must be a string");
  if (!url) return true;
  url = url.toLowerCase();

  for (var i = 0; i < BLACKLIST_LENGTH; i++) {
    if (url.includes(BLACKLISTED_DOMAINS[i].toLowerCase())) {
      return true;
    }
  }
  return false;
}

/**
 * isContrastTeamserver - check if we're on a Contrast teamserver page or not
 *
 * @param  {String} url - the url of the current page
 * @return {Boolen} - if we're on a contrast teamserver page or not
 */
function isContrastTeamserver(url) {
  if (typeof url !== "string") throw new Error("url must be a string");
  if (!url) return false;
  var contrast = ["/Contrast/api/ng/", "/Contrast/s/", "/Contrast/static/ng/index"];

  // .some acts as an OR
  return contrast.some(function (c) {
    return url.includes(c);
  });
}

/**
* updateTabBadge - updates the extension badge on the toolbar
*
* @param  {Object} tab    Gives the state of the current tab
* @param  {String} text   What the badge should display
* @return {void}
*/
function updateTabBadge(tab) {
  var text = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  var color = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : CONTRAST_GREEN;

  if (!tab) return;
  try {
    chrome.tabs.get(tab.id, function (result) {
      if (!result) return;

      try {
        chrome.browserAction.getBadgeText({ tabId: tab.id }, function (badge) {
          if (badge !== "" && !badge) return;

          if (tab.index >= 0 && !chrome.runtime.lastError) {
            chrome.browserAction.setBadgeBackgroundColor({ color: color });
            chrome.browserAction.setBadgeText({ tabId: tab.id, text: text });
          }
        });
      } catch (e) {
        throw new Error("Error updating badge");
      }
    });
  } catch (e) {
    throw new Error("Error updating badge");
  }
}

/**
 * removeLoadingBadge - checks if the current tab is the loading icon and removes it if it is
 *
 * @param  {Object} tab the current tab
 * @return {void}
 */
function removeLoadingBadge(tab) {
  if (!tab) return;

  chrome.browserAction.getBadgeText({ tabId: tab.id }, function (result) {
    if (result === "↻") {
      chrome.browserAction.getBadgeBackgroundColor({ tabId: tab.id }, function (color) {
        if (!color) {
          updateTabBadge(tab, '', CONTRAST_GREEN);
        } else {
          updateTabBadge(tab, '', color);
        }
      });
    }
  });
}

/**
* generateTraceURLString - creates a string of base64 encoded urls to send to TS as params
*
* @param  {Array} traceUrls - array of urls retrieved from tab and form actions
* @return {String} - string of base64 encoded urls to send to TS as params
*/
function generateTraceURLString(traceUrls) {
  if (!traceUrls || traceUrls.length === 0) return "";

  // add a prefixed copy of each url to get endpoints that might have been registered in a different way, for example
  // example.com/login vs another-example.com/login
  var prefix = new URL(document.URL).origin;
  var prefixedUrls = traceUrls.map(function (u) {
    if (prefix && prefix !== "null") {
      return prefix + "/" + u;
    }
    return u;
  });

  var urls = traceUrls.concat(prefixedUrls).map(function (u) {
    // return the full url
    // and the path / endpoint of the url
    return [btoa(u), btoa(new URL(u).pathname)];
  }).flatten();

  // return each base64 encoded url path with a common in between
  return urls.join(',');
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
  return teamserverUrlValue;
}

// -------------- DOM MANIPULATION HELPERS --------------
function setElementDisplay(element, display) {
  if (!element || !display) {
    throw new Error("Either no element or display received when setting display");
  }
  try {
    element.style.display = display;
  } catch (e) {
    throw new Error(e);
  }
}

function setElementText(element, text) {
  if (!element || typeof text !== "string") {
    throw new Error("Either no element or text received when setting element text");
  }
  try {
    element.innerText = text;
  } catch (e) {
    throw new Error(e);
  }
}

function changeElementVisibility(element) {
  var classes = Array.prototype.slice.call(element.classList);
  if (classes.includes("visible")) {
    element.classList.remove("visible");
    element.classList.add("hidden");
  } else {
    element.classList.add("visible");
    element.classList.remove("hidden");
  }
}

/**
 * hideElementAfterTimeout - leave a success/failure message on the screen for 2 seconds by toggling a class
 *
 * @param  {Node} element HTML Element to show for 2 seconds
 * @return {void}
 */
function hideElementAfterTimeout(element, callback) {
  setTimeout(function () {
    // eslint-disable-line consistent-return
    changeElementVisibility(element);
    if (callback) {
      return callback();
    }
  }, 2000); // let the element linger
}

function loadingBadge(tab) {
  updateTabBadge(tab, "↻", CONTRAST_GREEN);
}

function retrieveApplicationFromStorage(tab) {
  return new _promise2.default(function (resolve, reject) {
    chrome.storage.local.get(STORED_APPS_KEY, function (result) {
      if (chrome.runtime.lastError) {
        reject(new Error("Error retrieving stored applications"));
      }

      if (!result || !result[STORED_APPS_KEY]) {
        result = (0, _defineProperty3.default)({}, STORED_APPS_KEY, []);
      }

      var url = new URL(tab.url);
      var host = getHostFromUrl(url);

      var application = result[STORED_APPS_KEY].filter(function (app) {
        return app.host === host;
      })[0];
      // application = result[STORED_APPS_KEY].filter(app => app[host])[0];

      if (!application) {
        if (!isBlacklisted(tab.url) && !chrome.runtime.lastError) {
          try {
            updateTabBadge(tab, CONTRAST_CONFIGURE_TEXT, CONTRAST_YELLOW);
          } catch (e) {
            console.log(e);
            reject(new Error("Error updating tab badge"));
          }
        } else if (isBlacklisted(tab.url) && !chrome.runtime.lastError) {
          try {
            updateTabBadge(tab, '', CONTRAST_GREEN);
          } catch (e) {
            reject(new Error("Error updating tab badge"));
          }
        }
        resolve(null);
      } else {
        resolve(application);
      }
    });
  });
}