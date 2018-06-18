'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.CURRENT_APPLICATION = exports.XHR_REQUESTS = exports.VULNERABLE_TABS = exports.TAB_CLOSED = undefined;
exports.getCurrentApplication = getCurrentApplication;
exports.setCurrentApplication = setCurrentApplication;
exports.resetXHRRequests = resetXHRRequests;
exports.handleWebRequest = handleWebRequest;
exports._handleRuntimeOnMessage = _handleRuntimeOnMessage;
exports.handleTabActivated = handleTabActivated;
exports.tabUpdateComplete = tabUpdateComplete;
exports.notifyUserToConfigure = notifyUserToConfigure;

var _util = require('./util.js');

var _Application = require('./models/Application.js');

var _Application2 = _interopRequireDefault(_Application);

var _Vulnerability = require('./models/Vulnerability.js');

var _Vulnerability2 = _interopRequireDefault(_Vulnerability);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/******************************************************************************
 ********************************* GLOBALS ************************************
 ******************************************************************************/
var TAB_CLOSED = exports.TAB_CLOSED = false; /*global
                                             	URL,
                                             	chrome,
                                             	module,
                                             	window,
                                             */

var VULNERABLE_TABS = exports.VULNERABLE_TABS = []; // tab ids of tabs where vulnerabilities count != 0
var XHR_REQUESTS = exports.XHR_REQUESTS = []; // use to not re-evaluate xhr requests

// set on activated or on initial web request
// use in place of retrieveApplicationFromStorage due to async
// NOTE: Need to do this for checking requests before sending to teamserver
// Only requests from applications that are connected should be sent for checking to teamserver, asynchronously retrieving the application from chrome storage on every request in chrome.webRequest.onBeforeRequest resulted in inconsistent vulnerability returns.
var CURRENT_APPLICATION = exports.CURRENT_APPLICATION = null;

function getCurrentApplication() {
	return CURRENT_APPLICATION;
}

/**
 * _setCurrentApplication - description
 *
 * @param  {Object} application application to set as the CURRENT_APPLICATION
 * @return {Object}           	the new CURRENT_APPLICATION
 */
function setCurrentApplication(application) {
	exports.CURRENT_APPLICATION = CURRENT_APPLICATION = application;
	return CURRENT_APPLICATION;
}

function resetXHRRequests() {
	exports.XHR_REQUESTS = XHR_REQUESTS = [];
}

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
	// only permit xhr requests
	// don't monitor xhr requests made by extension
	handleWebRequest(request);
}, { urls: [_util.LISTENING_ON_DOMAIN] });

function handleWebRequest(request) {
	var conditions = [request.type === "xmlhttprequest", !(0, _util.isBlacklisted)(request.url), !XHR_REQUESTS.includes(request.url), !request.url.includes(_util.TEAMSERVER_API_PATH_SUFFIX)];
	if (conditions.every(Boolean)) {
		XHR_REQUESTS.push(request.url);
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
 * This export function becomes invalid when the event listener returns, unless you return true from the event listener to indicate you wish to send a response alocalhronously (this will keep the message channel open to the other end until sendResponse is called).
 */
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		if (!tabs || tabs.length === 0) return;
		var tab = tabs[0];

		if (!tab.active) return;

		// NOTE: UPDATEBADGE
		// Don't update badge when popup is opened
		// Whent he extension popup is opened it sends a request to the background for the traces in chrome storage. In addition to receiving a message here, chrome.tabs.onUpdated is also called which will update the badge. Since we don't want that to happen twice, don't update the badge here when the extension popup is opened.
		// NOTE: How the loading icon works, since <meta charset="utf-8"> is in index.html using the explicit icon is okay https://stackoverflow.com/questions/44090434/chrome-extension-badge-text-renders-as-%C3%A2%C5%93
		//#x21bb; is unicode clockwise circular arrow
		if (request !== _util.TRACES_REQUEST) {
			(0, _util.updateTabBadge)(tab, "↻", _util.CONTRAST_GREEN);
		}

		if (!!tab && !(0, _util.isBlacklisted)(tab.url)) {
			_handleRuntimeOnMessage(request, sendResponse, tab);
		} else {
			(0, _util.removeLoadingBadge)(tab);
		}
	});

	return true;
});

/**
 * _handleRuntimeOnMessage - called when the background receives a message
 *
 * @param  {Object} 	request
 * @param  {Function} sendResponse
 * @param  {Object} 	tab
 * @return {void}
 */
