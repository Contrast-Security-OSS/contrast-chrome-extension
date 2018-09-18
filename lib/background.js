"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resetXHRRequests = exports.notifyUserToConfigure = exports._handleRuntimeOnMessage = exports.TAB_CLOSED = undefined;

var _keys = require("babel-runtime/core-js/object/keys");

var _keys2 = _interopRequireDefault(_keys);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

/**
 * _handleRuntimeOnMessage - called when the background receives a message
 *
 * @param  {Object} 	request
 * @param  {Function} sendResponse
 * @param  {Object} 	tab
 */
var _handleRuntimeOnMessage = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(request, sendResponse, tab) {
    var tabPath, vulnerableTab, storedTabs;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.t0 = request.action;
            _context.next = _context.t0 === _util.TRACES_REQUEST ? 3 : _context.t0 === _util.APPLICATION_CONNECTED ? 11 : _context.t0 === _util.APPLICATION_DISCONNECTED ? 13 : _context.t0 === _util.LOADING_DONE ? 15 : 17;
            break;

          case 3:
            tabPath = _VulnerableTab2.default.buildTabPath(tab.url);
            vulnerableTab = new _VulnerableTab2.default(tabPath, request.application.name);
            _context.next = 7;
            return vulnerableTab.getStoredTab();

          case 7:
            storedTabs = _context.sent;

            sendResponse({ traces: storedTabs[vulnerableTab.vulnTabId] });
            (0, _util.removeLoadingBadge)(tab);
            return _context.abrupt("break", 18);

          case 11:
            XHRDomains.addDomainsToStorage(request.data.domains);
            return _context.abrupt("break", 18);

          case 13:
            XHRDomains.removeDomainsFromStorage(request.data.domains);
            return _context.abrupt("break", 18);

          case 15:
            window.PAGE_FINISHED_LOADING = true;
            return _context.abrupt("break", 18);

          case 17:
            return _context.abrupt("return", request);

          case 18:
            return _context.abrupt("return", request);

          case 19:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function _handleRuntimeOnMessage(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

var _queueActions = function () {
  var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(tab, tabUpdated) {
    var calls, initalActions, formActions;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            QUEUE.setTab(tab);

            calls = [(0, _util.getStoredCredentials)(), _Application2.default.retrieveApplicationFromStorage(tab)];
            _context2.next = 4;
            return _promise2.default.all(calls);

          case 4:
            initalActions = _context2.sent;

            if (!initalActions) {
              (0, _util.updateTabBadge)(tab, "!", _util.CONTRAST_RED);
              (0, _util.updateExtensionIcon)(tab, 1);
            }

            if (!initalActions[0]) {
              (0, _util.updateExtensionIcon)(tab, 2);
            } else if (!initalActions[1]) {
              (0, _util.updateExtensionIcon)(tab, 1);
            }

            // if (!initalActions[0] || !initalActions[1]) {
            // 	updateTabBadge(tab, CONTRAST_CONFIGURE_TEXT, CONTRAST_YELLOW);
            // 	return;
            // }

            QUEUE.setCredentialed((0, _util.isCredentialed)(initalActions[0]));
            QUEUE.setApplication(initalActions[1]);

            formActions = [];

            if (!tabUpdated) {
              _context2.next = 14;
              break;
            }

            _context2.next = 13;
            return _gatherFormsFromPage(tab);

          case 13:
            formActions = _context2.sent;

          case 14:
            QUEUE.addForms(formActions, true);
            QUEUE.addXHRequests(window.XHR_REQUESTS, true);

            QUEUE.executeQueue(resetXHRRequests);

          case 17:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function _queueActions(_x4, _x5) {
    return _ref2.apply(this, arguments);
  };
}();

// ------------------------------------------------------------------
// ------------------------- TAB ACTIVATION -------------------------
// - switch to tab from another tab
// ------------------------------------------------------------------

var _queue = require("./queue.js");

var _queue2 = _interopRequireDefault(_queue);

var _util = require("./util.js");

var _Application = require("./models/Application.js");

var _Application2 = _interopRequireDefault(_Application);

var _Vulnerability = require("./models/Vulnerability.js");

var _Vulnerability2 = _interopRequireDefault(_Vulnerability);

var _VulnerableTab = require("./models/VulnerableTab.js");

var _VulnerableTab2 = _interopRequireDefault(_VulnerableTab);

var _DomainStorage = require("./models/DomainStorage.js");

var _DomainStorage2 = _interopRequireDefault(_DomainStorage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var QUEUE = void 0; /*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
/*global
	URL,
	chrome,
	module,
	window,
*/

// import { wappalzye } from "./libraries/wappalyzer.js";

/******************************************************************************
 ********************************* GLOBALS ************************************
 ******************************************************************************/
var TAB_CLOSED = false;

window.XHR_REQUESTS = []; // use to not re-evaluate xhr requests
window.PAGE_FINISHED_LOADING = false;

function resetXHRRequests() {
  window.XHR_REQUESTS = [];
}

var XHRDomains = new _DomainStorage2.default();

/******************************************************************************
 *************************** CHROME EVENT LISTENERS ***************************
 ******************************************************************************/

// -------------------------------------------------------------------
// ------------------------- WEB REQUESTS ----------------------------
// -------------------------------------------------------------------
/**
 * called before any local or alocal request is sent
 * captures xhr and resource requests
 *
 * @param  {Function} export function - callback
 * @param {Object} filter - allows limiting the requests for which events are triggered in various dimensions including urls
 * @return {void}
 */
chrome.webRequest.onBeforeRequest.addListener(function (request) {
  _handleWebRequest(request);
}, {
  urls: XHRDomains.domains,
  types: ["xmlhttprequest"]
});

// NOTE Removed conditions by adding urls and types to onBeforeRequest
// type === "xmlhttprequest", 					// is an xhr request
// initiator && (isHTTP(initiator)), // no requests from extension
function _handleWebRequest(request) {
  var method = request.method,
      url = request.url;

  var requestURL = url.split("?")[0]; // remove query string
  var conditions = [method !== "OPTIONS", // no CORS pre-flight requests
  !(0, _util.isBlacklisted)(url), // no blacklisted urls, see utils
  !window.XHR_REQUESTS.includes(requestURL) // no dupes
  ];

  // evaluate new XHR requests immediately
  if (window.PAGE_FINISHED_LOADING && QUEUE.executionCount > 0 && conditions.every(Boolean)) {
    window.XHR_REQUESTS.push(requestURL);
    _Vulnerability2.default.evaluateSingleURL(requestURL, QUEUE.tab, QUEUE.application);
  }

  // NOTE: For after page has finished loading, capture additional requests made
  if (conditions.every(Boolean)) {
    window.XHR_REQUESTS.push(requestURL);
  }
  return;
}

// -------------------------------------------------------------------
// ------------------------- RUNTIME MESSAGE -------------------------
// -------------------------------------------------------------------

/**
 * @param  {Object} request a request object
 * @param  {Object} sender  which script sent the request
 * @param  {Function} sendResponse return information to sender, must be JSON serializable
 * @return {Boolean} - From the documentation:
 * https://developer.chrome.com/extensions/runtime#event-onMessage
 * NOTE: This export function becomes invalid when the event listener returns, unless you return true from the event listener to indicate you wish to send a response alocalhronously (this will keep the message channel open to the other end until sendResponse is called).
 */
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // NOTE: REMOVED TAB QUERY

  var tab = request.tab;

  if (!tab || !tab.active) {
    sendResponse("Tab not active");
    return false;
  }

  if (request.action !== _util.TRACES_REQUEST && request.action !== _util.LOADING_DONE) {
    if (!TAB_CLOSED) {
      (0, _util.loadingBadge)(tab);
      exports.TAB_CLOSED = TAB_CLOSED = false;
    }
  }

  if (tab && !(0, _util.isBlacklisted)(tab.url)) {
    _handleRuntimeOnMessage(request, sendResponse, tab);
  }

  // NOTE: applications are disconnected from Contrast and Contrast is Blacklisted
  else if (request.action === _util.APPLICATION_DISCONNECTED) {
      _handleRuntimeOnMessage(request, sendResponse, tab);
    } else {
      (0, _util.removeLoadingBadge)(tab);
      sendResponse(null);
    }

  return true; // NOTE: Keep this, see note at top of function.
});chrome.tabs.onActivated.addListener(function (activeInfo) {
  window.PAGE_FINISHED_LOADING = true;
  QUEUE = new _queue2.default();

  chrome.tabs.get(activeInfo.tabId, function (tab) {
    if (!tab || chrome.runtime.lastError) return;

    _queueActions(tab, false);
  });
});

// ------------------------------------------------------------------
// ------------------------- TAB ACTIVATION -------------------------
// - switch to tab from another tab
// ------------------------------------------------------------------

// chrome.tabs.onActivated.addListener(activeInfo => {
// 	window.PAGE_FINISHED_LOADING = true;
// 	// QUEUE.resetQueue();
// 	QUEUE = new Queue();
//
// 	chrome.tabs.get(activeInfo.tabId, (tab) => {
// 		if (!tab) return;
// 		_queueActions(tab, false);
// 	});
// });

// -------------------------------------------------------------------
// ------------------------- TAB UPDATED -----------------------------
// - on Refresh
// - when URL of current tab changes
// -------------------------------------------------------------------

/**
 * anonymous export function - called when tab is updated including any changes to url
 *
 * @param  {Integer} tabId     the chrome defined id of the tab
 * @param  {Object} changeInfo Lists the changes to the state of the tab that was updated.
 * @param  {Object} tab        Gives the state of the tab that was updated.
 * @return {void}
 */
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (QUEUE) QUEUE.resetExecutionCount(); // execution count is used by onBeforeRequest
  if (!_tabIsReady(changeInfo, tab)) {
    return;
  }
  QUEUE = new _queue2.default();
  // QUEUE.resetQueue();
  _queueActions(tab, true);
});

