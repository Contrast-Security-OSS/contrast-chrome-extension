/*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
/*global
chrome,
document,
getHostFromUrl,
deDupeArray,
STORED_APPS_KEY,
GATHER_FORMS_ACTION,
CONTRAST_GREEN,
*/

"use strict";

function ContrastForm(forms) {
  this.forms = forms;
}

ContrastForm.MESSAGE_SENT = false;

/**
 * extractActionsFromForm - gets the form actions from each form in a collection
 *
 * @param  {HTMLCollection} forms collection of forms extracted from DOM
 * @return {Array<String>} array of form actions
 */
ContrastForm._extractActionsFromForm = function(forms) {
  let actions = [];
  for (let i = 0; i < forms.length; i++) {
    let form = forms[i];
    let conditions = [form, !!form.action && form.action.length > 0];
    if (conditions.every(Boolean)) {
      actions.push(form.action);
    }
  }
  return actions;
};

/**
 * collectFormActions - scrapes DOM for forms and collects their actions, uses a mutation observer for SPAs and only for a connected application
 *
 * @return {void}
 */
ContrastForm.collectFormActions = function(sendResponse) {
  chrome.storage.local.get(STORED_APPS_KEY, result => {
    if (chrome.runtime.lastError) return;
    if (!result || !result[STORED_APPS_KEY]) return;

    const url = new URL(window.location.href);
    const host = getHostFromUrl(url);
    const application = result[STORED_APPS_KEY].filter(
      app => app.host === host
    )[0];

    if (!application) return;

    // don't run this when page has been refreshed, rely on mutation observer instead, use === false to prevent running on undefine
    const actions = this._scrapeDOMForForms() || [];
    this.MESSAGE_SENT = true;
    this._sendFormActionsToBackground(actions, sendResponse);
    return;
  });
};

/**
 *
 */
ContrastForm._collectMutatedForms = function(
  mutations,
  observer,
  sendResponse
) {
  const formActions = this._getFormsFromMutations(mutations);

  // send formActions to background and stop observation
  if (formActions.length > 0) {
    ContrastForm.MESSAGE_SENT = true;
    this._sendFormActionsToBackground(formActions, sendResponse);
    window.CONTRAST__REFRESHED = false;
    observer.disconnect();
  }
}.bind(ContrastForm);

/**
 * ContrastForm - description
 *
 * @param  {HTMLCollection} mutations - elements that have mutated
 * @return {Array}                    - actions on forms
 */
ContrastForm._getFormsFromMutations = function(mutations) {
  let formActions = [];

  // go through each mutation, looking for elements that have changed in a specific manner
  return mutations
    .map(mutation => {
      let mutatedForms;
      if (mutation.target.tagName === "FORM") {
        mutatedForms = mutation.target;
      } else {
        mutatedForms = mutation.target.getElementsByTagName("form");
      }

      // if the mutated element has child forms
      if (!!mutatedForms && mutatedForms.length > 0) {
        let actions = this._extractActionsFromForm(mutatedForms);
        return formActions.concat(actions);
      }
      return null;
    })
    .filter(Boolean);
};

/**
 * _scrapeDOMForForms - retrieve forms directly from the DOM
 *
 * @return {Array<String>} - an array of actions from forms
 */
ContrastForm._scrapeDOMForForms = function() {
  let forms = [];
  let formActions = [];
  let domForms = document.getElementsByTagName("form");
  for (let i = 0; i < domForms.length; i++) {
    // highlightForm(domForms[i])
    // only collect forms that are shown on DOM
    // don't use `.splice()` because that mutates array we're running loop on
    if (!parentHasDisplayNone(domForms[i])) {
      forms.push(domForms[i]);
    }
  }
  if (forms.length > 0) {
    formActions = formActions.concat(this._extractActionsFromForm(forms));
  }
  return formActions;
};

/**
 * _sendFormActionsToBackground - sends the array for form actions to background
 *
 * @param  {Array<String>} formActions - actions from forms, scraped from DOM
 * @return {void}
 */
ContrastForm._sendFormActionsToBackground = function(
  formActions,
  sendResponse
) {
  sendResponse({
    sender: GATHER_FORMS_ACTION,
    formActions: deDupeArray(formActions.flatten())
  });
};

/**
 * highlightForm - description
 *
 * @param  {Node} form - A form on the DOM
 * @return {void}
 */
ContrastForm.highlightForms = function(traceUrls) {
  // only want the trace path names
  // traceUrls = traceUrls.map(t => new URL(t).pathname)
  if (!traceUrls || traceUrls.length === 0) return false;

  const forms = document.getElementsByTagName("form");
  for (let i = 0; i < forms.length; i++) {
    let form = forms[i];

    // webgoat makes loading forms interesting, so we need to go up the DOM tree and verify that the form, and the form's parents are displayed
    if (traceUrls.includes(form.action) && !parentHasDisplayNone(form)) {
      if (this._highlightSubmitInput(form)) {
        return true;
      }
    }
  }
  return false;
};

/**
 * ContrastForm - description
 *
 * @param  {HTMLNode} form - form to highlight
 * @return {Boolean}
 */
ContrastForm._highlightSubmitInput = function(form) {
  let inputs = form.getElementsByTagName("input");
  let input;
  for (let j = 0, len = inputs.length; j < len; j++) {
    if (!input && inputs[j].type === "submit") {
      input = inputs[j];
    }
  }

  // highlight with contrast aquamarine color
  if (input) {
    input.setAttribute(
      "style",
      `border-radius: 5px;
      border: 3px solid ${CONTRAST_GREEN}`
    );

    return true;
  }
  return false;
};

/**
 * parentHasDisplayNone - checks if any parent elements of a node has display: none styling
 *
 * @param  {Node} element an HTML element
 * @return {Boolean}      if that element has a parent with display: none
 */
function parentHasDisplayNone(element) {
  while (element.tagName !== "BODY") {
    if (element.style.display === "none") return true;
    element = element.parentNode;
  }
  return false;
}