function _handleRuntimeOnMessage(request, sendResponse, tab) {
	if (request === _util.TRACES_REQUEST) {
		chrome.storage.local.get(_util.STORED_TRACES_KEY, function (result) {
			if (!!result && !!result[_util.STORED_TRACES_KEY]) {
				sendResponse({ traces: JSON.parse(result[_util.STORED_TRACES_KEY]) });
			} else {
				sendResponse({ traces: [] });
			}
			(0, _util.removeLoadingBadge)(tab);
		});
	} else if (request === "EVALUATE_XHR" && CURRENT_APPLICATION) {
		return (0, _util.getStoredCredentials)().then(function (creds) {
			_Vulnerability2.default.evaluateVulnerabilities((0, _util.isCredentialed)(creds), // if credentialed already
			tab, // current tab
			XHR_REQUESTS, // gathered xhr requests from page load
			CURRENT_APPLICATION, // current app
			true // isXHR
			);
		}).catch(function (error) {
			console.log(error);
			(0, _util.updateTabBadge)(tab, "X", _util.CONTRAST_RED);
		});
	} else if (request.sender === _util.GATHER_FORMS_ACTION) {
		return (0, _util.getStoredCredentials)().then(function (creds) {
			var formActions = request.formActions;

			if (!!formActions && CURRENT_APPLICATION) {
				_Vulnerability2.default.evaluateVulnerabilities((0, _util.isCredentialed)(creds), // if credentialed already
				tab, // current tab
				formActions, // gathered xhr requests from page load
				CURRENT_APPLICATION, // current app
				false // isXHR
				);
			}
		}).catch(function (error) {
			console.log(error);
			(0, _util.updateTabBadge)(tab, "X", _util.CONTRAST_RED);
		});
	}
	return request;
}

// ------------------------------------------------------------------
// ------------------------- TAB ACTIVATION -------------------------
// ------------------------------------------------------------------

chrome.tabs.onActivated.addListener(function (activeInfo) {
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		if (!tabs || tabs.length === 0) return;
		var tab = tabs[0];

		handleTabActivated(tab);
	});
	return activeInfo;
});

/**
 * handleTabActivated - retrieves the current application from storage and updates the tab badge before checking tab for vulnerabilities
 * @param {Object} tab - the current tab
 * @return {void}
 */
function handleTabActivated(tab) {
	console.log("tab activated");
	if (!tab.active) return;
	if (!tab.url.includes("http://") && !tab.url.includes("https://")) {
		return;
	}

	var calls = [(0, _util.getStoredCredentials)(), _Application2.default.retrieveApplicationFromStorage(tab), _Vulnerability2.default.removeVulnerabilitiesFromStorage(tab)];

	Promise.all(calls).then(function (results) {
		var credentialed = (0, _util.isCredentialed)(results[0]);
		if (credentialed) {
			var application = results[1];
			setCurrentApplication(application);
			if (!CURRENT_APPLICATION) {
				(0, _util.updateTabBadge)(tab, _util.CONTRAST_CONFIGURE_TEXT, _util.CONTRAST_YELLOW);
			} else if (!(0, _util.isBlacklisted)(tab.url)) {
				(0, _util.updateTabBadge)(tab, "↻", _util.CONTRAST_GREEN); // GET STUCK ON LOADING
				_Vulnerability2.default.updateVulnerabilities(tab, CURRENT_APPLICATION, credentialed);
			} else {
				(0, _util.removeLoadingBadge)(tab);
			}
		} else {
			notifyUserToConfigure(tab);
		}
	}).catch(function (error) {
		console.log(error);
		(0, _util.updateTabBadge)(tab, "X", _util.CONTRAST_RED);
	});
}

// -------------------------------------------------------------------
// ------------------------- TAB UPDATED -----------------------------
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
	console.log("tab updated");
	if (!tab.active) return;
	if (chrome.runtime.lastError) return;

	// Don't run logic when user opens a new tab, or when url isn't http (ex. chrome://)
	if (!tab.url.includes("http://") && !tab.url.includes("https://")) {
		return;
	}

	// GET STUCK ON LOADING if done for both "loading" and "complete"
	if (changeInfo.status === "loading") {
		// NOTE: UPDATEBADGE
		(0, _util.updateTabBadge)(tab, "↻", _util.CONTRAST_GREEN);
	}

	var calls = [(0, _util.getStoredCredentials)(), _Application2.default.retrieveApplicationFromStorage(tab), _Vulnerability2.default.removeVulnerabilitiesFromStorage(tab)];

	Promise.all(calls).then(function (results) {
		var credentialed = (0, _util.isCredentialed)(results[0]);
		if (credentialed) {
			var application = results[1];
			setCurrentApplication(application);
			if (!CURRENT_APPLICATION) {
				(0, _util.updateTabBadge)(tab, _util.CONTRAST_CONFIGURE_TEXT, _util.CONTRAST_YELLOW);
				return;
			}

			if (tabUpdateComplete(changeInfo, tab) && !(0, _util.isBlacklisted)(tab.url)) {
				_Vulnerability2.default.updateVulnerabilities(tab, CURRENT_APPLICATION, credentialed);
			} else if ((0, _util.isBlacklisted)(tab.url)) {
				(0, _util.removeLoadingBadge)(tab);
			}
		} else {
			notifyUserToConfigure(tab);
		}
	}).catch(function (error) {
		console.log(error);
		(0, _util.updateTabBadge)(tab, "X", _util.CONTRAST_RED);
		throw new Error("error setting up tab update");
	});
});

/**
 * tabUpdateComplete - returns if the tab has completed updating and has a url
 *
 * @param  {Object} changeInfo info about that status of the tab changes
 * @param  {Object} tab        the chrome tab
 * @return {Boolean}           if the tab has completed updating
 */
function tabUpdateComplete(changeInfo, tab) {
	return changeInfo.status === "complete" && tab.url.startsWith("http");
}

// ------------------------------------------------------------------
// -------------------------- HELPERS -------------------------------
// ------------------------------------------------------------------

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