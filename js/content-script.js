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

// window.addEventListener('load', collectFormActions)

// function removeVulnerabilities() {
//   chrome.runtime.sendMessage({ sender: "REMOVE_VULNERABILITIES" }, (response) => {
//     console.log("response in removeVulnerabilities", response);
//     if (response === "removed") {
//       collectFormActions()
//     }
//   })
// }
window.LOADING_ASYNC = false
/**
 * extractActionsFromForm - gets the form actions from each form in a collection
 *
 * @param  {HTMLCollection} forms collection of forms extracted from DOM
 * @return {Array<String>} array of form actions
 */
function extractActionsFromForm(forms) {
  let actions = []
  for (let i = 0; i < forms.length; i++) {
    let form = forms[i]
    let conditions = [
      !!form,
      !!form.action,
      form.action.length > 0
    ]
    if (conditions.every(c => !!c)) {
      actions.push(form.action)
    }
  }
  return actions
}

function parentHasDisplayNone(element) {
  while (element.tagName !== "BODY") {
    console.log(element);
    if (element.style.display === "none") {
      return true
    }
    element = element.parentNode
  }
  return false
}

function HTMLCollectionToArray(collection) {
  return Array.prototype.slice.call(collection)
}

function scrapeDOMForForms() {
  let formActions = []
  let forms = HTMLCollectionToArray(document.getElementsByTagName("form"))
  for (let i = 0; i < forms.length; i++) {
    // console.log("mutation test", mutationHasDisplayNone(forms[i]));
    if (parentHasDisplayNone(forms[i])) {
      forms.splice(i, 1)
    }
    addToggleListenerToForm(forms[i])
  }
  if (forms.length > 0) {
    formActions = formActions.concat(extractActionsFromForm(forms))
  }
  return formActions
}

/**
 * sendFormActionsToBackground - sends the array for form actions to background
 *
 * @param  {Array<String>} formActions - actions from forms, scraped from DOM
 * @return {void}
 */
function sendFormActionsToBackground(formActions) {
  chrome.runtime.sendMessage({
    sender: GATHER_FORMS_ACTION,
    formActions: deDupeArray(formActions)
  })
}

/**
 * collectFormActions - scrapes DOM for forms and collects their actions
 *
 * @return {void}
 */
function collectFormActions() {
  let messageSent = false
  console.log("collecting forms");
  // MutationObserver watches for changes in DOM elements
  // takes a callback reporting on mutations observed
  const obs = new MutationObserver((mutations, observer) => {
    console.log("new observer");
    // console.log(messageSent);
    // if forms have already been sent to backgroun for processing, don't repeat this
    if (messageSent) return;

    // let formActions = scrapeDOMForForms()

    // first check can we grab any forms using the simple html query methods

    // if no formActions were found using regular methods, check for them by diving into the mutated elements themselves
    if (formActions.length === 0) {
      const mLength = mutations.length
      for (let i = 0; i < mLength; i++) {
        let mutation = mutations[i]
        if (mutation.type === "attributes" && mutation.attributeName === "style" && mutation.target.style.display !== "none") {

          let mutatedForms = mutation.target.getElementsByTagName("form")
          if (!!mutatedForms && mutatedForms.length > 0) {
            console.log("found deep forms");
            formActions = formActions.concat(extractActionsFromForm(mutatedForms))
          }
        }
      }
    }
    // console.log("formActions", formActions);
    // send formActions to background and stop observation
    if (formActions.length > 0) {
      console.log("sending forms");
      messageSent = true
      // window.removeEventListener('load', collectFormActions)
      sendFormActionsToBackground(formActions)
    }
  });
  // console.log(obs);
  let formActions = scrapeDOMForForms()

  if (!!formActions && formActions.length > 0) {
    messageSent = true
    sendFormActionsToBackground(formActions)
    return;
  } else {
    obs.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    })
  }
}

// sender is tabId
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === GATHER_FORMS_ACTION) {
    if (document.getElementsByTagName("form").length > 0) {
      setTimeout(() => collectFormActions(), 1000)
    } else {
      collectFormActions()
    }
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
