/*global
	URL,
	chrome,
	TEAMSERVER_INDEX_PATH_SUFFIX,
	TEAMSERVER_ACCOUNT_PATH_SUFFIX,
  VALID_TEAMSERVER_HOSTNAMES,
  CONTRAST_CONFIGURE_TEXT,
  CONTRAST_YELLOW,
  getOrganizationVulnerabilityIds,
  TEAMSERVER_PROFILE_PATH_SUFFIX,
	TEAMSERVER_API_PATH_SUFFIX,
	CONTRAST_RED,
	CONTRAST_GREEN,
	LISTENING_ON_DOMAIN,
	TRACES_REQUEST,
	GATHER_FORMS_ACTION,
	STORED_TRACES_KEY,
	getStoredCredentials,
	isCredentialed,
	isBlacklisted,
	deDupeArray,
	generateURLString,
	getHostFromUrl,
	updateTabBadge,
	removeLoadingBadge,
	retrieveApplicationFromStorage,
*/

"use strict";

/******************************************************************************
 ********************************* GLOBALS ************************************
 ******************************************************************************/
let TAB_CLOSED 			= false;
let VULNERABLE_TABS = []; // tab ids of tabs where vulnerabilities count != 0
let XHR_REQUESTS 		= []; // use to not re-evaluate xhr requests





/******************************************************************************
 *************************** CHROME EVENT LISTENERS ***************************
 ******************************************************************************/
/**
 * called before any local or alocal request is sent
 * captures xhr and resource requests
 *
 * @param  {Function} function - callback
 * @param {Object} filter - allows limiting the requests for which events are triggered in various dimensions including urls
 * @return {void}
 */
chrome.webRequest.onBeforeRequest.addListener((request) => {
	// only permit xhr requests
	// don't monitor xhr requests made by extension
	if (request.type === "xmlhttprequest" && !isBlacklisted(request.url)) {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			const tab = tabs[0];
			if (!tab || tab.url.includes(TEAMSERVER_API_PATH_SUFFIX)) return;

			getStoredCredentials()
			.then(items => {
				const credentialed = isCredentialed(items);
				if (credentialed && !XHR_REQUESTS.includes(request.url)) {
					XHR_REQUESTS.push(request.url);
					evaluateVulnerabilities(credentialed, tab, [request.url]);
				}
			})
			.catch(() => updateTabBadge(tab, "X", CONTRAST_RED));
		})
	}
}, { urls: [LISTENING_ON_DOMAIN] });

/**
 * @param  {Object} request a request object
 * @param  {Object} sender  which script sent the request
 * @param  {Function} sendResponse return information to sender, must be JSON serializable
 * @return {Boolean} - From the documentation:
 * https://developer.chrome.com/extensions/runtime#event-onMessage
 * This function becomes invalid when the event listener returns, unless you return true from the event listener to indicate you wish to send a response alocalhronously (this will keep the message channel open to the other end until sendResponse is called).
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		const tab = tabs[0];

		// NOTE: UPDATEBADGE
		// Don't update badge when popup is opened
		// Whent he extension popup is opened it sends a request to the background for the traces in chrome storage. In addition to receiving a message here, chrome.tabs.onUpdated is also called which will update the badge. Since we don't want that to happen twice, don't update the badge here when the extension popup is opened.
		// NOTE: How the loading icon works, since <meta charset="utf-8"> is in index.html using the explicit icon is okay https://stackoverflow.com/questions/44090434/chrome-extension-badge-text-renders-as-%C3%A2%C5%93
		//#x21bb; is unicode clockwise circular arrow
		if (request !== TRACES_REQUEST) {
			updateTabBadge(tab, "↻", CONTRAST_GREEN);
		}

		if (!isBlacklisted(tab.url)) {
			handleRuntimeOnMessage(request, sender, sendResponse);
		} else {
			removeLoadingBadge(tab)
		}
	});

	return true;
})

/**
 * handleRuntimeOnMessage - called when the background receives a message
 *
 * @param  {Object} request
 * @param  {Object} sender
 * @param  {Function} sendResponse
 * @return {void}
 */
function handleRuntimeOnMessage(request, sender, sendResponse) {
	if (request === TRACES_REQUEST) {
		chrome.storage.local.get(STORED_TRACES_KEY, (result) => {
			if (!!result && !!result.traces) {
				sendResponse({ traces: JSON.parse(result.traces) });
			}
		})
	}

	else if (request.sender === GATHER_FORMS_ACTION) {
		getStoredCredentials()
		.then(creds => {
			const { formActions } = request;
			if (!!formActions) {
				evaluateVulnerabilities(isCredentialed(creds), sender.tab, formActions);
			}
		})
	}
}

