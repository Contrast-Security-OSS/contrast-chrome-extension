/*global
	URL,
	chrome,
	module,
	window,
*/

import Queue from './Queue.js';

const Queue = new Queue();

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
	const conditions = [
		request.method !== "OPTIONS",
		!request.url.includes("socket.io"),
		!!request.initiator && (request.initiator.includes("http://") || request.initiator.includes("https://")),
		request.type === "xmlhttprequest",
		!isBlacklisted(request.url),
		!XHR_REQUESTS.includes(request.url),
		!request.url.includes(TEAMSERVER_API_PATH_SUFFIX),
	];

	const conditionsFulfilled = conditions.every(Boolean);

	if (conditionsFulfilled && PAGE_FINISHED_LOADING && CURRENT_APPLICATION) {
		request.url = request.url.split("?")[0];
		XHR_REQUESTS.push(request.url);

		Queue.addXHRequests(XHR_REQUESTS, true);
		// _handleEvaluateXHR(
		// 	{ application: CURRENT_APPLICATION },
		// 	{ url: request.url, id: request.tabId }
		// );
	}

	// NOTE: For after page has finished loading, capture additional requests made
	else if (conditionsFulfilled) {
		request.url = request.url.split("?")[0];
		XHR_REQUESTS.push(request.url);
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
		console.log("evaluating XHR Requests for vulnerabilities", XHR_REQUESTS.length);
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
 * This export function becomes invalid when the event listener returns, unless you return true from the event listener to indicate you wish to send a response alocalhronously (this will keep the message channel open to the other end until sendResponse is called).
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	chrome.tabs.query({ active: true }, (tabs) => {
		if (!tabs || tabs.length === 0) return;
		const tab = tabs[0];
		console.log("On message called", request);
		// console.log("tab in on message", tab);
		if (!tab.active) return;

		// NOTE: UPDATEBADGE
		// Don't update badge when popup is opened
		// Whent he extension popup is opened it sends a request to the background for the traces in chrome storage. In addition to receiving a message here, chrome.tabs.onUpdated is also called which will update the badge. Since we don't want that to happen twice, don't update the badge here when the extension popup is opened.
		// NOTE: How the loading icon works, since <meta charset="utf-8"> is in index.html using the explicit icon is okay https://stackoverflow.com/questions/44090434/chrome-extension-badge-text-renders-as-%C3%A2%C5%93
		//#x21bb; is unicode clockwise circular arrow
		// TRACES_REQUEST happens when popup is opened, LOADING_DONE happens after tab has updated or activated
		if (request !== TRACES_REQUEST && request.action !== LOADING_DONE) {
			if (!TAB_CLOSED) {
				console.log("setting loading badge in onMessage");
				loadingBadge(tab);
				TAB_CLOSED = false;
			}
		}

		if (!!tab && !isBlacklisted(tab.url)) {
			console.log("Handling Runtime Message");
			_handleRuntimeOnMessage(request, sendResponse, tab);
		} else {
			removeLoadingBadge(tab);
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



// ------------------------------------------------------------------
// ------------------------- TAB ACTIVATION -------------------------
// ------------------------------------------------------------------

// chrome.tabs.onActivated.addListener(activeInfo => {
// 	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
// 		if (!tabs || tabs.length === 0) return;
// 		const tab = tabs[0];
//
// 		handleTabActivated(tab);
// 	});
// 	return activeInfo;
// });
//
// /**
//  * handleTabActivated - retrieves the current application from storage and updates the tab badge before checking tab for vulnerabilities
//  * @param {Object} tab - the current tab
//  * @return {void}
//  */
// export function handleTabActivated(tab) {
// 	console.log("tab activated", tab);
// 	if (!tab.active) return;
// 	if (!tab.url.includes("http://") && !tab.url.includes("https://")) {
// 		return;
// 	}
// 	const calls = [
// 		getStoredCredentials(),
// 		Application.retrieveApplicationFromStorage(tab),
// 		Vulnerability.removeVulnerabilitiesFromStorage(tab),
// 	];
//
// 	Promise.all(calls)
// 	.then(results => {
// 		const credentialed = isCredentialed(results[0]);
// 		if (credentialed) {
// 			const application = results[1];
// 			setCurrentApplication(application);
// 			if (!CURRENT_APPLICATION && !TAB_CLOSED) {
// 				updateTabBadge(tab, CONTRAST_CONFIGURE_TEXT, CONTRAST_YELLOW);
// 				TAB_CLOSED = false;
// 			}
// 			else if (!isBlacklisted(tab.url)) {
// 				if (!TAB_CLOSED) {
// 					// loadingBadge(tab); // GET STUCK ON LOADING
// 					TAB_CLOSED = false;
// 				}
// 				Vulnerability.updateVulnerabilities(tab, CURRENT_APPLICATION, credentialed);
// 			} else {
// 				removeLoadingBadge(tab);
// 			}
// 		} else {
// 			notifyUserToConfigure(tab);
// 		}
// 	})
// 	.catch((error) => {
// 		console.log(error);
// 		if (!TAB_CLOSED) {
// 			updateTabBadge(tab, "X", CONTRAST_RED)
// 			TAB_CLOSED = false;
// 		}
// 	});
// }

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
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	Queue.setTab(tab);

	// sometimes favIconUrl is the only attribute of changeInfo
	if (changeInfo.favIconUrl && Object.keys(changeInfo).length === 1) {
		return;
	} else if (!tab.active || !changeInfo.status) {
		PAGE_FINISHED_LOADING = false;
		return;
	} else if (chrome.runtime.lastError) {
		return;
	} else if (!tab.url.includes("http://") && !tab.url.includes("https://")) {
		// Don't run logic when user opens a new tab, or when url isn't http (ex. chrome://)
		return;
	} else if (changeInfo.status === "loading") {
		// GET STUCK ON LOADING if done for both "loading" and "complete"
		// NOTE: UPDATEBADGE
		if (!TAB_CLOSED) {
			console.log("setting loading badge");
			loadingBadge(tab);
			TAB_CLOSED = false;
		}
		return;
	}

	const calls = [
		getStoredCredentials(),
		Application.retrieveApplicationFromStorage(tab),
	];

	Promise.all(calls)
	.then(initalActions => {
		if (!initalActions) updateTabBadge(tab, "X", CONTRAST_RED);

		if (!result[0] || !result[1]) {
			updateTabBadge(tab, CONTRAST_CONFIGURE_TEXT, CONTRAST_YELLOW);
			return;
		}

		Queue.setCredentialed(isCredentialed(initalActions[0]));
		Queue.setApplication(results[1]);

		_gatherFormsFromPage().then(formActions => {
			Queue.addForms(formActions)
			if (PAGE_FINISHED_LOADING) {
				Queue.executeQueue();
			}
		});
	})
	.catch(console.error)
});

function _gatherFormsFromPage() {
	return new Promise((resolve, reject) => {
		chrome.tabs.sendMessage(tab.id, { action: GATHER_FORMS_ACTION }, (resp) => {
      console.log("Response to gather GATHER_FORMS_ACTION send message", resp);
			if (resp && resp.formActions && resp.formActions.length > 0) {
				const formActions = deDupeArray(resp.formActions);
				resolve(formActions);
			} else {
				reject("Error gathering forms");
			}
		});
	});
}

/**
 * tabUpdateComplete - returns if the tab has completed updating and has a url
 *
 * @param  {Object} changeInfo info about that status of the tab changes
 * @param  {Object} tab        the chrome tab
 * @return {Boolean}           if the tab has completed updating
 */
export function tabUpdateComplete(changeInfo, tab) {
	return changeInfo.status === "complete" && tab.url.startsWith("http");
}



// ------------------------------------------------------------------
// -------------------------- HELPERS -------------------------------
// ------------------------------------------------------------------

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
