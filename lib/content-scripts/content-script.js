/*global
chrome,
document,
ContrastForm,
retrieveApplicationFromStorage,
TEAMSERVER_INDEX_PATH_SUFFIX,
TEAMSERVER_API_PATH_SUFFIX,
TEAMSERVER_ACCOUNT_PATH_SUFFIX,
GATHER_FORMS_ACTION,
CONTRAST_USERNAME,
CONTRAST_SERVICE_KEY,
CONTRAST_API_KEY,
CONTRAST_ORG_UUID,
TEAMSERVER_URL,
EVALUATE_XHR,
MutationObserver,
TEAMSERVER_API_PATH_SUFFIX,
*/
"use strict";

// Apply different gloabls depending on how user navigates to a page
// https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigation

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

if (window.performance.navigation.type === 1) {
  window.CONTRAST__REFRESHED = true;
} else {
  window.CONTRAST__REFRESHED = false;
}

window.addEventListener("load", function () {
  retrieveApplicationFromStorage({ url: window.location.href }).then(function (application) {
    if (application) {
      chrome.runtime.sendMessage(EVALUATE_XHR);
    }
  }).catch(function () {
    return new Error("Error getting application from storage");
  });

  setTimeout(function () {
    window.CONTRAST__REFRESHED = false;
  }, 1000);
});

// sender is tabId
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === GATHER_FORMS_ACTION) {
    // in a SPA, forms can linger on the page as in chrome will notice them before all the new elements have been updated on the DOM
    // the setTimeout ensures that all JS updating has been completed before it checks the page for form elements
    if (document.getElementsByTagName("form").length > 0) {
      setTimeout(function () {
        return ContrastForm.collectFormActions(sendResponse);
      }, 1000);
    } else {
      ContrastForm.collectFormActions(sendResponse);
    }
  } else if (request.action === "HIGHLIGHT_VULNERABLE_FORMS") {
    sendResponse(ContrastForm.highlightForms(request.traceUrls));
  } else if (request.url !== undefined && request.action === "INITIALIZE") {
    _initializeContrast(request, sendResponse);
  }

  // This function becomes invalid when the event listener returns, unless you return true from the event listener to indicate you wish to send a response asynchronously (this will keep the message channel open to the other end until sendResponse is called).
  return true; // NOTE: Keep this
});

function _initializeContrast(request, sendResponse) {
  var _chrome$storage$local;

  var tsIndex = request.url.indexOf(TEAMSERVER_INDEX_PATH_SUFFIX);
  var tsAccount = request.url.indexOf(TEAMSERVER_ACCOUNT_PATH_SUFFIX);

  var teamServerUrl = request.url.substring(0, tsIndex) + TEAMSERVER_API_PATH_SUFFIX;
  var orgUuid = request.url.substring(tsIndex + TEAMSERVER_INDEX_PATH_SUFFIX.length, tsAccount);

  var profileEmail = document.getElementsByClassName('profile-email').item(0).textContent;
  var apiKey = document.getElementsByClassName('org-key').item(0).textContent;
  var serviceKey = document.getElementsByClassName('org-key').item(1).textContent;

  chrome.storage.local.set((_chrome$storage$local = {}, _defineProperty(_chrome$storage$local, CONTRAST_USERNAME, profileEmail.trim()), _defineProperty(_chrome$storage$local, CONTRAST_SERVICE_KEY, serviceKey.trim()), _defineProperty(_chrome$storage$local, CONTRAST_API_KEY, apiKey.trim()), _defineProperty(_chrome$storage$local, CONTRAST_ORG_UUID, orgUuid.trim()), _defineProperty(_chrome$storage$local, TEAMSERVER_URL, teamServerUrl), _chrome$storage$local), function () {
    if (chrome.runtime.lastError) {
      throw new Error("Error setting configuration");
    }
    sendResponse("INITIALIZED");
  });
}