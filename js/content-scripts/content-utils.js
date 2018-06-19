// allow ununed vars in this file since they are used throughout other files
/*eslint no-unused-vars: "off"*/
/*global
XMLHttpRequest, btoa, chrome
*/

// keys for credentials
const CONTRAST_USERNAME    = "contrast_username";
const CONTRAST_SERVICE_KEY = "contrast_service_key";
const CONTRAST_API_KEY     = "contrast_api_key";
const CONTRAST_ORG_UUID    = "contrast_org_uuid";
const TEAMSERVER_URL       = "teamserver_url";

const TEAMSERVER_INDEX_PATH_SUFFIX   = "/Contrast/static/ng/index.html#/";
const TEAMSERVER_API_PATH_SUFFIX     = "/Contrast/api";
const TEAMSERVER_ACCOUNT_PATH_SUFFIX = "/account";
const TEAMSERVER_PROFILE_PATH_SUFFIX = "/account/profile";

// Contrast stylings and configuration text
const CONTRAST_GREEN           = "#65C0B2" // or is it #3CC3B2?;

// chrome storage and message event keys
const GATHER_FORMS_ACTION = "contrast__gatherForms";
const STORED_APPS_KEY     = "contrast__APPS";

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
  "reddit.com",
];
const BLACKLIST_LENGTH    = BLACKLISTED_DOMAINS.length;

function flatten(array) {
  return array.reduce((newArray, val) => newArray.concat(val), []);
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
* @return {type}     description
*/
function getHostFromUrl(url) {
  const host      = url.host.split(":").join("_");
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
* retrieveApplicationFromStorage - get the name of an application from storage by using those host/domain name of the current tab url
*
* @param  {Object} url - an object with a url key
* @return {Promise<String>}       the name of the application
*/
function retrieveApplicationFromStorage(tab) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(STORED_APPS_KEY, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error("Error retrieving stored applications"));
      }

      if (!result || !result[STORED_APPS_KEY]) {
        result = { APPS: [] };
      }
      const url  = new URL(tab.url);
      const host = getHostFromUrl(url);

      let application;
      if (!!result[STORED_APPS_KEY]) {
        application = result[STORED_APPS_KEY].filter(app => app[host])[0];
      }

      if (!application) {
        if (!isBlacklisted(tab.url) && !chrome.runtime.lastError) {
          try {
            updateTabBadge(url, CONTRAST_CONFIGURE_TEXT, CONTRAST_YELLOW);
          } catch (e) {
            reject(new Error("Error updating url badge"))
          }
        } else if (isBlacklisted(tab.url) && !chrome.runtime.lastError) {
          try {
            updateTabBadge(url, '', CONTRAST_GREEN);
          } catch (e) {
            reject(new Error("Error updating tab badge"))
          }
        }
        resolve(null);
      }

      resolve(application);
    });
  });
}
