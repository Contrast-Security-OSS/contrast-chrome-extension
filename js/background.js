/*global
	URL,
	chrome,
	module,
	window,
*/

import {
	TEAMSERVER_INDEX_PATH_SUFFIX,
	TEAMSERVER_ACCOUNT_PATH_SUFFIX,
	VALID_TEAMSERVER_HOSTNAMES,
	TEAMSERVER_PROFILE_PATH_SUFFIX,
	TEAMSERVER_API_PATH_SUFFIX,
	CONTRAST_RED,
	CONTRAST_GREEN,
	CONTRAST_YELLOW,
	CONTRAST_CONFIGURE_TEXT,
	LISTENING_ON_DOMAIN,
	TRACES_REQUEST,
	GATHER_FORMS_ACTION,
	STORED_TRACES_KEY,
	getStoredCredentials,
	isCredentialed,
	isBlacklisted,
	updateTabBadge,
	removeLoadingBadge,
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
	// only permit xhr requests
	// don't monitor xhr requests made by extension
	handleWebRequest(request);
}, { urls: [LISTENING_ON_DOMAIN] });

export function handleWebRequest(request) {
	const conditions = [
		request.type === "xmlhttprequest",
		!isBlacklisted(request.url),
		!XHR_REQUESTS.includes(request.url),
		!request.url.includes(TEAMSERVER_API_PATH_SUFFIX),
	]
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
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		if (!tabs || tabs.length === 0) return;
		const tab = tabs[0];

		if (!tab.active) return;

		// NOTE: UPDATEBADGE
		// Don't update badge when popup is opened
		// Whent he extension popup is opened it sends a request to the background for the traces in chrome storage. In addition to receiving a message here, chrome.tabs.onUpdated is also called which will update the badge. Since we don't want that to happen twice, don't update the badge here when the extension popup is opened.
		// NOTE: How the loading icon works, since <meta charset="utf-8"> is in index.html using the explicit icon is okay https://stackoverflow.com/questions/44090434/chrome-extension-badge-text-renders-as-%C3%A2%C5%93
		//#x21bb; is unicode clockwise circular arrow
		if (request !== TRACES_REQUEST) {
			updateTabBadge(tab, "↻", CONTRAST_GREEN);
		}

		if (!!tab && !isBlacklisted(tab.url)) {
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
		chrome.storage.local.get(STORED_TRACES_KEY, (result) => {
			if (!!result && !!result[STORED_TRACES_KEY]) {
				sendResponse({ traces: result[STORED_TRACES_KEY] });
			} else {
				sendResponse({ traces: [] });
			}
			removeLoadingBadge(tab);
		})
	}

	else if (request === "EVALUATE_XHR" && CURRENT_APPLICATION) {
		return getStoredCredentials()
		.then(creds => {
			Vulnerability.evaluateVulnerabilities(
				isCredentialed(creds), // if credentialed already
				tab, 									 // current tab
				XHR_REQUESTS, 				 // gathered xhr requests from page load
				CURRENT_APPLICATION, 	 // current app
				true 									 // isXHR
			);
		})
		.catch((error) => {
			console.log(error);
			updateTabBadge(tab, "X", CONTRAST_RED)
		});
	}

	else if (request.sender === GATHER_FORMS_ACTION) {
		return getStoredCredentials()
		.then(creds => {
			const { formActions } = request;
			if (!!formActions && CURRENT_APPLICATION) {
				Vulnerability.evaluateVulnerabilities(
					isCredentialed(creds), // if credentialed already
					tab, 									 // current tab
					formActions, 					 // gathered xhr requests from page load
					CURRENT_APPLICATION, 	 // current app
					false 								 // isXHR
				);
			}
		})
		.catch((error) => {
			console.log(error);
			updateTabBadge(tab, "X", CONTRAST_RED)
		});
	}
	return request;
}



// ------------------------------------------------------------------
// ------------------------- TAB ACTIVATION -------------------------
// ------------------------------------------------------------------

chrome.tabs.onActivated.addListener(activeInfo => {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		if (!tabs || tabs.length === 0) return;
		const tab = tabs[0];

		handleTabActivated(tab);
	});
	return activeInfo;
});

/**
 * handleTabActivated - retrieves the current application from storage and updates the tab badge before checking tab for vulnerabilities
 * @param {Object} tab - the current tab
 * @return {void}
 */
export function handleTabActivated(tab) {
	console.log("tab activated");
	if (!tab.active) return;
	if (!tab.url.includes("http://") && !tab.url.includes("https://")) {
		return;
	}

	const calls = [
		getStoredCredentials(),
		Application.retrieveApplicationFromStorage(tab),
		Vulnerability.removeVulnerabilitiesFromStorage(tab),
	];

	Promise.all(calls)
	.then(results => {
		const credentialed = isCredentialed(results[0]);
		if (credentialed) {
			const application = results[1];
			setCurrentApplication(application);
			if (!CURRENT_APPLICATION) {
				updateTabBadge(tab, CONTRAST_CONFIGURE_TEXT, CONTRAST_YELLOW);
			}
			else if (!isBlacklisted(tab.url)) {
				updateTabBadge(tab, "↻", CONTRAST_GREEN); // GET STUCK ON LOADING
				Vulnerability.updateVulnerabilities(tab, CURRENT_APPLICATION, credentialed);
			} else {
				removeLoadingBadge(tab);
			}
		} else {
			notifyUserToConfigure(tab);
		}
	})
	.catch((error) => {
		console.log(error);
		updateTabBadge(tab, "X", CONTRAST_RED);
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
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
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
		updateTabBadge(tab, "↻", CONTRAST_GREEN);
	}

	const calls = [
		getStoredCredentials(),
		Application.retrieveApplicationFromStorage(tab),
		Vulnerability.removeVulnerabilitiesFromStorage(tab),
	];

	Promise.all(calls)
	.then(results => {
		const credentialed = isCredentialed(results[0]);
		if (credentialed) {
			const application = results[1];
			setCurrentApplication(application);
			if (!CURRENT_APPLICATION) {
				updateTabBadge(tab, CONTRAST_CONFIGURE_TEXT, CONTRAST_YELLOW);
				return;
			}

			if (tabUpdateComplete(changeInfo, tab) && !isBlacklisted(tab.url)) {
				Vulnerability.updateVulnerabilities(tab, CURRENT_APPLICATION, credentialed);
			} else if (isBlacklisted(tab.url)) {
				removeLoadingBadge(tab);
			}
		} else {
			notifyUserToConfigure(tab);
		}
	})
	.catch(error => {
		console.log(error);
		updateTabBadge(tab, "X", CONTRAST_RED);
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
