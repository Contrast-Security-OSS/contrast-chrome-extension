/*global
chrome, getOrganizationVulnerabilityesIds, document, TEAMSERVER_INDEX_PATH_SUFFIX,
TEAMSERVER_API_PATH_SUFFIX,
TEAMSERVER_ACCOUNT_PATH_SUFFIX, MutationObserver, HTML_BODY,
CONTRAST_USERNAME,
CONTRAST_SERVICE_KEY,
CONTRAST_API_KEY,
CONTRAST_ORG_UUID,
TEAMSERVER_URL
*/
"use strict";


// const body = document.getElementsByTagName('body')[0]
// document.addEventListener("load", function(e) {
//   console.log("gathering forms after window loaded", e);
//   // setTimeout(() => {
//     const forms = document.getElementsByTagName('form')
//     let formActions = []
//
//     // collect form actions into an array
//     for (let i = 0; i < forms.length; i++) {
//       let action = forms[i].action
//       if (!!action) {
//         formActions.push(action)
//       }
//     }
//     console.log("window forms sent", formActions);
//     chrome.runtime.sendMessage({ formActions })
//   // }, 10000)
//
// })

/**
 * getFormActions - description
 *
 * @param  {HTMLCollection} forms collection of forms extracted from DOM
 * @return {Array<String>} array of form actions
 */
function getFormActions(forms) {
  let actions = []
  for (let i = 0; i < forms.length; i++) {
    let form = forms[i]
    if (!!form && !!form.action && form.action.length > 0) {
      actions.push(form.action)
    }
  }
  return actions
}

window.addEventListener('load', (event) => {

    let messageSent = false

    // MutationObserver watches for changes in DOM elements
    // takes a callback reporting on mutations observed
    const obs = new MutationObserver((mutations, observer) => {

      // if forms have already been sent to backgroun for processing, don't repeat this
      if (messageSent) return;
      
      let formActions = []

      // first check can we grab any forms using the simple html query methods
      const docForms = document.getElementsByTagName("form")
      const qForms   = document.querySelectorAll("form")
      if (docForms.length > 0) {
        formActions = formActions.concat(getFormActions(docForms))
      }
      if (qForms.length > 0) {
        formActions = formActions.concat(getFormActions(qForms))
      }

      // if no formActions were found using regular methods, check for them by diving into the mutated elements themselves
      if (formActions.length === 0) {
        for (let i = 0; i < mutations.length; i++) {
          let mutation = mutations[i]
          if (mutation.type === "attributes" && mutation.attributeName === "style") {
            let mutatedForms = mutation.target.getElementsByTagName("form")
            if (!!mutatedForms && mutatedForms.length > 0) {
              console.log("found deep forms");
              formActions = formActions.concat(getFormActions(mutatedForms))
            }
          }
        }
      }

      // send formActions to background and stop observation
      if (formActions.length > 0) {
        console.log("sending forms");
        messageSent = true
        window.removeEventListener('load', event)
        chrome.runtime.sendMessage({
          sender: GATHER_FORMS_ACTION,
          formActions: deDupeArray(formActions)
        })
      }

    });

    obs.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    })
})

// sender is tabId
function collectFormActions(request, sender, sendResponse) {
  // console.log("collecting forms");
  // make sure new html is loaded before collecting forms
  // document.addEventListener('DOMContentLoaded', () => {

    var forms = document.getElementsByTagName('form'),
    formActions = []

    // collect form actions into an array
    for (var i = 0; i < forms.length; i++) {
      var action = forms[i].action
      if (!!action) {
        formActions.push(action)
      }
    }
    // console.log("formActions", formActions);

    // send response back to background with array of form actions
    // form actions will be sent to Teamserver API for querying
    // sendResponse({ formActions: formActions })
  // })
}

// sender is tabId
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === GATHER_FORMS_ACTION) {
    collectFormActions(request, sender, sendResponse)
    return;
  }

  if (request.url !== undefined) {

    var teamServerUrl = request.url.substring(0, request.url.indexOf(TEAMSERVER_INDEX_PATH_SUFFIX)) + TEAMSERVER_API_PATH_SUFFIX,
    orgUuid = request.url.substring(request.url.indexOf(TEAMSERVER_INDEX_PATH_SUFFIX) + TEAMSERVER_INDEX_PATH_SUFFIX.length,
    request.url.indexOf(TEAMSERVER_ACCOUNT_PATH_SUFFIX)),
    profileEmail, apiKey, serviceKey;

    profileEmail = document.getElementsByClassName('profile-email').item(0).textContent;
    apiKey = document.getElementsByClassName('org-key').item(0).textContent;
    serviceKey = document.getElementsByClassName('org-key').item(1).textContent;

    chrome.storage.local.set({
      'contrast_username': profileEmail.trim(),
      'contrast_service_key': serviceKey.trim(),
      'contrast_api_key': apiKey.trim(),
      'contrast_org_uuid': orgUuid.trim(),
      'teamserver_url': teamServerUrl
    }, function () {
      return;
    });
  }
}
);
