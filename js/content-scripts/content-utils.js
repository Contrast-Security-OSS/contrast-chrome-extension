/*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
// allow ununed vars in this file since they are used throughout other files
/*eslint no-unused-vars: "off"*/
/*global
btoa,
chrome
*/

// keys for credentials
const CONTRAST_USERNAME = "contrast_username";
const CONTRAST_SERVICE_KEY = "contrast_service_key";
const CONTRAST_API_KEY = "contrast_api_key";
const CONTRAST_ORG_UUID = "contrast_org_uuid";
const TEAMSERVER_URL = "teamserver_url";

// Vulnerability Severity Levels
const SEVERITY_NOTE = "Note";
const SEVERITY_LOW = "Low";
const SEVERITY_MEDIUM = "Medium";
const SEVERITY_HIGH = "High";
const SEVERITY_CRITICAL = "Critical";

// Useful for ordering vulnerabilities by severity
const SEVERITY = {
  [SEVERITY_NOTE]: 0,
  [SEVERITY_LOW]: 1,
  [SEVERITY_MEDIUM]: 2,
  [SEVERITY_HIGH]: 3,
  [SEVERITY_CRITICAL]: 4
};

const TEAMSERVER_INDEX_PATH_SUFFIX = "/Contrast/static/ng/index.html#/";
const TEAMSERVER_ACCOUNT_PATH_SUFFIX = "/account";
const TEAMSERVER_PROFILE_PATH_SUFFIX = "/account/profile";
const TEAMSERVER_API_PATH_SUFFIX = "/Contrast/api";
const VALID_TEAMSERVER_HOSTNAMES = [
  "app.contrastsecurity.com",
  "apptwo.contrastsecurity.com",
  "eval.contratsecurity.com",
  "alpha.contrastsecurity.com",
  "localhost"
];

// Contrast stylings and configuration text
const CONTRAST_GREEN = "#65C0B2"; // or is it #3CC3B2?;
const CONTRAST_RED = "#E63025";
const CONTRAST_YELLOW = "#FFD300";
const CONTRAST_CONFIGURE_TEXT = "*";

// chrome storage and message event keys
const LISTENING_ON_DOMAIN = ["<all_urls>"];
const GATHER_FORMS_ACTION = "contrast__gatherForms";
const GATHER_SCRIPTS = "contrast__gather_scripts";
const STORED_TRACES_KEY = "contrast__traces";
const TRACES_REQUEST = "contrast__getStoredTraces";
const STORED_APPS_KEY = "contrast__APPS";
const LOADING_DONE = "contrast__LOADING_DONE_requests";
const HIGHLIGHT_VULNERABLE_FORMS = "contrast__highlight_vuln_forms";
const APPLICATION_CONNECTED = "contrast__application__connected";
const APPLICATION_DISCONNECTED = "contrast__application__disconnected";
const CONNECTED_APP_DOMAINS = "contrast__connected_app_domains";
const CONTRAST__STORED_APP_LIBS = "contrast__stored_libraries";
const CONTRAST_WAPPALIZE = "contrast__wappalzye";
const CONTRAST_INITIALIZE = "contrast__initialize_user";
const CONTRAST_INITIALIZED = "contrast__user_initialized";

// don't look for vulnerabilities on these domains
const BLACKLISTED_DOMAINS = [
  "chrome://",
  "file://",
  "/Contrast/api/ng/",
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
  "reddit.com"
];
const BLACKLIST_LENGTH = BLACKLISTED_DOMAINS.length;
const UUID_V4_REGEX = new RegExp(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
);

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
};

/**
 * String.prototype.titleize - capitalize the first letter of each word in a string, regardless of special characters
 * https://stackoverflow.com/a/6251509/6410635
 * https://stackoverflow.com/a/196991/6410635
 *
 * @return {String} titleized string
 */
String.prototype.titleize = function() {
  return this.replace(/\b([a-z])/g, function(captured) {
    return captured.charAt(0).toUpperCase() + captured.substr(1).toLowerCase();
  });
};

// --------- HELPER FUNCTIONS -------------

