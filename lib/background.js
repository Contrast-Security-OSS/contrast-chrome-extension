'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.TAB_CLOSED = undefined;

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

/**
 * _handleRuntimeOnMessage - called when the background receives a message
 *
 * @param  {Object} 	request
 * @param  {Function} sendResponse
 * @param  {Object} 	tab
 * @return {void}
 */
var _handleRuntimeOnMessage = function () {
	var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(request, sendResponse, tab) {
		var tabPath, vulnerableTab, traces, calls;
		return _regenerator2.default.wrap(function _callee$(_context) {
			while (1) {
				switch (_context.prev = _context.next) {
					case 0:
						if (!(request.action === _util.TRACES_REQUEST)) {
							_context.next = 11;
							break;
						}

						console.log("Handling traces request message");
						tabPath = new URL(tab.url).pathname;
						vulnerableTab = new _VulnerableTab2.default(tabPath, request.application.name);
						_context.next = 6;
						return vulnerableTab.getStoredTab();

					case 6:
						traces = _context.sent;


						sendResponse({ traces: traces[vulnerableTab.id] });
						(0, _util.removeLoadingBadge)(tab);
						_context.next = 12;
						break;

					case 11:
						if (request.action === _util.APPLICATION_CONNECTED) {
							XHR_Domains.addDomainsToStorage(request.data.domains);
						} else if (request.action === _util.APPLICATION_DISCONNECTED) {
							XHR_Domains.removeDomainsFromStorage(request.data.domains);
						} else if (request.action === _util.LOADING_DONE) {
							window.PAGE_FINISHED_LOADING = true;
						}

					case 12:
						calls = [(0, _util.getStoredCredentials)(), _Application2.default.retrieveApplicationFromStorage(tab), _Vulnerability2.default.removeVulnerabilitiesFromStorage(tab)];
						return _context.abrupt('return', request);

					case 14:
					case 'end':
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
	var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(tab) {
		var calls, initalActions, formActions, waitForPageLoad;
		return _regenerator2.default.wrap(function _callee2$(_context2) {
			while (1) {
				switch (_context2.prev = _context2.next) {
					case 0:
						waitForPageLoad = function waitForPageLoad() {
							if (!window.PAGE_FINISHED_LOADING) {
								return waitForPageLoad();
							} else {
								return QUEUE.executeQueue();
							}
						};

						QUEUE.setTab(tab);

						calls = [(0, _util.getStoredCredentials)(), _Application2.default.retrieveApplicationFromStorage(tab)];
						_context2.next = 5;
						return _promise2.default.all(calls);

					case 5:
						initalActions = _context2.sent;

						if (!initalActions) (0, _util.updateTabBadge)(tab, "X", _util.CONTRAST_RED);

						if (!(!initalActions[0] || !initalActions[1])) {
							_context2.next = 10;
							break;
						}

						(0, _util.updateTabBadge)(tab, _util.CONTRAST_CONFIGURE_TEXT, _util.CONTRAST_YELLOW);
						return _context2.abrupt('return');

					case 10:

						QUEUE.setCredentialed((0, _util.isCredentialed)(initalActions[0]));
						QUEUE.setApplication(initalActions[1]);

						_context2.next = 14;
						return _gatherFormsFromPage(tab);

					case 14:
						formActions = _context2.sent;

						QUEUE.addForms(formActions, true);
						QUEUE.addXHRequests(window.XHR_REQUESTS, true);

						// NOTE: Hacky

						waitForPageLoad();

					case 18:
					case 'end':
						return _context2.stop();
				}
			}
		}, _callee2, this);
	}));

	return function _queueActions(_x4) {
		return _ref2.apply(this, arguments);
	};
}();

// ------------------------------------------------------------------
// ------------------------- TAB ACTIVATION -------------------------
// - switch to tab from another tab
// ------------------------------------------------------------------

exports.resetXHRRequests = resetXHRRequests;
exports.notifyUserToConfigure = notifyUserToConfigure;

var _queue = require('./queue.js');

var _queue2 = _interopRequireDefault(_queue);

var _util = require('./util.js');

var _Application = require('./models/Application.js');

var _Application2 = _interopRequireDefault(_Application);

var _Vulnerability = require('./models/Vulnerability.js');

var _Vulnerability2 = _interopRequireDefault(_Vulnerability);

var _VulnerableTab = require('./models/VulnerableTab.js');

var _VulnerableTab2 = _interopRequireDefault(_VulnerableTab);

var _DomainStorage = require('./models/DomainStorage.js');

var _DomainStorage2 = _interopRequireDefault(_DomainStorage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var QUEUE = new _queue2.default(); /*global
                                   	URL,
                                   	chrome,
                                   	module,
                                   	window,
                                   */

/******************************************************************************
 ********************************* GLOBALS ************************************
 ******************************************************************************/
var TAB_CLOSED = exports.TAB_CLOSED = false;

window.XHR_REQUESTS = []; // use to not re-evaluate xhr requests
window.PAGE_FINISHED_LOADING = false;

function resetXHRRequests() {
	window.XHR_REQUESTS = [];
}

var XHR_Domains = new _DomainStorage2.default();

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
	console.log("XHR_Domains.domains", XHR_Domains.domains, request.url);
	_handleWebRequest(request);
}, {
	urls: XHR_Domains.domains,
	types: ["xmlhttprequest"]
});

// NOTE Removed conditions by adding urls and types to onBeforeRequest
// type === "xmlhttprequest", 					// is an xhr request
// initiator && (isHTTP(initiator)), // no requests from extension
function _handleWebRequest(request) {
	var method = request.method,
	    url = request.url;

	var conditions = [method !== "OPTIONS", // no CORS pre-flight requests
	!(0, _util.isBlacklisted)(url), // no blacklisted urls, see utils
	!window.XHR_REQUESTS.includes(url)];

	var requestURL = url.split("?")[0]; // remove query string

	// evaluate new XHR requests immediately
	if (PAGE_FINISHED_LOADING && QUEUE.executionCount > 0 && conditions.every(Boolean)) {
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
	chrome.tabs.query({ active: true }, function (tabs) {
		if (!tabs || tabs.length === 0) return;
		var tab = tabs[0];
		if (!tab.active) return;

		if (request.action !== _util.TRACES_REQUEST && request.action !== _util.LOADING_DONE) {
			if (!TAB_CLOSED) {
				console.log("setting loading badge in onMessage");
				(0, _util.loadingBadge)(tab);
				exports.TAB_CLOSED = TAB_CLOSED = false;
			}
		}

		if (tab && !(0, _util.isBlacklisted)(tab.url)) {
			_handleRuntimeOnMessage(request, sendResponse, tab);
		} else if (request.action === _util.APPLICATION_DISCONNECTED) {
			_handleRuntimeOnMessage(request, sendResponse, tab);
		} else {
			(0, _util.removeLoadingBadge)(tab);
		}
	});

	return true; // NOTE: Keep this, see note at top of function.
});chrome.tabs.onActivated.addListener(function (activeInfo) {
	window.PAGE_FINISHED_LOADING = true;
	QUEUE.resetQueue();

	chrome.tabs.get(activeInfo.tabId, function (tab) {
		// console.log("tab activated", tab);
		if (!tab) return;
		_queueActions(tab);
	});
});

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
	// console.log("tab updated", tab);
	if (!_tabIsReady(changeInfo, tab)) {
		console.log("Tab not ready after update");
		return;
	}
	QUEUE.resetQueue();
	_queueActions(tab);
});

