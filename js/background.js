/*global
	URL,
	chrome,
	module,
	window,
*/

import Queue from './queue.js';
const QUEUE = new Queue();

import {
	TEAMSERVER_INDEX_PATH_SUFFIX,
	TEAMSERVER_ACCOUNT_PATH_SUFFIX,
	VALID_TEAMSERVER_HOSTNAMES,
	TEAMSERVER_PROFILE_PATH_SUFFIX,
	TEAMSERVER_API_PATH_SUFFIX,
	CONTRAST_RED,
	CONTRAST_YELLOW,
	CONTRAST_CONFIGURE_TEXT,
	LISTENING_ON_DOMAIN,
	TRACES_REQUEST,
	GATHER_FORMS_ACTION,
	LOADING_DONE,
	STORED_TRACES_KEY,
	getStoredCredentials,
	isCredentialed,
	isBlacklisted,
	updateTabBadge,
	removeLoadingBadge,
	loadingBadge,
	isHTTP,
} from './util.js';

import Application from './models/Application.js';
import Vulnerability from './models/Vulnerability.js';

/******************************************************************************
 ********************************* GLOBALS ************************************
 ******************************************************************************/
export let TAB_CLOSED 		 = false;
export let VULNERABLE_TABS = []; // tab ids of tabs where vulnerabilities count != 0
export let XHR_REQUESTS 	 = []; // use to not re-evaluate xhr requests

// set on activated or on initial web request
// use in place of retrieveApplicationFromStorage due to async
// NOTE: Need to do this for checking requests before sending to teamserver
// Only requests from applications that are connected should be sent for checking to teamserver, asynchronously retrieving the application from chrome storage on every request in chrome.webRequest.onBeforeRequest resulted in inconsistent vulnerability returns.
export let CURRENT_APPLICATION = null;
let PAGE_FINISHED_LOADING = false;

export function getCurrentApplication() {
	return CURRENT_APPLICATION;
}

/**
 * setCurrentApplication - description
 *
 * @param  {Object} application application to set as the CURRENT_APPLICATION
 * @return {Object}           	the new CURRENT_APPLICATION
 */
export function setCurrentApplication(application) {
	CURRENT_APPLICATION = application;
	return CURRENT_APPLICATION;
}

export function resetXHRRequests() {
	console.log("restting XHR Requests");
	XHR_REQUESTS = [];
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
chrome.webRequest.onBeforeRequest.addListener(request => {
	handleWebRequest(request);
}, { urls: [LISTENING_ON_DOMAIN] });

export function handleWebRequest(request) {
	const { method, initiator, url, type } = request;
	const conditions = [
		type === "xmlhttprequest", 					// is an xhr request
		method !== "OPTIONS", 							// no CORS pre-flight requests
		initiator && (isHTTP(initiator)), // no requests from extension
		!isBlacklisted(url), 								// no blacklisted urls, see utils
		!XHR_REQUESTS.includes(url), 				// no dupes
	];

	// NOTE: For after page has finished loading, capture additional requests made
	if (conditions.every(Boolean)) {
		const requestURL = url.split("?")[0]; // remove query string
		XHR_REQUESTS.push(requestURL);
	}
	return;
}

/**
 * _handleEvaluateXHR - used by _handleRuntimeOnMessage and handleWebRequest
 *
 * @param  {type} request description
 * @param  {type} tab     description
 * @returns {type}         description
 */
function _handleEvaluateXHR(request, tab) {
	if (!PAGE_FINISHED_LOADING) return;
	return getStoredCredentials()
	.then(creds => {
		Vulnerability.evaluateVulnerabilities(
			isCredentialed(creds), // if credentialed already
			tab, 									 // current tab
			XHR_REQUESTS, 				 // gathered xhr requests from page load
			request.application, 	 // current app
			true 									 // isXHR
		);
	})
	.catch((error) => {
		console.log(error);
		if (!TAB_CLOSED) {
			updateTabBadge(tab, "X", CONTRAST_RED)
			TAB_CLOSED = false;
		}
	});
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
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	chrome.tabs.query({ active: true }, (tabs) => {
		if (!tabs || tabs.length === 0) return;
		const tab = tabs[0];
		if (!tab.active) return;

		console.log("On message called", request);

		if (request !== TRACES_REQUEST && request.action !== LOADING_DONE) {
			if (!TAB_CLOSED) {
				console.log("setting loading badge in onMessage");
				loadingBadge(tab);
				TAB_CLOSED = false;
			}
		}

		if (tab && !isBlacklisted(tab.url)) {
			_handleRuntimeOnMessage(request, sendResponse, tab);
		} else {
			removeLoadingBadge(tab);
		}
	});

	return true; // NOTE: Keep this, see note at top of function.
});

