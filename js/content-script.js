/*global
chrome,
document,
Helpers,
*/
"use strict";

const {
  TEAMSERVER_API_PATH_SUFFIX,
  TEAMSERVER_INDEX_PATH_SUFFIX,
  TEAMSERVER_ACCOUNT_PATH_SUFFIX,
  GATHER_FORMS_ACTION,
  CONTRAST_USERNAME,
  CONTRAST_SERVICE_KEY,
  CONTRAST_API_KEY,
  CONTRAST_ORG_UUID,
  CONTRAST_GREEN,
  STORED_APPS_KEY,
  TEAMSERVER_URL,
  GATHER_SCRIPTS,
  deDupeArray,
  getHostFromUrl,
} = Helpers;

// Apply different gloabls depending on how user navigates to a page
// https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigation
if (window.performance.navigation.type === 1) {
  window.CONTRAST__REFRESHED = true;
} else {
  window.CONTRAST__REFRESHED = false;
}

window.addEventListener("load", function() {
  chrome.runtime.sendMessage("EVALUATE_XHR")
  setTimeout(function() {
    window.CONTRAST__REFRESHED = false;
  }, 1000);
});

function _getLibraryVulnerabilities() {
  const retireJSURL = "https://raw.githubusercontent.com/RetireJS/retire.js/master/repository/jsrepository.json"
  const fetchOptions = {
    method: "GET",
  }
	return fetch(retireJSURL, fetchOptions)
	.then(response => {
    if (response.ok && response.status === 200) {
      return response.json();
    }
    return null;
  })
	.catch(new Error("Error getting js lib vulnerabilities"))
}

function _collectScripts(sendResponse) {
  _getLibraryVulnerabilities()
  .then(json => {
    const docScripts = [].slice.call(document.scripts).map(s => {
      let srcArray = s.src.split("/");
      return srcArray[srcArray.length - 1];
    });

    const sharedLibraries = _compareAppAndVulnerableLibraries(docScripts, json);
    console.log("sharedLibraries", sharedLibraries);

    if (!sharedLibraries || sharedLibraries.length === 0) {
      return sendResponse(null);
    } else {
      return sendResponse({ sharedLibraries });
    }
  })
  .catch(Error);
}

function _compareAppAndVulnerableLibraries(docScripts, vulnerableLibraries) {
  let documentScripts = docScripts.map(s => {
    if (s && s[0] && (/[a-z]/.test(s[0]))) {
      let jsFileName    = s;
      let parsedLibName = _parseJSFile(s);
      let parsedLibNameJS = parsedLibName + ".js";
      return { jsFileName, parsedLibName, parsedLibNameJS }
    }
  }).filter(Boolean)

  let sharedLibraries = []

  for (let key in vulnerableLibraries) {
    let vulnLib      = vulnerableLibraries[key];
    let vulnLibNames = [];
    vulnLibNames.push(key);

    if (vulnLib.bowername) {
      let bowernames = vulnLib.bowername.map(name => name.toLowerCase());
      vulnLibNames = vulnLibNames.concat(bowernames);
    }

    let shared = documentScripts.filter((script, index, self)  => {
      let conditions = [
        vulnLibNames.includes(script.jsFileName),
        vulnLibNames.includes(script.parsedLibName),
        vulnLibNames.includes(script.parsedLibNameJS),
      ];
      return conditions.some(Boolean);
    })
    if (shared[0]) {
      let found = sharedLibraries.find(script => {
        return shared[0].parsedLibName === script.parsedLibName;
      });
      if (!found) {
        let library = shared[0];
        let extractors = vulnLib.extractors
        library.name = key;
        library.extractors = extractors;
        library.vulnerabilities = vulnLib.vulnerabilities;
        sharedLibraries.push(library)
      }
    };
  }
  return sharedLibraries;
}

function _parseJSFile(jsFileName) {
  jsFileName = jsFileName.split(".js")[0];
  jsFileName = jsFileName.split(".min")[0];
  jsFileName = jsFileName.split("-min")[0];
  jsFileName = jsFileName.split("_min")[0];
  jsFileName = jsFileName.match(/([a-zA-Z]+\W)+/) ? jsFileName.match(/([a-zA-Z]+\W)+/)[0] : jsFileName;
  jsFileName = (/\W/).test(jsFileName[jsFileName.length - 1]) ? jsFileName.substr(0, jsFileName.length - 1) : jsFileName;
  return jsFileName;
}

//
//
// function _isScriptInBowername(bowernames, scripts) {
//   for (let i = 0, len = bowernames.length; i < len; i++) {
//     if (scripts.includes(bowernames[i])) {
//       return true
//     }
//   }
//   return false
// }


/**
* highlightForm - description
*
* @param  {Node} form - A form on the DOM
* @return {void}
*/
function highlightForm(traceUrls) {
  // only want the trace path names
  // traceUrls = traceUrls.map(t => new URL(t).pathname)
  if (!traceUrls || traceUrls.length === 0) return false;

  const forms = document.getElementsByTagName('form')
  for (let i = 0; i < forms.length; i++) {
    let form = forms[i];

    // webgoat makes loading forms interesting, so we need to go up the DOM tree and verify that the form, and the form's parents are displayed
    if (traceUrls.includes(form.action) && !parentHasDisplayNone(form)) {
      let inputs = form.getElementsByTagName('input');
      let input;
      for (let j = 0, len = inputs.length; j < len; j++) {
        if (!input && inputs[j].type === "submit") {
          input = inputs[j];
        }
      }

      // highlight with contrast aquamarine color
      if (input) {
        input.setAttribute("style",
          `border-radius: 5px;
          border: 3px solid ${CONTRAST_GREEN}`
        );

        return true;
      }
    }
  }
  return false;
}