chrome.tabs.onActivated.addListener(activeInfo => {
	handleTabActivated(activeInfo);
})

/**
 * handleTabActivated - description
 *
 * @param  {Object} activeInfo - ids of window and tab that have become active
 * @return {void}
 */
function handleTabActivated() {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

		if (!tabs || tabs.length === 0) return;

		const tab = tabs[0];

		if (!tab.url.includes("http://") && !tab.url.includes("https://")) {
			return;
		}

		if (!isBlacklisted(tab.url)) {
			updateTabBadge(tab, "↻", CONTRAST_GREEN); // GET STUCK ON LOADING
			updateVulnerabilities(tab);
		} else {
			removeLoadingBadge(tab)
		}
	})
}

/**
 * anonymous function - called when tab is updated including any changes to url
 *
 * @param  {Integer} tabId     the chrome defined id of the tab
 * @param  {Object} changeInfo Lists the changes to the state of the tab that was updated.
 * @param  {Object} tab        Gives the state of the tab that was updated.
 * @return {void}
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
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

	if (tabUpdateComplete(changeInfo, tab) && !isBlacklisted(tab.url)) {
		updateVulnerabilities(tab);
	} else if (isBlacklisted(tab.url)) {
		removeLoadingBadge(tab)
	}
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


/**
 * set the TAB_CLOSED global to true if a tab is closed
 * other function listen to this and will cancel execution if it is true
 */
chrome.tabs.onRemoved.addListener(() => {
	TAB_CLOSED = true;
});





/*****************************************************************************
 ************************** VULNERABILITY FUNCTIONS **************************
 *****************************************************************************/
/**
 * updateVulnerabilities - updates the currenctly stored trace ids
 *
 * @param  {Object} tab Gives the state of the tab that was updated.
 * @return {void}
 */
function updateVulnerabilities(tab) {
	// reset XHR global request array to empty, now accepting new requests
	XHR_REQUESTS = [];
	// first remove old vulnerabilities since tab has updated
	removeVulnerabilitiesFromStorage(tab).then(() => {
		getStoredCredentials().then(items => {
			let evaluated = false;
			const credentialed = isCredentialed(items);

			retrieveApplicationFromStorage(tab).then(application => {
				if (!application) return;

				if (credentialed && !evaluated) {
					chrome.tabs.sendMessage(tab.id, { action: GATHER_FORMS_ACTION }, (response) => {

						if (!response) {
							removeLoadingBadge(tab);
							return
						}

						evaluated = true;

						let conditions = [
							response,
							response.formActions,
							response.formActions.length > 0,
						];

						if (conditions.every(c => !!c)) {
							const { formActions } = response;
							const traceUrls 			= [tab.url].concat(formActions);
							evaluateVulnerabilities(credentialed, tab, traceUrls, application)
						} else {
							evaluateVulnerabilities(credentialed, tab, [tab.url], application);
						}
					})
				} else {
					getCredentials(tab);
				}
			}).catch(() => updateTabBadge(tab, "X", CONTRAST_RED));
		}).catch(() => updateTabBadge(tab, "X", CONTRAST_RED));
	}).catch(() => updateTabBadge(tab, "X", CONTRAST_RED));
	return;
}

/**
 * evaluateVulnerabilities - method used by tab url, xhr and form actions to check TS for vulnerabilities
 *
 * @param  {Boolean} hasCredentials if the user has credentialed the extension
 * @param  {Object} tab            Gives the state of the current tab
 * @param  {Array} traceUrls     the urls that will be queried to TS
 * @return {void}
 */
function evaluateVulnerabilities(hasCredentials, tab, traceUrls, application) {
	const url  = new URL(tab.url);
	const host = getHostFromUrl(url);

	if (hasCredentials && !!traceUrls && traceUrls.length > 0) {

		if (!application) return;

		// generate an array of only pathnames
		const urlQueryString = generateURLString(traceUrls);

		getOrganizationVulnerabilityIds(urlQueryString, application[host])
		.then(json => {
			if (!json) {
				throw new Error("Error getting json from application trace ids");
			} else if (json.traces.length === 0) {
				if (!chrome.runtime.lastError) {
					updateTabBadge(tab, json.traces.length.toString(), CONTRAST_RED);
				}
			} else {
				chrome.tabs.sendMessage(tab.id, {
					action: "HIGHLIGHT_VULNERABLE_FORMS",
					traceUrls
				});
				setToStorage(json.traces, tab);
			}
		})
		.catch(() => updateTabBadge(tab, "X", CONTRAST_RED));
	} else if (hasCredentials && !!traceUrls && traceUrls.length === 0) {
		updateTabBadge(tab, traceUrls.length.toString(), CONTRAST_RED);
	} else {
		getCredentials(tab);
	}
}