// ------------------------------------------------------------------
// -------------------------- HELPERS -------------------------------
// ------------------------------------------------------------------

function _tabIsReady(changeInfo, tab) {
  // sometimes favIconUrl is the only attribute of changeInfo
  if (changeInfo.favIconUrl && (0, _keys2.default)(changeInfo).length === 1) {
    return false;
  } else if (!tab.active || !changeInfo.status) {
    return false;
  } else if (chrome.runtime.lastError) {
    return false;
  } else if (!tab.url.includes("http://") && !tab.url.includes("https://")) {
    // Don't run logic when user opens a new tab, or when url isn't http (ex. chrome://)
    return false;
  } else if (changeInfo.status === "loading") {
    resetXHRRequests();
    // GET STUCK ON LOADING if done for both "loading" and "complete"
    // NOTE: UPDATEBADGE
    if (!TAB_CLOSED) {
      (0, _util.loadingBadge)(tab);
      exports.TAB_CLOSED = TAB_CLOSED = false;
    }
    return false;
  }
  return true;
}

function _gatherFormsFromPage(tab) {
  return new _promise2.default(function (resolve) {
    if ((0, _util.isBlacklisted)(tab.url)) {
      return resolve([]);
    }
    return chrome.tabs.sendMessage(tab.id, { action: _util.GATHER_FORMS_ACTION }, function (res) {
      if (res && res.formActions && Array.isArray(res.formActions)) {
        return resolve(res.formActions);
      }
      console.error("Error Gathering Forms");
      return resolve([]);
    });
  });
}

