"use strict";

// allow ununed vars in this file since they are used throughout other files
/*eslint no-unused-vars: "off"*/
/*global
XMLHttpRequest, btoa, chrome
*/

// keys for credentials
var CONTRAST_USERNAME = "contrast_username";
var CONTRAST_SERVICE_KEY = "contrast_service_key";
var CONTRAST_API_KEY = "contrast_api_key";
var CONTRAST_ORG_UUID = "contrast_org_uuid";
var TEAMSERVER_URL = "teamserver_url";

var TEAMSERVER_INDEX_PATH_SUFFIX = "/Contrast/static/ng/index.html#/";
var TEAMSERVER_ACCOUNT_PATH_SUFFIX = "/account";
var TEAMSERVER_PROFILE_PATH_SUFFIX = "/account/profile";

// Contrast stylings and configuration text
var CONTRAST_GREEN = "#65C0B2"; // or is it #3CC3B2?;

// chrome storage and message event keys
var GATHER_FORMS_ACTION = "contrast__gatherForms";
var STORED_APPS_KEY = "contrast__APPS";

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
* @return {type}     description
*/
function getHostFromUrl(url) {
  var host = url.host.split(":").join("_");
  var hostArray = host.split(".");

  if (hostArray.length < 3) {
    return hostArray[0];
  } else if (hostArray.length === 3) {
    return hostArray[1];
  }
  return host;
}