/**
 * setToStorage - locals the trace ids of found vulnerabilities to storage
 * https://blog.lavrton.com/javascript-loops-how-to-handle-async-await-6252dd3c795
 * https://stackoverflow.com/a/37576787/6410635
 *
 *
 * @param  {Array} foundTraces - trace ids of vulnerabilities found
 * @param  {Object} tab - Gives the state of the current tab
 * @return {Promise}
 */
function setToStorage(foundTraces, tab) {
		// clean the traces array of empty strings which are falsey in JS and which will be there if a trace doesn't match a given URI
		const traces = foundTraces.filter(t => !!t);

		buildVulnerabilitiesArray(traces, tab)
		.then(vulnerabilities => {
			let storedTraces = {};
			storedTraces[STORED_TRACES_KEY] = JSON.stringify(vulnerabilities);

			// add tab id to VULNERABLE_TABS so that vulnerabilities can be assessed if tab is reactivated
			if (JSON.stringify(vulnerabilities).length > 0) {
				VULNERABLE_TABS.push(tab.id);
			}

			// takes a callback with a result param but there's nothing to do with it and eslint doesn't like unused params or empty blocks
			chrome.storage.local.set(storedTraces, () => {
				chrome.storage.local.get(STORED_TRACES_KEY, (result) => {
					// set tab badget to the length of traces in storage (can change)
					updateTabBadge(
						tab,
						JSON.parse(result[STORED_TRACES_KEY]).length.toString(),
						CONTRAST_RED
					);
				});
			});
		})
		.catch(() => updateTabBadge(tab, "X", CONTRAST_RED));
}

/**
 * buildVulnerabilitiesArray - builds an array of trace ids, retrieving previously stored ids and deduping
 *
 * @param  {Array} foundTraces - trace ids of vulnerabilities found
 * @return {Promise} - a promise that resolves to an array of deduplicated trace ids
 */
function buildVulnerabilitiesArray(foundTraces, tab) {
	return new Promise((resolve, reject) => {

		// first check if there are already vulnerabilities in storage
		chrome.storage.local.get(STORED_TRACES_KEY, (result) => {
			let results;

			// results have not been set yet so just pass on foundTraces
			if (!result[STORED_TRACES_KEY] || (!!result[STORED_TRACES_KEY] && JSON.parse(result[STORED_TRACES_KEY]).length === 0)) {
				resolve(deDupeArray(foundTraces));
			} else {
				try {
					// add existing foundTraces to passed in array
					results = JSON.parse(result[STORED_TRACES_KEY]);
					results = results.concat(foundTraces);
					resolve(deDupeArray(results));
				} catch (e) {
					// if this errors then remove all the vulnerabilities from storage and start over
					removeVulnerabilitiesFromStorage(tab).then(() => {
						resolve([]);
					})
				}
			}
			reject(Error("Rejected buildVulnerabilitiesArray"));
		})
	})
}

/**
 * removeVulnerabilitiesFromStorage - removes all trace ids from storage
 *
 * @return {Promise} - returns a promise for localhronous execution
 */
function removeVulnerabilitiesFromStorage() {
	return new Promise((resolve, reject) => {
		chrome.storage.local.remove(STORED_TRACES_KEY, () => {
			if (chrome.runtime.lastError) {
				reject(new Error(chrome.runtime.lastError));
			}

			resolve();
		})
	})
}

/**
 * getCredentials - retrieves and stores credentials for user extension
 *
 * @param  {Object} tab Gives the state of the current tab
 * @return {void}
 */
function getCredentials(tab) {
	if (chrome.runtime.lastError) return;

	const url = new URL(tab.url);
	const conditions = [
		VALID_TEAMSERVER_HOSTNAMES.includes(url.hostname) && tab.url.endsWith(TEAMSERVER_ACCOUNT_PATH_SUFFIX),
		tab.url.endsWith(TEAMSERVER_PROFILE_PATH_SUFFIX) && tab.url.indexOf(TEAMSERVER_INDEX_PATH_SUFFIX) !== -1,
		!chrome.runtime.lastError
	];
	if (!TAB_CLOSED && conditions.some(c => !!c)) {
		updateTabBadge(tab, CONTRAST_CONFIGURE_TEXT, CONTRAST_YELLOW);
	}
}