/**
 * set the TAB_CLOSED global to true if a tab is closed
 * other export function listen to this and will cancel execution if it is true
 */
chrome.tabs.onRemoved.addListener(function () {
  exports.TAB_CLOSED = TAB_CLOSED = true;
});

/**
 * notifyUserToConfigure - sets badge if user needs to configure
 *
 * @param  {Object} tab Gives the state of the current tab
 * @return {void}
 */
function notifyUserToConfigure(tab) {
  if (chrome.runtime.lastError) return;

  var url = new URL(tab.url);
  var conditions = [_util.VALID_TEAMSERVER_HOSTNAMES.includes(url.hostname) && tab.url.endsWith(_util.TEAMSERVER_ACCOUNT_PATH_SUFFIX), tab.url.endsWith(_util.TEAMSERVER_PROFILE_PATH_SUFFIX) && tab.url.indexOf(_util.TEAMSERVER_INDEX_PATH_SUFFIX) !== -1, !chrome.runtime.lastError];
  if (!TAB_CLOSED && conditions.some(function (c) {
    return !!c;
  })) {
    (0, _util.updateTabBadge)(tab, _util.CONTRAST_CONFIGURE_TEXT, _util.CONTRAST_YELLOW);
    exports.TAB_CLOSED = TAB_CLOSED = false;
  }
}

exports.TAB_CLOSED = TAB_CLOSED;
exports._handleRuntimeOnMessage = _handleRuntimeOnMessage;
exports.notifyUserToConfigure = notifyUserToConfigure;
exports.resetXHRRequests = resetXHRRequests;