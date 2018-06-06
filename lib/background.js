"use strict";

var _util = require("./util.js");

/******************************************************************************
 ********************************* GLOBALS ************************************
 ******************************************************************************/
var TAB_CLOSED = false; /*global
                        	URL,
                        	chrome,
                        	module,
                        */

var VULNERABLE_TABS = []; // tab ids of tabs where vulnerabilities count != 0
var XHR_REQUESTS = []; // use to not re-evaluate xhr requests

// set on activated or on initial web request
// use in place of retrieveApplicationFromStorage due to async
// NOTE: Need to do this for checking requests before sending to teamserver
// Only requests from applications that are connected should be sent for checking to teamserver, asynchronously retrieving the application from chrome storage on every request in chrome.webRequest.onBeforeRequest resulted in inconsistent vulnerability returns.
var CURRENT_APPLICATION = null;

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

/**
 * @param  {Object} request a request object
 * @param  {Object} sender  which script sent the request
 * @param  {Function} sendResponse return information to sender, must be JSON serializable
 * @return {Boolean} - From the documentation:
 * https://developer.chrome.com/extensions/runtime#event-onMessage
 * This function becomes invalid when the event listener returns, unless you return true from the event listener to indicate you wish to send a response alocalhronously (this will keep the message channel open to the other end until sendResponse is called).
 */
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
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
			handleRuntimeOnMessage(request, sendResponse, tab);
		} else {
			(0, _util.removeLoadingBadge)(tab);
		}
	});

	return true;
});

/**
 * handleRuntimeOnMessage - called when the background receives a message
 *
 * @param  {Object} request
 * @param  {Function} sendResponse
 * @param  {Object} tab
 * @return {void}
 */
function handleRuntimeOnMessage(request, sendResponse, tab) {
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
			evaluateVulnerabilities((0, _util.isCredentialed)(creds), tab, XHR_REQUESTS, CURRENT_APPLICATION, true);
		}).catch(function () {
			return (0, _util.updateTabBadge)(tab, "X", _util.CONTRAST_RED);
		});
	} else if (request.sender === _util.GATHER_FORMS_ACTION) {
		return (0, _util.getStoredCredentials)().then(function (creds) {
			var formActions = request.formActions;

			if (!!formActions && CURRENT_APPLICATION) {
				evaluateVulnerabilities((0, _util.isCredentialed)(creds), tab, formActions, CURRENT_APPLICATION, false);
			}
		}).catch(function () {
			return (0, _util.updateTabBadge)(tab, "X", _util.CONTRAST_RED);
		});
	}
	return request;
}

// ------------------------- TAB ACTIVATION -------------------------

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
	if (!tab.active) return;
	if (!tab.url.includes("http://") && !tab.url.includes("https://")) {
		return;
	}

	(0, _util.retrieveApplicationFromStorage)(tab).then(function (application) {
		_setCurrentApplication(application);
		if (!CURRENT_APPLICATION) {
			(0, _util.updateTabBadge)(tab, _util.CONTRAST_CONFIGURE_TEXT, _util.CONTRAST_YELLOW);
		} else if (!(0, _util.isBlacklisted)(tab.url)) {
			(0, _util.updateTabBadge)(tab, "↻", _util.CONTRAST_GREEN); // GET STUCK ON LOADING
			updateVulnerabilities(tab);
		} else {
			(0, _util.removeLoadingBadge)(tab);
		}
	}).catch(function () {
		(0, _util.updateTabBadge)(tab, "X", _util.CONTRAST_RED);
	});
}

