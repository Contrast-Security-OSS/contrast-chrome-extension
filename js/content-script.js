/*global
chrome,
document,
TEAMSERVER_INDEX_PATH_SUFFIX,
TEAMSERVER_API_PATH_SUFFIX,
TEAMSERVER_ACCOUNT_PATH_SUFFIX,
MutationObserver,
GATHER_FORMS_ACTION,
deDupeArray,
*/
"use strict";

if (window.performance.navigation.type === 1) {
  window.REFRESHED = true
}

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
      form,
      form.action,
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
  let forms = []
  let formActions = []
  let domForms = HTMLCollectionToArray(document.getElementsByTagName("form"))
  for (let i = 0; i < domForms.length; i++) {

    // only collect forms that are shown on DOM
    // don't use `.splice()` because that mutates array we're running loop on
    if (!parentHasDisplayNone(domForms[i])) {
      forms.push(domForms[i])
    }
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
function sendFormActionsToBackground(formActions, sendResponse) {
  sendResponse({
    sender: GATHER_FORMS_ACTION,
    formActions: deDupeArray(formActions)
  })
}

/**
 * collectFormActions - scrapes DOM for forms and collects their actions
 *
 * @return {void}
 */
function collectFormActions(sendResponse) {
  let messageSent = false
  // MutationObserver watches for changes in DOM elements
  // takes a callback reporting on mutations observed
  const obs = new MutationObserver((mutations, observer) => {
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

    // send formActions to background and stop observation
    if (formActions.length > 0) {
      messageSent = true
      sendFormActionsToBackground(formActions, sendResponse)
      window.REFRESHED = false
      observer.disconnect()
    }
  })

  // don't run this when page has been refreshed, rely on mutation observer instead, use === false to prevent running on undefined
  if (window.REFRESHED === false) {
    const actions = scrapeDOMForForms()
    if (!!actions) {
      messageSent = true
      sendFormActionsToBackground(actions, sendResponse)
      return;
    }
  }

  obs.observe(document.body, {
    subtree: true,
    attributes: true,
    attributeOldValue: true,
    childList: true,
    characterData: true,
  })
}

// sender is tabId
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === GATHER_FORMS_ACTION) {

    // in a SPA, forms can linger on the page as in chrome will notice them before all the new elements have been updated on the DOM
    // the setTimeout ensures that all JS updating has been completed before it checks the page for form elements
    //

    if (document.getElementsByTagName("form").length > 0) {
      setTimeout(() => collectFormActions(sendResponse), 1000)
    } else {
      collectFormActions(sendResponse)
    }
  }

  else if (request.url !== undefined) {

    const teamServerUrl = request.url.substring(0, request.url.indexOf(TEAMSERVER_INDEX_PATH_SUFFIX)) + TEAMSERVER_API_PATH_SUFFIX
    const orgUuid = request.url.substring(request.url.indexOf(TEAMSERVER_INDEX_PATH_SUFFIX) + TEAMSERVER_INDEX_PATH_SUFFIX.length,
    request.url.indexOf(TEAMSERVER_ACCOUNT_PATH_SUFFIX))

    const profileEmail = document.getElementsByClassName('profile-email').item(0).textContent;
    const apiKey = document.getElementsByClassName('org-key').item(0).textContent;
    const serviceKey = document.getElementsByClassName('org-key').item(1).textContent;

    chrome.storage.local.set({
      'contrast_username': profileEmail.trim(),
      'contrast_service_key': serviceKey.trim(),
      'contrast_api_key': apiKey.trim(),
      'contrast_org_uuid': orgUuid.trim(),
      'teamserver_url': teamServerUrl
    }, () => {})
  }

  // This function becomes invalid when the event listener returns, unless you return true from the event listener to indicate you wish to send a response asynchronously (this will keep the message channel open to the other end until sendResponse is called).
  return true // NOTE: Keep this
})