// ------------------------------------------------------------------
// -------------------------- HELPERS -------------------------------
// ------------------------------------------------------------------

function _tabIsReady(changeInfo, tab) {
	// sometimes favIconUrl is the only attribute of changeInfo
	if (changeInfo.favIconUrl && (0, _keys2.default)(changeInfo).length === 1) {
		return false;
	} else if (!tab.active || !changeInfo.status) {
		window.PAGE_FINISHED_LOADING = false;
		return false;
	} else if (chrome.runtime.lastError) {
		return false;
	} else if (!tab.url.includes("http://") && !tab.url.includes("https://")) {
		// Don't run logic when user opens a new tab, or when url isn't http (ex. chrome://)
		return false;
	} else if (changeInfo.status === "loading") {
		// GET STUCK ON LOADING if done for both "loading" and "complete"
		// NOTE: UPDATEBADGE
		if (!TAB_CLOSED) {
			console.log("setting loading badge");
			(0, _util.loadingBadge)(tab);
			exports.TAB_CLOSED = TAB_CLOSED = false;
		}
		return false;
	}
	return true;
}

function _gatherFormsFromPage(tab) {
	return new _promise2.default(function (resolve, reject) {
		chrome.tabs.sendMessage(tab.id, { action: _util.GATHER_FORMS_ACTION }, function (res) {
			if (res && res.formActions && Array.isArray(res.formActions)) {
				resolve(res.formActions);
			} else {
				console.error("Error gathering forms", res);
				resolve([]);
			}
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