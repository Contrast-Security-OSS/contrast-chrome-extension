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
UUID_V4_REGEX,
*/
"use strict";

// Apply different gloabls depending on how user navigates to a page
// https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigation

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _values = require("babel-runtime/core-js/object/values");

var _values2 = _interopRequireDefault(_values);

var _defineProperty2 = require("babel-runtime/helpers/defineProperty");

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _collectScripts = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(tab) {
    var vulnerableLibraries, wapplibraries, docScripts, sharedLibraries;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return _getLibraryVulnerabilities();

          case 2:
            vulnerableLibraries = _context.sent;

            if (vulnerableLibraries) {
              _context.next = 5;
              break;
            }

            return _context.abrupt("return", null);

          case 5:
            _context.next = 7;
            return wappalzye(tab);

          case 7:
            wapplibraries = _context.sent;
            docScripts = [].slice.call(document.scripts).map(function (s) {
              var srcArray = s.src.split("/");
              return srcArray[srcArray.length - 1];
            });
            sharedLibraries = _compareAppAndVulnerableLibraries(docScripts, wapplibraries, vulnerableLibraries);

            if (!(!sharedLibraries || sharedLibraries.length === 0)) {
              _context.next = 12;
              break;
            }

            return _context.abrupt("return", null);

          case 12:
            return _context.abrupt("return", { sharedLibraries: sharedLibraries });

          case 13:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function _collectScripts(_x) {
    return _ref.apply(this, arguments);
  };
}();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

if (window.performance.navigation.type === 1) {
  window.CONTRAST__REFRESHED = true;
} else {
  window.CONTRAST__REFRESHED = false;
}

window.addEventListener("load", function () {
  chrome.runtime.sendMessage({ action: LOADING_DONE });

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
  } else if (request.action === HIGHLIGHT_VULNERABLE_FORMS) {
    sendResponse(ContrastForm.highlightForms(request.formActions));
  } else if (request.url !== undefined && request.action === CONTRAST_INITIALIZE) {
    _initializeContrast(request, sendResponse);
  } else if (request.action === 'GET_LIB_VERSION' && request.library) {
    var library = request.library.parsedLibName.replace("-", "_");
    var libElement = document.getElementById("__script_res_" + library);
    var extractedLibraryVersion = void 0;
    try {
      extractedLibraryVersion = libElement.innerText;
    } catch (e) {
      sendResponse(null);
    }
    if (extractedLibraryVersion) {
      var versionArray = extractedLibraryVersion.split("_");
      sendResponse(versionArray[versionArray.length - 1]);
    } else {
      sendResponse(null);
    }
  } else if (request.action === GATHER_SCRIPTS) {
    _collectScripts(request.tab).then(function (sharedLibraries) {
      return sendResponse(sharedLibraries);
    }).catch(function (error) {
      error;
    });
  }

  // This function becomes invalid when the event listener returns, unless you return true from the event listener to indicate you wish to send a response asynchronously (this will keep the message channel open to the other end until sendResponse is called).
  return true; // NOTE: Keep this
});

/**
 * _dataQuery - description
 *
 * @param  {String} key  key to search for
 * @returns {String}     description
 */
function _dataQuery(key) {
  var dataAttr = "data-contrast-scrape";
  var keys = {
    0: "contrast-api-key",
    1: "contrast-organization-uuid",
    2: "contrast-contrast-url",
    3: "contrast-service-key",
    4: "contrast-username"
  };
  document.querySelector('[key-status-rotated=""]');
  var element = document.querySelector("[" + dataAttr + "=" + keys[key] + "]");
  // ex. document.querySelector('data-contrast-scrape=contrast-username')
  if (!element) return;

  return element.textContent;
}

function _scrapeServiceKey() {
  var key = "key-status-rotated";
  var val = "userKeyStatus.rotated";
  var element = document.querySelector("[" + key + "=\"" + val + "\"]");
  if (element) {
    return element.innerText;
  }
  return null;
}
function _scrapeApiKey() {
  var el = "span";
  var classes = "break-word.org-key.ng-binding";
  var element = document.querySelector(el + "." + classes);
  if (element) {
    return element.innerText;
  }
  return null;
}
function _scrapeOrgUUID() {
  var hash = document.location.hash;
  var orgUUID = hash.split("/")[1];
  if (UUID_V4_REGEX.test(orgUUID)) {
    return orgUUID;
  }
  return null;
}
function _scrapeProfileEmail() {
  var klass = "profile-email";
  var element = document.querySelector("." + klass);
  if (element) {
    return element.innerText;
  }
  return null;
}

