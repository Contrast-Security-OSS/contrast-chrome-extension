/*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
/*global
chrome,
document,
ContrastForm,
TEAMSERVER_INDEX_PATH_SUFFIX,
TEAMSERVER_API_PATH_SUFFIX,
GATHER_FORMS_ACTION,
HIGHLIGHT_VULNERABLE_FORMS,
CONTRAST_USERNAME,
CONTRAST_SERVICE_KEY,
CONTRAST_API_KEY,
CONTRAST_ORG_UUID,
GATHER_SCRIPTS,
TEAMSERVER_URL,
LOADING_DONE,
MutationObserver,
TEAMSERVER_API_PATH_SUFFIX,
CONTRAST_WAPPALIZE,
CONTRAST_INITIALIZE,
CONTRAST_INITIALIZED,
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
  chrome.runtime.sendMessage({ action: LOADING_DONE });

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

  else if (request.action === HIGHLIGHT_VULNERABLE_FORMS) {
    sendResponse(ContrastForm.highlightForms(request.formActions));
  }

  else if (request.url !== undefined && request.action === CONTRAST_INITIALIZE) {
    _initializeContrast(request, sendResponse);
  }

  else if (request.action === "GET_LIB_VERSION" && request.library) {
    const library    = request.library.parsedLibName.replace('-', '_');
    const libElement = document.getElementById(`__script_res_${library}`);
    let extractedLibraryVersion;
    try {
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

  else if (request.action === GATHER_SCRIPTS) {
    _collectScripts(request.tab)
    .then(sharedLibraries => sendResponse(sharedLibraries))
    .catch(error => { error });
  }

  // This function becomes invalid when the event listener returns, unless you return true from the event listener to indicate you wish to send a response asynchronously (this will keep the message channel open to the other end until sendResponse is called).
  return true; // NOTE: Keep this
});

function _dataQuery(key) {
  const dataAttr = 'data-contrast-scrape';
  const keys = {
    0: 'contrast-api-key',
    1: 'contrast-organization-uuid',
    2: 'contrast-contrast-url',
    3: 'contrast-service-key',
    4: 'contrast-username',
  }
  return document.querySelector(`[${dataAttr}=${keys[key]}]`).textContent;
}

function _initializeContrast(request, sendResponse) {

  const tsIndex = request.url.indexOf(TEAMSERVER_INDEX_PATH_SUFFIX);
  const teamServerUrl = request.url.substring(
    0, tsIndex) + TEAMSERVER_API_PATH_SUFFIX;

  const apiKey        = _dataQuery(0);
  const orgUuid       = _dataQuery(1);
  // const teamServerUrl = _dataQuery(2);
  const serviceKey    = _dataQuery(3);
  const profileEmail  = _dataQuery(4);

  const contrastObj = {
    [CONTRAST_USERNAME]: profileEmail,
    [CONTRAST_SERVICE_KEY]: serviceKey,
    [CONTRAST_API_KEY]: apiKey,
    [CONTRAST_ORG_UUID]: orgUuid,
    [TEAMSERVER_URL]: teamServerUrl,
  };
  chrome.storage.local.set(contrastObj, () => {
    if (chrome.runtime.lastError) {
      throw new Error("Error setting configuration");
    }
    sendResponse(CONTRAST_INITIALIZED);
  });
}


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

async function _collectScripts(tab) {
  const vulnerableLibraries = await _getLibraryVulnerabilities();
  if (!vulnerableLibraries) return null;

  const wapplibraries = await wappalzye(tab);

  const docScripts = [].slice.call(document.scripts).map(s => {
    let srcArray = s.src.split("/");
    return srcArray[srcArray.length - 1];
  });

  const sharedLibraries = _compareAppAndVulnerableLibraries(
    docScripts, wapplibraries, vulnerableLibraries);

  if (!sharedLibraries || sharedLibraries.length === 0) {
    return null;
  }
  return { sharedLibraries };
}

function _compareAppAndVulnerableLibraries(
  docScripts, wapplibraries, vulnerableLibraries) {
  wapplibraries = wapplibraries.map(wL => {
    let name = wL.name.toLowerCase();
    wL.jsFileName      = name;
    wL.parsedLibName   = name;
    wL.parsedLibNameJS = name + ".js";
    return wL;
  });
  let filteredDocScripts = docScripts.map(s => {
    if (s && s[0] && ((/[a-z]/).test(s[0]))) {
      let jsFileName      = s;
      let parsedLibName   = _getLibNameFromJSFile(s);
      let parsedLibNameJS = parsedLibName + ".js";
      return { jsFileName, parsedLibName, parsedLibNameJS };
    }
    return false;
  }).filter(Boolean);
  return _findCommonLibraries(vulnerableLibraries, filteredDocScripts, wapplibraries);
}

function _findCommonLibraries(vulnerableLibraries, documentScripts, wapplibraries) {
  let sharedLibraries = [];
  for (let key in vulnerableLibraries) {
    if (Object.prototype.hasOwnProperty.call(vulnerableLibraries, key)) {
      let vulnLib      = vulnerableLibraries[key];
      let vulnLibNames = [];
      vulnLibNames.push(key);

      if (vulnLib.bowername) {
        let bowernames = vulnLib.bowername.map(name => name.toLowerCase());
        vulnLibNames = vulnLibNames.concat(bowernames);
      }

      let sharedWappLibs = wapplibraries.filter(wL => {
        wL.name = wL.name.toLowerCase();
        return (
          vulnLibNames.includes(wL.parsedLibName)
          || vulnLibNames.includes(wL.parsedLibNameJS)
        );
      });
      let sharedScriptLibs = documentScripts.filter(script  => {
        return (
          vulnLibNames.includes(script.jsFileName)
          || vulnLibNames.includes(script.parsedLibName)
          || vulnLibNames.includes(script.parsedLibNameJS)
        );
      })
      let shared = sharedWappLibs.concat(sharedScriptLibs);
      if (shared[0]) {
        let duplicate = sharedLibraries.find(script => {
          return shared[0].parsedLibName === script.parsedLibName;
        });
        if (!duplicate) {
          const library           = shared[0];
          const extractors        = vulnLib.extractors;
          library.name            = key;
          library.extractors      = extractors;
          library.vulnerabilities = vulnLib.vulnerabilities;
          sharedLibraries.push(library);
        }
      }
    }
  }
  return sharedLibraries;
}

function _getLibNameFromJSFile(jsFileName) {
  jsFileName = jsFileName.split(".js")[0];
  jsFileName = jsFileName.split(".min")[0];
  jsFileName = jsFileName.split("-min")[0];
  jsFileName = jsFileName.split("_min")[0];
  jsFileName = jsFileName.match(/([a-zA-Z]+\W)+/) ? jsFileName.match(/([a-zA-Z]+\W)+/)[0] : jsFileName;
  jsFileName = (/\W/).test(jsFileName[jsFileName.length - 1]) ? jsFileName.substr(0, jsFileName.length - 1) : jsFileName;
  return jsFileName;
}

function wappalzye(tab) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: CONTRAST_WAPPALIZE, tab }, (response) => {
      resolve(response);
    })
  });
}