function fetchTeamserver(url, params, authHeader, apiKey) {
  const requestUrl = url + params;
  const fetchOptions = {
    method: "GET",
    headers: new Headers({
      Authorization: authHeader,
      "API-Key": apiKey,
      Accept: "application/json"
    })
  };
  return fetch(requestUrl, fetchOptions)
    .then(response => {
      if (response.status === 200 && response.ok) {
        return response.json();
      }
      throw new Error(response);
    })
    .catch(error => new Error(error));
}

function getAuthorizationHeader(username, serviceKey) {
  return btoa(username + ":" + serviceKey);
}

function getOrganizationVulnerabilitiesIdsUrl(teamserverUrl, orgUuid, appId) {
  if (teamserverUrl && orgUuid && appId) {
    return teamserverUrl + "/ng/" + orgUuid + "/traces/" + appId + "/ids";
  } else if (teamserverUrl && orgUuid) {
    return teamserverUrl + "/ng/" + orgUuid + "/orgtraces/ids";
  }
  throw new Error(
    "an argument to getOrganizationVulnerabilitiesIdsUrl was undefined"
  );
}

function getVulnerabilityShortUrl(teamserverUrl, orgUuid, traceUuid) {
  if (teamserverUrl && orgUuid && traceUuid) {
    return (
      teamserverUrl + "/ng/" + orgUuid + "/orgtraces/" + traceUuid + "/short"
    );
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
    let contrastURL = teamserverUrl;
    if (teamserverUrl.endsWith("/api")) {
      contrastURL = teamserverUrl.substring(0, teamserverUrl.indexOf("/api"));
    }
    return (
      contrastURL +
      "/static/ng/index.html#/" +
      orgUuid +
      "/vulns/" +
      traceUuid +
      "/overview"
    );
  }

  throw new Error("argument to getVulnerabilityTeamserverUrl was undefined");
}

/**
 * getStoredCredentials - retrieve teamserver credentials from chrome storage
 *
 * @return {Promise} - a promise that resolves to an object of stored teamserver credentials
 */