/**
 * _handleRuntimeOnMessage - called when the background receives a message
 *
 * @param  {Object} 	request
 * @param  {Function} sendResponse
 * @param  {Object} 	tab
 * @return {void}
 */
export function _handleRuntimeOnMessage(request, sendResponse, tab) {
	if (request === TRACES_REQUEST) {
		console.log("Handling traces request message");
		chrome.storage.local.get(STORED_TRACES_KEY, (result) => {
			if (!!result && !!result[STORED_TRACES_KEY]) {
				sendResponse({ traces: result[STORED_TRACES_KEY] });
			} else {
				sendResponse({ traces: [] });
			}
			removeLoadingBadge(tab);
		})
	}

	else if (request.action === LOADING_DONE) {
		PAGE_FINISHED_LOADING = true;
	}

	return request;
}

async function _queueActions(tab) {
	QUEUE.setTab(tab);

	const calls = [
		getStoredCredentials(),
		Application.retrieveApplicationFromStorage(tab),
	];

	const initalActions = await Promise.all(calls);
	if (!initalActions) updateTabBadge(tab, "X", CONTRAST_RED);

	if (!initalActions[0] || !initalActions[1]) {
		updateTabBadge(tab, CONTRAST_CONFIGURE_TEXT, CONTRAST_YELLOW);
		return;
	}

	QUEUE.setCredentialed(isCredentialed(initalActions[0]));
	QUEUE.setApplication(initalActions[1]);

	const formActions = await _gatherFormsFromPage(tab);
	QUEUE.addForms(formActions, true);
	QUEUE.addXHRequests(XHR_REQUESTS, true);

	// NOTE: Hacky
	function waitForPageLoad() {
		if (!PAGE_FINISHED_LOADING) {
			return waitForPageLoad();
		} else {
			return QUEUE.executeQueue();
		}
	}
	waitForPageLoad();
}

// ------------------------------------------------------------------
// ------------------------- TAB ACTIVATION -------------------------
// - switch to tab from another tab
// ------------------------------------------------------------------

chrome.tabs.onActivated.addListener(activeInfo => {
	PAGE_FINISHED_LOADING = true;
	QUEUE.resetQueue();

	chrome.tabs.get(activeInfo.tabId, (tab) => {
		console.log("tab activated", tab);
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
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	console.log("tab updated", tab);

	QUEUE.resetQueue();

	if (!_tabIsReady(changeInfo, tab)) {
		return;
	}
	_queueActions(tab);
});

// ------------------------------------------------------------------
// -------------------------- HELPERS -------------------------------
// ------------------------------------------------------------------

function _tabIsReady(changeInfo, tab) {
	// sometimes favIconUrl is the only attribute of changeInfo
	if (changeInfo.favIconUrl && Object.keys(changeInfo).length === 1) {
		return false;
	} else if (!tab.active || !changeInfo.status) {
		PAGE_FINISHED_LOADING = false;
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
			loadingBadge(tab);
			TAB_CLOSED = false;
		}
		return false;
	}
	return true;
}

function _gatherFormsFromPage(tab) {
	return new Promise((resolve, reject) => {
		chrome.tabs.sendMessage(tab.id, { action: GATHER_FORMS_ACTION }, (res) => {
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
chrome.tabs.onRemoved.addListener(() => {
	TAB_CLOSED = true;
});

/**
 * notifyUserToConfigure - sets badge if user needs to configure
 *
 * @param  {Object} tab Gives the state of the current tab
 * @return {void}
 */
export function notifyUserToConfigure(tab) {
	if (chrome.runtime.lastError) return;

	const url = new URL(tab.url);
	const conditions = [
		VALID_TEAMSERVER_HOSTNAMES.includes(url.hostname) && tab.url.endsWith(TEAMSERVER_ACCOUNT_PATH_SUFFIX),
		tab.url.endsWith(TEAMSERVER_PROFILE_PATH_SUFFIX) && tab.url.indexOf(TEAMSERVER_INDEX_PATH_SUFFIX) !== -1,
		!chrome.runtime.lastError
	];
	if (!TAB_CLOSED && conditions.some(c => !!c)) {
		updateTabBadge(tab, CONTRAST_CONFIGURE_TEXT, CONTRAST_YELLOW);
		TAB_CLOSED = false;
	}
}
