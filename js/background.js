/*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
/*global
	URL,
	chrome,
	module,
	window,
*/

import Queue from './queue.js';
let QUEUE;

import {
	TEAMSERVER_INDEX_PATH_SUFFIX,
	TEAMSERVER_ACCOUNT_PATH_SUFFIX,
	VALID_TEAMSERVER_HOSTNAMES,
	TEAMSERVER_PROFILE_PATH_SUFFIX,
	CONTRAST_RED,
	CONTRAST_YELLOW,
	CONTRAST_CONFIGURE_TEXT,
	TRACES_REQUEST,
	GATHER_FORMS_ACTION,
	LOADING_DONE,
	DELETE_TRACE,
	APPLICATION_CONNECTED,
	APPLICATION_DISCONNECTED,
	getStoredCredentials,
	isCredentialed,
	isBlacklisted,
	updateTabBadge,
	removeLoadingBadge,
	loadingBadge,
} from './util.js';

import Application from './models/Application.js';
import Vulnerability from './models/Vulnerability.js';
import VulnerableTab from './models/VulnerableTab.js';
import DomainStorage from './models/DomainStorage.js';

/******************************************************************************
 ********************************* GLOBALS ************************************
 ******************************************************************************/
let TAB_CLOSED	= false;

window.XHR_REQUESTS 				 = []; // use to not re-evaluate xhr requests
window.PAGE_FINISHED_LOADING = false;

function resetXHRRequests() {
	console.log("RESETTING XHR REQUESTS from", window.XHR_REQUESTS);
	window.XHR_REQUESTS = [];
}

const XHRDomains = new DomainStorage();

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
	_handleWebRequest(request);
}, {
	urls: XHRDomains.domains,
	types: ["xmlhttprequest"],
});


// NOTE Removed conditions by adding urls and types to onBeforeRequest
// type === "xmlhttprequest", 					// is an xhr request
// initiator && (isHTTP(initiator)), // no requests from extension
function _handleWebRequest(request) {
	const { method, url, } = request;
	const requestURL = url.split("?")[0]; // remove query string
	const conditions = [
		method !== "OPTIONS", 							// no CORS pre-flight requests
		!isBlacklisted(url),								// no blacklisted urls, see utils
		!window.XHR_REQUESTS.includes(requestURL),	// no dupes
	];

	// evaluate new XHR requests immediately
	if (window.PAGE_FINISHED_LOADING && QUEUE.executionCount > 0 && conditions.every(Boolean)) {
		console.log("request", QUEUE);
		window.XHR_REQUESTS.push(requestURL);
		Vulnerability.evaluateSingleURL(requestURL, QUEUE.tab, QUEUE.application);
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
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

	// NOTE: REMOVED TAB QUERY

	const { tab } = request;
	if (!tab || !tab.active) {
		console.log("No Tab");
		sendResponse("Tab not active");
		return;
	};

	if (request.action !== TRACES_REQUEST
			&& request.action !== LOADING_DONE
			&& request.action !== DELETE_TRACE) {
		if (!TAB_CLOSED) {
			console.log("setting loading badge in onMessage");
			loadingBadge(tab);
			TAB_CLOSED = false;
		}
	}

	if (tab && !isBlacklisted(tab.url)) {
		_handleRuntimeOnMessage(request, sendResponse, tab);
	}

	// NOTE: applications are disconnected from Contrast and Contrast is Blacklisted
	else if (request.action === APPLICATION_DISCONNECTED) {
		_handleRuntimeOnMessage(request, sendResponse, tab);
	}

	else {
		removeLoadingBadge(tab);
		sendResponse(null);
	}

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
async function _handleRuntimeOnMessage(request, sendResponse, tab) {
	switch(request.action) {
		case TRACES_REQUEST:
			console.log("Handling traces request message");
			const tabPath				= VulnerableTab.buildTabPath(tab.url);
			const vulnerableTab = new VulnerableTab(tabPath, request.application.name)
			const storedTabs		= await vulnerableTab.getStoredTab();
			sendResponse({ traces: storedTabs[vulnerableTab.vulnTabId] });
			removeLoadingBadge(tab);
			break;

		case APPLICATION_CONNECTED:
			XHRDomains.addDomainsToStorage(request.data.domains);
			break;

		case APPLICATION_DISCONNECTED:
			XHRDomains.removeDomainsFromStorage(request.data.domains);
			break;

		case LOADING_DONE:
			window.PAGE_FINISHED_LOADING = true;
			break;

		case DELETE_TRACE:
			const { application, traceUuid } = request;
			const path 			= VulnerableTab.buildTabPath(tab.url);
			const vulnTab 	= new VulnerableTab(path, application.name);
			const storedTab = await vulnTab.getStoredTab();
			const storedTabTraces = storedTab[vulnTab.vulnTabId];
			const filteredTraces 	= storedTabTraces.filter(t => t !== traceUuid);
			vulnTab.setTraceIDs(filteredTraces);
			vulnTab.storeTab();
			break;

		default:
			console.log("Default Case in _handleRuntimeOnMessage, request action was", request.action);
			return request;
		}
}

async function _queueActions(tab, tabUpdated) {

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

	let formActions = [];
	if (tabUpdated) {
		formActions = await _gatherFormsFromPage(tab);
	}
	QUEUE.addForms(formActions, true);
	QUEUE.addXHRequests(window.XHR_REQUESTS, true);

	// NOTE: Hacky
	// let slept = 0;
	// while (!window.PAGE_FINISHED_LOADING) {
	// 	if (slept === 5) window.PAGE_FINISHED_LOADING = true;
	// 	setTimeout(() => {
	// 		slept += 1
	// 	}, 200);
	// }
	QUEUE.executeQueue(resetXHRRequests);
}

// ------------------------------------------------------------------
// ------------------------- TAB ACTIVATION -------------------------
// - switch to tab from another tab
// ------------------------------------------------------------------

chrome.tabs.onActivated.addListener(activeInfo => {
	window.PAGE_FINISHED_LOADING = true;
	// QUEUE.resetQueue();
	QUEUE = new Queue();

	chrome.tabs.get(activeInfo.tabId, (tab) => {
		console.log("tab activated");
		if (!tab) return;
		_queueActions(tab, false);
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
	console.log("tab updated");
	QUEUE.resetExecutionCount(); // execution count is used by onBeforeRequest
	if (!_tabIsReady(changeInfo, tab)) {
		console.log("Tab not ready after update");
		return;
	}
	QUEUE = new Queue();
	// QUEUE.resetQueue();
	console.log("Queue after Reset", QUEUE);
	_queueActions(tab, true);
});

// ------------------------------------------------------------------
// -------------------------- HELPERS -------------------------------
// ------------------------------------------------------------------

function _tabIsReady(changeInfo, tab) {
	// sometimes favIconUrl is the only attribute of changeInfo
	if (changeInfo.favIconUrl && Object.keys(changeInfo).length === 1) {
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
			console.log("setting loading badge");
			loadingBadge(tab);
			TAB_CLOSED = false;
		}
		return false;
	}
	return true;
}

function _gatherFormsFromPage(tab) {
	return new Promise((resolve) => {
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
function notifyUserToConfigure(tab) {
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

export {
	TAB_CLOSED,
	_handleRuntimeOnMessage,
	notifyUserToConfigure,
	resetXHRRequests,
}