/**
 * anonymous function - called when tab is updated including any changes to url
 *
 * @param  {Integer} tabId     the chrome defined id of the tab
 * @param  {Object} changeInfo Lists the changes to the state of the tab that was updated.
 * @param  {Object} tab        Gives the state of the tab that was updated.
 * @return {void}
 */
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	if (!tab.active) return;
	if (chrome.runtime.lastError) return;

	// Don't run logic when user opens a new tab, or when url isn't http (ex. chrome://)
	if (!tab.url.includes("http://") && !tab.url.includes("https://")) {
		return;
	}

	(0, _util.retrieveApplicationFromStorage)(tab).then(function (application) {
		return _setCurrentApplication(application);
	}).catch(function () {
		return (0, _util.updateTabBadge)(tab, "X", _util.CONTRAST_RED);
	});

	if (!CURRENT_APPLICATION) {
		(0, _util.updateTabBadge)(tab, _util.CONTRAST_CONFIGURE_TEXT, _util.CONTRAST_YELLOW);
		return;
	}

	// GET STUCK ON LOADING if done for both "loading" and "complete"
	if (changeInfo.status === "loading") {
		// NOTE: UPDATEBADGE
		(0, _util.updateTabBadge)(tab, "↻", _util.CONTRAST_GREEN);
	}

	if (tabUpdateComplete(changeInfo, tab) && !(0, _util.isBlacklisted)(tab.url)) {
		updateVulnerabilities(tab);
	} else if ((0, _util.isBlacklisted)(tab.url)) {
		(0, _util.removeLoadingBadge)(tab);
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
chrome.tabs.onRemoved.addListener(function () {
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
	// first remove old vulnerabilities since tab has updated
	removeVulnerabilitiesFromStorage(tab).then(function () {
		(0, _util.getStoredCredentials)().then(function (items) {
			var evaluated = false;
			var credentialed = (0, _util.isCredentialed)(items);
			if (!CURRENT_APPLICATION) return;
			if (credentialed && !evaluated) {
				chrome.tabs.sendMessage(tab.id, { action: _util.GATHER_FORMS_ACTION }, function (response) {

					// NOTE: An undefined reponse usually occurrs only in dev, when a user navigates to a tab after reloading the extension and doesn't refresh the page.
					if (!response) {
						(0, _util.updateTabBadge)(tab, "X", _util.CONTRAST_RED);
						// NOTE: Possibly dangerous if !response even after reload
						// chrome.tabs.reload(tab.id)
						return;
					}

					evaluated = true;

					var conditions = [response, response.formActions, response.formActions.length > 0];

					if (conditions.every(function (c) {
						return !!c;
					})) {
						var formActions = response.formActions;

						var traceUrls = [tab.url].concat(formActions);
						evaluateVulnerabilities(credentialed, tab, traceUrls, CURRENT_APPLICATION);
					} else {
						evaluateVulnerabilities(credentialed, tab, [tab.url], CURRENT_APPLICATION);
					}
				});
			} else {
				getCredentials(tab);
			}
		}).catch(function () {
			(0, _util.updateTabBadge)(tab, "X", _util.CONTRAST_RED);
		});
	}).catch(function () {
		(0, _util.updateTabBadge)(tab, "X", _util.CONTRAST_RED);
	});
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
	var isXHR = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;

	var url = new URL(tab.url);
	var host = (0, _util.getHostFromUrl)(url);

	if (hasCredentials && !!traceUrls && traceUrls.length > 0) {
		if (!application) return;

		// generate an array of only pathnames
		var urlQueryString = (0, _util.generateURLString)(traceUrls);

		(0, _util.getOrganizationVulnerabilityIds)(urlQueryString, application[host]).then(function (json) {
			if (!json) {
				throw new Error("Error getting json from application trace ids");
			} else if (json.traces.length === 0) {
				if (!chrome.runtime.lastError && !isXHR) {
					(0, _util.updateTabBadge)(tab, json.traces.length.toString(), _util.CONTRAST_RED);
				}
			} else if (!isXHR) {
				chrome.tabs.sendMessage(tab.id, {
					action: "HIGHLIGHT_VULNERABLE_FORMS",
					traceUrls: traceUrls
				});
				setToStorage(json.traces, tab);
			} else {
				// reset XHR global request array to empty, now accepting new requests
				XHR_REQUESTS = [];
				setToStorage(json.traces, tab);
			}
		}).catch(function () {
			(0, _util.updateTabBadge)(tab, "X", _util.CONTRAST_RED);
		});
	} else if (hasCredentials && !!traceUrls && traceUrls.length === 0) {
		(0, _util.updateTabBadge)(tab, traceUrls.length.toString(), _util.CONTRAST_RED);
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
	var traces = foundTraces.filter(Boolean);

	buildVulnerabilitiesArray(traces, tab).then(function (vulnerabilities) {
		// storedTraces[STORED_TRACES_KEY] = JSON.stringify(vulnerabilities);

		// add tab id to VULNERABLE_TABS so that vulnerabilities can be assessed if tab is reactivated
		if (JSON.stringify(vulnerabilities).length > 0) {
			VULNERABLE_TABS.push(tab.id);
		}
		chrome.storage.local.get(_util.STORED_TRACES_KEY, function (currentTraces) {
			var parsed = [];
			if (currentTraces[_util.STORED_TRACES_KEY]) {
				parsed = JSON.parse(currentTraces[_util.STORED_TRACES_KEY]);
			}

			var storedTraces = {};
			var newVulns = parsed.concat(vulnerabilities);

			storedTraces[_util.STORED_TRACES_KEY] = JSON.stringify((0, _util.deDupeArray)(newVulns));

			// takes a callback with a result param but there's nothing to do with it and eslint doesn't like unused params or empty blocks
			chrome.storage.local.set(storedTraces, function () {
				chrome.storage.local.get(_util.STORED_TRACES_KEY, function (result) {
					// set tab badget to the length of traces in storage (can change)
					(0, _util.updateTabBadge)(tab, JSON.parse(result[_util.STORED_TRACES_KEY]).length.toString(), _util.CONTRAST_RED);
				});
			});
		});
	}).catch(function () {
		(0, _util.updateTabBadge)(tab, "X", _util.CONTRAST_RED);
	});
}

/**
 * buildVulnerabilitiesArray - builds an array of trace ids, retrieving previously stored ids and deduping
 *
 * @param  {Array} foundTraces - trace ids of vulnerabilities found
 * @return {Promise} - a promise that resolves to an array of deduplicated trace ids
 */
function buildVulnerabilitiesArray(foundTraces, tab) {
	return new Promise(function (resolve, reject) {

		// first check if there are already vulnerabilities in storage
		chrome.storage.local.get(_util.STORED_TRACES_KEY, function (result) {
			var results = void 0;

			// results have not been set yet so just pass on foundTraces
			if (!result[_util.STORED_TRACES_KEY] || !!result[_util.STORED_TRACES_KEY] && JSON.parse(result[_util.STORED_TRACES_KEY]).length === 0) {
				resolve((0, _util.deDupeArray)(foundTraces));
			} else {
				try {
					// add existing foundTraces to passed in array
					results = JSON.parse(result[_util.STORED_TRACES_KEY]);
					results = results.concat(foundTraces);
					resolve((0, _util.deDupeArray)(results));
				} catch (e) {
					// if this errors then remove all the vulnerabilities from storage and start over
					removeVulnerabilitiesFromStorage(tab).then(function () {
						resolve([]);
					});
				}
			}
			reject(new Error("Rejected buildVulnerabilitiesArray"));
		});
	});
}

/**
 * removeVulnerabilitiesFromStorage - removes all trace ids from storage
 *
 * @return {Promise} - returns a promise for localhronous execution
 */
function removeVulnerabilitiesFromStorage() {
	return new Promise(function (resolve, reject) {
		chrome.storage.local.remove(_util.STORED_TRACES_KEY, function () {
			if (chrome.runtime.lastError) {
				reject(new Error(chrome.runtime.lastError));
			}

			resolve();
		});
	});
}

/**
 * getCredentials - retrieves and stores credentials for user extension
 *
 * @param  {Object} tab Gives the state of the current tab
 * @return {void}
 */
function getCredentials(tab) {
	if (chrome.runtime.lastError) return;

	var url = new URL(tab.url);
	var conditions = [_util.VALID_TEAMSERVER_HOSTNAMES.includes(url.hostname) && tab.url.endsWith(_util.TEAMSERVER_ACCOUNT_PATH_SUFFIX), tab.url.endsWith(_util.TEAMSERVER_PROFILE_PATH_SUFFIX) && tab.url.indexOf(_util.TEAMSERVER_INDEX_PATH_SUFFIX) !== -1, !chrome.runtime.lastError];
	if (!TAB_CLOSED && conditions.some(function (c) {
		return !!c;
	})) {
		(0, _util.updateTabBadge)(tab, _util.CONTRAST_CONFIGURE_TEXT, _util.CONTRAST_YELLOW);
	}
}

/**
 * _setCurrentApplication - description
 *
 * @param  {Object} application application to set as the CURRENT_APPLICATION
 * @return {Object}           	the new CURRENT_APPLICATION
 */
function _setCurrentApplication(application) {
	CURRENT_APPLICATION = application;
	return CURRENT_APPLICATION;
}

module.exports = {
	handleWebRequest: handleWebRequest,
	handleRuntimeOnMessage: handleRuntimeOnMessage,
	handleTabActivated: handleTabActivated,
	tabUpdateComplete: tabUpdateComplete,
	updateVulnerabilities: updateVulnerabilities,
	evaluateVulnerabilities: evaluateVulnerabilities,
	setToStorage: setToStorage,
	buildVulnerabilitiesArray: buildVulnerabilitiesArray,
	removeVulnerabilitiesFromStorage: removeVulnerabilitiesFromStorage,
	getCredentials: getCredentials,
	_setCurrentApplication: _setCurrentApplication,
	TAB_CLOSED: TAB_CLOSED,
	VULNERABLE_TABS: VULNERABLE_TABS,
	XHR_REQUESTS: XHR_REQUESTS,
	CURRENT_APPLICATION: CURRENT_APPLICATION
};