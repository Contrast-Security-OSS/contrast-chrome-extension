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
if (window.performance.navigation.type === 1) {
  window.CONTRAST__REFRESHED = true;
} else {
  window.CONTRAST__REFRESHED = false;
}

window.addEventListener("load", function() {
  retrieveApplicationFromStorage({ url: window.location.href })
  .then(application => {
    if (application) {
      console.log("application", application);
      chrome.runtime.sendMessage({ action: EVALUATE_XHR, application });
    }
  })
  .catch(() => new Error("Error getting application from storage"));

  setTimeout(function() {
    window.CONTRAST__REFRESHED = false;
  }, 1000);
});


// sender is tabId
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === GATHER_FORMS_ACTION) {
    // in a SPA, forms can linger on the page as in chrome will notice them before all the new elements have been updated on the DOM
    // the setTimeout ensures that all JS updating has been completed before it checks the page for form elements
    if (document.getElementsByTagName("form").length > 0) {
      setTimeout(() => ContrastForm.collectFormActions(sendResponse), 1000);
    } else {
      ContrastForm.collectFormActions(sendResponse);
    }
  }

  else if (request.action === "HIGHLIGHT_VULNERABLE_FORMS") {
    sendResponse(ContrastForm.highlightForms(request.traceUrls));
  }

  else if (request.url !== undefined && request.action === "INITIALIZE") {
    _initializeContrast(request, sendResponse);
  }

  // This function becomes invalid when the event listener returns, unless you return true from the event listener to indicate you wish to send a response asynchronously (this will keep the message channel open to the other end until sendResponse is called).
  return true; // NOTE: Keep this
});

function _initializeContrast(request, sendResponse) {
  const tsIndex   = request.url.indexOf(TEAMSERVER_INDEX_PATH_SUFFIX);
  const tsAccount = request.url.indexOf(TEAMSERVER_ACCOUNT_PATH_SUFFIX);

  const teamServerUrl = request.url.substring(
    0, tsIndex) + TEAMSERVER_API_PATH_SUFFIX;
  const orgUuid = request.url.substring(
    tsIndex + TEAMSERVER_INDEX_PATH_SUFFIX.length, tsAccount);

  const profileEmail = document.getElementsByClassName('profile-email').item(0).textContent;
  const apiKey = document.getElementsByClassName('org-key').item(0).textContent;
  const serviceKey = document.getElementsByClassName('org-key').item(1).textContent;

  chrome.storage.local.set({
    [CONTRAST_USERNAME]: profileEmail.trim(),
    [CONTRAST_SERVICE_KEY]: serviceKey.trim(),
    [CONTRAST_API_KEY]: apiKey.trim(),
    [CONTRAST_ORG_UUID]: orgUuid.trim(),
    [TEAMSERVER_URL]: teamServerUrl,
  }, () => {
    if (chrome.runtime.lastError) {
      throw new Error("Error setting configuration");
    }
    sendResponse("INITIALIZED");
  });
}