function _initializeContrast(request, sendResponse) {
  var _contrastObj;

  var tsIndex = request.url.indexOf(TEAMSERVER_INDEX_PATH_SUFFIX);
  var teamServerUrl = request.url.substring(0, tsIndex) + TEAMSERVER_API_PATH_SUFFIX || _dataQuery(2);

  var apiKey = _scrapeApiKey() || _dataQuery(0);
  var serviceKey = _scrapeServiceKey() || _dataQuery(3);
  var orgUuid = _scrapeOrgUUID() || _dataQuery(1);
  var profileEmail = _scrapeProfileEmail() || _dataQuery(4);

  var contrastObj = (_contrastObj = {}, (0, _defineProperty3.default)(_contrastObj, CONTRAST_USERNAME, profileEmail), (0, _defineProperty3.default)(_contrastObj, CONTRAST_SERVICE_KEY, serviceKey), (0, _defineProperty3.default)(_contrastObj, CONTRAST_API_KEY, apiKey), (0, _defineProperty3.default)(_contrastObj, CONTRAST_ORG_UUID, orgUuid), (0, _defineProperty3.default)(_contrastObj, TEAMSERVER_URL, teamServerUrl), _contrastObj);

  (0, _values2.default)(contrastObj).forEach(function (val) {
    if (!val) {
      sendResponse({
        action: CONTRAST_INITIALIZED,
        success: false,
        message: "Failed to configure extension. Try configuring the extension manually."
      });
      return;
    }
  });
  chrome.storage.local.set(contrastObj, function () {
    if (chrome.runtime.lastError) {
      throw new Error("Error setting configuration");
    }
    sendResponse({ action: CONTRAST_INITIALIZED, success: true, contrastObj: contrastObj });
  });
}

function _getLibraryVulnerabilities() {
  var retireJSURL = "https://raw.githubusercontent.com/RetireJS/retire.js/master/repository/jsrepository.json";
  var fetchOptions = {
    method: "GET"
  };
  return fetch(retireJSURL, fetchOptions).then(function (response) {
    if (response.ok && response.status === 200) {
      return response.json();
    }
    return null;
  }).catch(new Error("Error getting js lib vulnerabilities"));
}

function _compareAppAndVulnerableLibraries(docScripts, wapplibraries, vulnerableLibraries) {
  wapplibraries = wapplibraries.map(function (wL) {
    var name = wL.name.toLowerCase();
    wL.jsFileName = name;
    wL.parsedLibName = name;
    wL.parsedLibNameJS = name + ".js";
    return wL;
  });
  var filteredDocScripts = docScripts.map(function (s) {
    if (s && s[0] && new RegExp(/[a-z]/).test(s[0])) {
      var jsFileName = s;
      var parsedLibName = _getLibNameFromJSFile(s);
      var parsedLibNameJS = parsedLibName + ".js";
      return { jsFileName: jsFileName, parsedLibName: parsedLibName, parsedLibNameJS: parsedLibNameJS };
    }
    return false;
  }).filter(Boolean);
  return _findCommonLibraries(vulnerableLibraries, filteredDocScripts, wapplibraries);
}

function _findCommonLibraries(vulnerableLibraries, documentScripts, wapplibraries) {
  var sharedLibraries = [];
  for (var key in vulnerableLibraries) {
    if (Object.prototype.hasOwnProperty.call(vulnerableLibraries, key)) {
      (function () {
        var vulnLib = vulnerableLibraries[key];
        var vulnLibNames = [];
        vulnLibNames.push(key);

        if (vulnLib.bowername) {
          var bowernames = vulnLib.bowername.map(function (name) {
            return name.toLowerCase();
          });
          vulnLibNames = vulnLibNames.concat(bowernames);
        }

        var sharedWappLibs = wapplibraries.filter(function (wL) {
          wL.name = wL.name.toLowerCase();
          return vulnLibNames.includes(wL.parsedLibName) || vulnLibNames.includes(wL.parsedLibNameJS);
        });
        var sharedScriptLibs = documentScripts.filter(function (script) {
          return vulnLibNames.includes(script.jsFileName) || vulnLibNames.includes(script.parsedLibName) || vulnLibNames.includes(script.parsedLibNameJS);
        });
        var shared = sharedWappLibs.concat(sharedScriptLibs);
        if (shared[0]) {
          var duplicate = sharedLibraries.find(function (script) {
            return shared[0].parsedLibName === script.parsedLibName;
          });
          if (!duplicate) {
            var library = shared[0];
            var extractors = vulnLib.extractors;
            library.name = key;
            library.extractors = extractors;
            library.vulnerabilities = vulnLib.vulnerabilities;
            sharedLibraries.push(library);
          }
        }
      })();
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
  jsFileName = new RegExp(/\W/).test(jsFileName[jsFileName.length - 1]) ? jsFileName.substr(0, jsFileName.length - 1) : jsFileName;
  return jsFileName;
}

function wappalzye(tab) {
  return new _promise2.default(function (resolve) {
    chrome.runtime.sendMessage({ action: CONTRAST_WAPPALIZE, tab: tab }, function (response) {
      resolve(response);
    });
  });
}