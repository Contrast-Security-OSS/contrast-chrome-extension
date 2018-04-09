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
    // addToggleListenerToForm(forms[i])
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
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      sender: GATHER_FORMS_ACTION,
      formActions: deDupeArray(formActions)
    })
    resolve()
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
    // if forms have already been sent to backgroun for processing, don't repeat this
    if (messageSent) {
      observer.disconnect()
      return
    }

    let formActions = []
    const mLength = mutations.length

    // go through each mutation, looking for elements that have changed in a specific manner
    for (let i = 0; i < mLength; i++) {
      let mutation = mutations[i]
      if (!mutation.oldValue) continue;

      // mutation must be a style attribute mutation
      // and the style must change from display: none to display: <shown>
      let conditions = [
        mutation.type === "attributes",
        mutation.attributeName === "style",
        mutation.oldValue.includes("display"),
        mutation.oldValue.includes("none")
      ]

      if (conditions.every(c => !!c)) {

        let mutatedForms;
        if (mutation.target.tagName === "FORM") {
          mutatedForms = mutation.target
        } else {
          mutatedForms = mutation.target.getElementsByTagName("form")
        }

        // if the mutated element has child forms
        if (!!mutatedForms && mutatedForms.length > 0) {
          let extractedActions = extractActionsFromForm(mutatedForms)
          formActions = formActions.concat(extractedActions)
        }
      }
    }

    // send formActions to background and stop observation
    if (formActions.length > 0) {
      console.log("sending forms");
      messageSent = true
      sendFormActionsToBackground(formActions)
    }
  })

  const actions = scrapeDOMForForms()
  if (!!actions && actions.length > 0) {
    sendFormActionsToBackground(actions)
    return;
  }

  obs.observe(document.body, {
    subtree: true,
    attributes: true,
    attributeFilter: ["style"],
    attributeOldValue: true,
    childList: true,
    characterData: true,
  })
}

// check if url has changed
let URL_CHANGED = false
window.addEventListener('hashchange', (e) => URL_CHANGED = true)

// sender is tabId
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === GATHER_FORMS_ACTION) {

    // in a SPA, forms can linger on the page as in chrome will notice them before all the new elements have been updated on the DOM
    // the setTimeout ensures that all JS updating has been completed before it checks the page for form elements
    if (document.getElementsByTagName("form").length > 0) {
      console.log("waiting one");
      setTimeout(() => collectFormActions(), 1000)
    } else {
      collectFormActions()
    }
    return;
  }

  else if (request.action === "URL_CHANGED?") {
    // URL_CHANGED use window listener with global var
    // window.performance.navigation.type === 1 detects refresh
    // https://stackoverflow.com/a/36444134/6410635
    //
    console.log("URL_CHANGED", URL_CHANGED);
    const refreshed = window.performance.navigation.type === 1
    sendResponse({ urlChanged: URL_CHANGED, refreshed })
  }

  else if (request.action === "RESET_URL_CHANGED") {
    URL_CHANGED = false
  }

  else if (request.url !== undefined) {

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
    }, () => {})
  }
})