/**
* extractActionsFromForm - gets the form actions from each form in a collection
*
* @param  {HTMLCollection} forms collection of forms extracted from DOM
* @return {Array<String>} array of form actions
*/
function extractActionsFromForm(forms) {
  let actions = [];
  for (let i = 0; i < forms.length; i++) {
    let form = forms[i];
    let conditions = [
      form,
      !!form.action && form.action.length > 0,
    ];
    if (conditions.every(c => !!c)) {
      actions.push(form.action);
    }
  }
  return actions;
}

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

/**
* HTMLCollectionToArray - convert a collection of html form to an array
*
* @param  {HTMLCollection} collection - Collection of html elements
* @return {Array<Node>}
*/
function HTMLCollectionToArray(collection) {
  return Array.prototype.slice.call(collection);
}

/**
 * scrapeDOMForForms - retrieve forms directly from the DOM
 *
 * @return {Array<String>} - an array of actions from forms
 */
function scrapeDOMForForms() {
  let forms       = [];
  let formActions = [];
  let domForms = HTMLCollectionToArray(document.getElementsByTagName("form"))
  for (let i = 0; i < domForms.length; i++) {
    // highlightForm(domForms[i])
    // only collect forms that are shown on DOM
    // don't use `.splice()` because that mutates array we're running loop on
    if (!parentHasDisplayNone(domForms[i])) {
      forms.push(domForms[i]);
    }
  }
  if (forms.length > 0) {
    formActions = formActions.concat(extractActionsFromForm(forms));
  }
  return formActions;
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
  });
}

/**
* collectFormActions - scrapes DOM for forms and collects their actions, uses a mutation observer for SPAs and only for a connected application
*
* @return {void}
*/
function collectFormActions(sendResponse) {
  chrome.storage.local.get(STORED_APPS_KEY, (result) => {

    if (chrome.runtime.lastError) return;
    if (!result || !result[STORED_APPS_KEY]) return;

    const url         = new URL(window.location.href);
    const host        = getHostFromUrl(url);
    const application = result[STORED_APPS_KEY].filter(app => app[host])[0];

    if (!application) return;

    let messageSent = false;
    // MutationObserver watches for changes in DOM elements
    // takes a callback reporting on mutations observed
    const obs = new MutationObserver((mutations, observer) => {
      // if forms have already been sent to backgroun for processing, don't repeat this
      if (messageSent) {
        observer.disconnect();
        return;
      }

      let formActions = [];

      // go through each mutation, looking for elements that have changed in a specific manner
      for (let i = 0, len = mutations.length; i < len; i++) {
        let mutation = mutations[i];

        let mutatedForms;
        if (mutation.target.tagName === "FORM") {
          mutatedForms = mutation.target;
        } else {
          mutatedForms = mutation.target.getElementsByTagName("form");
        }

        // if the mutated element has child forms
        if (!!mutatedForms && mutatedForms.length > 0) {
          let extractedActions = extractActionsFromForm(mutatedForms);
          formActions = formActions.concat(extractedActions);
        }
      }

      // send formActions to background and stop observation
      if (formActions.length > 0) {
        messageSent = true;
        sendFormActionsToBackground(formActions, sendResponse);
        window.CONTRAST__REFRESHED = false;
        observer.disconnect();
      }
    })

    // don't run this when page has been refreshed, rely on mutation observer instead, use === false to prevent running on undefined
    if (window.CONTRAST__REFRESHED === false) {
      const actions = scrapeDOMForForms();
      if (!!actions) {
        messageSent = true;
        sendFormActionsToBackground(actions, sendResponse);
        return;
      }
    }

    obs.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeOldValue: true,
      childList: true,
    });
  });
}

// sender is tabId
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === GATHER_FORMS_ACTION) {
    // in a SPA, forms can linger on the page as in chrome will notice them before all the new elements have been updated on the DOM
    // the setTimeout ensures that all JS updating has been completed before it checks the page for form elements
    if (document.getElementsByTagName("form").length > 0) {
      setTimeout(() => collectFormActions(sendResponse), 1000);
    } else {
      collectFormActions(sendResponse);
    }
  }

  else if (request.action === "GET_LIB_VERSION" && request.library) {
    const library    = request.library.parsedLibName.replace('-', '_');
    console.log(library);
    const libElement = document.getElementById(`__script_res_${library}`);
    let extractedLibraryVersion;
    try {
      console.log("libElement", libElement);
      extractedLibraryVersion = libElement.innerText;
    } catch (e) {
      sendResponse(null);
    }
    if (extractedLibraryVersion) {
      let versionArray = extractedLibraryVersion.split('_');
      sendResponse(versionArray[versionArray.length - 1]);
    } else {
      sendResponse(null)
    }
  }

  else if (request.action === "HIGHLIGHT_VULNERABLE_FORMS") {
    sendResponse(highlightForm(request.traceUrls));
  }

  else if (request.action === GATHER_SCRIPTS) {
    _collectScripts(sendResponse);
  }

  else if (request.url !== undefined && request.action === "INITIALIZE") {
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

  // This function becomes invalid when the event listener returns, unless you return true from the event listener to indicate you wish to send a response asynchronously (this will keep the message channel open to the other end until sendResponse is called).
  return true; // NOTE: Keep this
});
