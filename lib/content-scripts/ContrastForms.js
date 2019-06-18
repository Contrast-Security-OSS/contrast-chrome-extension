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
ContrastForm._extractActionsFromForm = function (forms) {
  var actions = [];
  for (var i = 0; i < forms.length; i++) {
    var form = forms[i];
    var conditions = [form, !!form.action && form.action.length > 0];
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
ContrastForm.collectFormActions = function (sendResponse) {
  var _this = this;

  chrome.storage.local.get(STORED_APPS_KEY, function (result) {
    if (chrome.runtime.lastError) return;
    if (!result || !result[STORED_APPS_KEY]) return;

    var url = new URL(window.location.href);
    var host = getHostFromUrl(url);
    var application = result[STORED_APPS_KEY].filter(function (app) {
      return app.host === host;
    })[0];

    if (!application) return;

    // don't run this when page has been refreshed, rely on mutation observer instead, use === false to prevent running on undefine
    var actions = _this._scrapeDOMForForms() || [];
    _this.MESSAGE_SENT = true;
    _this._sendFormActionsToBackground(actions, sendResponse);
    return;
  });
};

/**
 *
 */
ContrastForm._collectMutatedForms = function (mutations, observer, sendResponse) {
  var formActions = this._getFormsFromMutations(mutations);

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
ContrastForm._getFormsFromMutations = function (mutations) {
  var _this2 = this;

  var formActions = [];

  // go through each mutation, looking for elements that have changed in a specific manner
  return mutations.map(function (mutation) {
    var mutatedForms = void 0;
    if (mutation.target.tagName === "FORM") {
      mutatedForms = mutation.target;
    } else {
      mutatedForms = mutation.target.getElementsByTagName("form");
    }

    // if the mutated element has child forms
    if (!!mutatedForms && mutatedForms.length > 0) {
      var actions = _this2._extractActionsFromForm(mutatedForms);
      return formActions.concat(actions);
    }
    return null;
  }).filter(Boolean);
};

/**
 * _scrapeDOMForForms - retrieve forms directly from the DOM
 *
 * @return {Array<String>} - an array of actions from forms
 */
ContrastForm._scrapeDOMForForms = function () {
  var forms = [];
  var formActions = [];
  var domForms = document.getElementsByTagName("form");
  for (var i = 0; i < domForms.length; i++) {
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
ContrastForm._sendFormActionsToBackground = function (formActions, sendResponse) {
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
ContrastForm.highlightForms = function (traceUrls) {
  // only want the trace path names
  // traceUrls = traceUrls.map(t => new URL(t).pathname)
  if (!traceUrls || traceUrls.length === 0) return false;

  var forms = document.getElementsByTagName("form");
  for (var i = 0; i < forms.length; i++) {
    var form = forms[i];

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
ContrastForm._highlightSubmitInput = function (form) {
  var inputs = form.getElementsByTagName("input");
  var input = void 0;
  for (var j = 0, len = inputs.length; j < len; j++) {
    if (!input && inputs[j].type === "submit") {
      input = inputs[j];
    }
  }

  // highlight with contrast aquamarine color
  if (input) {
    input.setAttribute("style", "border-radius: 5px;\n      border: 3px solid " + CONTRAST_GREEN);

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