function getStoredCredentials() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(
      [
        CONTRAST_USERNAME,
        CONTRAST_SERVICE_KEY,
        CONTRAST_API_KEY,
        CONTRAST_ORG_UUID,
        TEAMSERVER_URL
      ],
      items => {
        if (!items) {
          reject(new Error("Error getting credentials"));
        } else {
          resolve(items);
        }
      }
    );
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
  return getStoredCredentials().then(items => {
    if (!items) throw new Error("Error retrieving credentials from storage");

    const url = getOrganizationVulnerabilitiesIdsUrl(
      items[TEAMSERVER_URL],
      items[CONTRAST_ORG_UUID],
      appId
    );
    const authHeader = getAuthorizationHeader(
      items[CONTRAST_USERNAME],
      items[CONTRAST_SERVICE_KEY]
    );
    const params = "?urls=" + urls;
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
  return getStoredCredentials().then(items => {
    const url = getVulnerabilityShortUrl(
      items[TEAMSERVER_URL],
      items[CONTRAST_ORG_UUID],
      traceUuid
    );
    const authHeader = getAuthorizationHeader(
      items[CONTRAST_USERNAME],
      items[CONTRAST_SERVICE_KEY]
    );

    return fetchTeamserver(url, "", authHeader, items[CONTRAST_API_KEY]);
  });
}

/**
 * getApplications - Get the applications that belong to an organization
 *
 * @return {Promise<Array>} A promise containing a list of applications in an organization
 */
function getOrgApplications() {
  return getStoredCredentials().then(items => {
    const url = getApplicationsUrl(
      items[TEAMSERVER_URL],
      items[CONTRAST_ORG_UUID]
    );
    const authHeader = getAuthorizationHeader(
      items[CONTRAST_USERNAME],
      items[CONTRAST_SERVICE_KEY]
    );

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
  const values = Object.values(credentials);

  return !!values && values.length > 0 && values.every(item => !!item);
}

/**
 * deDupeArray - remove duplicate vlues from array, indexOf finds the index of the first item in an array, so all similar items after the first will evaluate to false when compared to their position
 *
 * @param  {Array} array array from which to remove duplicates
 * @return {Array}       new, deduped array
 */
function deDupeArray(array) {
  return array.filter((item, position, self) => {
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
  const host = url.host.replace(":", "_");
  const hostArray = host.split(".");

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

  for (let i = 0; i < BLACKLIST_LENGTH; i++) {
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
  const contrast = [
    "/Contrast/api/ng/",
    "/Contrast/s/",
    "/Contrast/static/ng/index"
  ];

  // .some acts as an OR
  return contrast.some(c => url.includes(c));
}

/**
 * updateTabBadge - updates the extension badge on the toolbar
 *
 * @param  {Object} tab    Gives the state of the current tab
 * @param  {String} text   What the badge should display
 * @return {void}
 */
function updateTabBadge(tab, text = "", color = CONTRAST_GREEN) {
  if (!tab) return;
  try {
    chrome.tabs.get(tab.id, result => {
      if (!result) return;

      try {
        chrome.browserAction.getBadgeText({ tabId: tab.id }, badge => {
          if (badge !== "" && !badge) return;

          if (tab.index >= 0 && !chrome.runtime.lastError) {
            chrome.browserAction.setBadgeBackgroundColor({ color });
            chrome.browserAction.setBadgeText({ tabId: tab.id, text });
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

  chrome.browserAction.getBadgeText({ tabId: tab.id }, result => {
    if (result === "↻") {
      chrome.browserAction.getBadgeBackgroundColor({ tabId: tab.id }, color => {
        if (!color) {
          updateTabBadge(tab, "", CONTRAST_GREEN);
        } else {
          updateTabBadge(tab, "", color);
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
  const prefix = new URL(document.URL).origin;
  let prefixedUrls = traceUrls.map(u => {
    if (prefix && prefix !== "null") {
      return prefix + "/" + u;
    }
    return u;
  });

  let urls = traceUrls
    .concat(prefixedUrls)
    .map(u => {
      // return the full url
      // and the path / endpoint of the url
      return [btoa(u), btoa(new URL(u).pathname)];
    })
    .flatten();

  // return each base64 encoded url path with a common in between
  return urls.join(",");
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
    throw new Error(
      "Either no element or display received when setting display"
    );
  }
  try {
    element.style.display = display;
  } catch (e) {
    throw new Error(e);
  }
}

function setElementText(element, text) {
  if (!element || typeof text !== "string") {
    throw new Error(
      "Either no element or text received when setting element text"
    );
  }
  try {
    element.innerText = text;
  } catch (e) {
    throw new Error(e);
  }
}

function changeElementVisibility(element) {
  const classes = Array.prototype.slice.call(element.classList);
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
function hideElementAfterTimeout(element, callback = () => null) {
  setTimeout(() => {
    // eslint-disable-line consistent-return
    changeElementVisibility(element);
    return callback();
  }, 2000); // let the element linger
}

function loadingBadge(tab) {
  updateTabBadge(tab, "↻", CONTRAST_GREEN);
}

const CONTRAST_ICONS = {
  0: "contrast-on.png",
  1: "contrast-off.png",
  2: "contrast-not-configured.png"
};
function updateExtensionIcon(tab, image = 0) {
  const details = {
    tabId: tab.id,
    path: "/img/" + (typeof image === "number" ? CONTRAST_ICONS[image] : image)
  };
  if (!details.path) {
    throw new Error("update extension icon path is not set", details);
  }
  chrome.browserAction.setIcon(details);
  // chrome.browserAction.setIcon(object details, function callback)
}

function retrieveApplicationFromStorage(tab) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(STORED_APPS_KEY, result => {
      if (chrome.runtime.lastError) {
        reject(new Error("Error retrieving stored applications"));
      }

      if (!result || !result[STORED_APPS_KEY]) {
        result = { [STORED_APPS_KEY]: [] };
      }

      const url = new URL(tab.url);
      const host = getHostFromUrl(url);

      const application = result[STORED_APPS_KEY].filter(app => {
        return app.host === host;
      })[0];

      if (!application) {
        if (!isBlacklisted(tab.url) && !chrome.runtime.lastError) {
          try {
            updateExtensionIcon(tab, 1);
            updateTabBadge(tab, "");
            // updateTabBadge(tab, CONTRAST_CONFIGURE_TEXT, CONTRAST_YELLOW);
          } catch (e) {
            reject(new Error("Error updating tab badge"));
          }
        } else if (isBlacklisted(tab.url) && !chrome.runtime.lastError) {
          try {
            updateExtensionIcon(tab, 1);
            updateTabBadge(tab, "", CONTRAST_GREEN);
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
