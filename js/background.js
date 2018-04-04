/*global
URL, chrome, TEAMSERVER_INDEX_PATH_SUFFIX, TEAMSERVER_ACCOUNT_PATH_SUFFIX,
CONTRAST_USERNAME,
  CONTRAST_SERVICE_KEY,
  CONTRAST_API_KEY,
  CONTRAST_ORG_UUID,
  TEAMSERVER_URL,
  VALID_TEAMSERVER_HOSTNAMES,
  CONTRAST_ICON_BADGE_BACKGROUND,
  CONTRAST_ICON_BADGE_CONFIGURE_EXTENSION_TEXT,
  CONTRAST_ICON_BADGE_CONFIGURE_EXTENSION_BACKGROUND,
  getOrganizationVulnerabilityesIds,
  TEAMSERVER_PROFILE_PATH_SUFFIX
*/
"use strict";
// window.TRACE_URLS = [] // NOTE: Use with storing XHR
/**
 * called before any local or alocal request is sent
 * captures xhr and resource requests
 *
 * @param  {Function} function - callback
 * @param {Object} filter - allows limiting the requests for which events are triggered in various dimensions including urls
 * @return {void}
 */
chrome.webRequest.onBeforeRequest.addListener(function(request) {

	// only permit xhr requests
	// don't monitor xhr requests made by extension
	if (request.type === "xmlhttprequest" && !request.url.includes("Contrast")) {
	chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {

		const tab = tabs[0]
		if (tab.url.includes(TEAMSERVER_API_PATH_SUFFIX) || request.url.includes(TEAMSERVER_API_PATH_SUFFIX)) {
			return;
		}

			chrome.storage.local.get([
				CONTRAST_USERNAME,
				CONTRAST_SERVICE_KEY,
				CONTRAST_API_KEY,
				TEAMSERVER_URL
			], function (items) {
				const credentialed = isCredentialed(items)
				if (credentialed) {
					evaluateVulnerabilities(credentialed, tab, [request.url])
				}
			})
		})
	}
}, { urls: [LISTENING_ON_DOMAIN] })

/**
 * anonymous function - called when tab is updated including any changes to url
 *
 * @param  {Integer} tabId     the chrome defined id of the tab
 * @param  {Object} changeInfo Lists the changes to the state of the tab that was updated.
 * @param  {Object} tab        Gives the state of the tab that was updated.
 * @return {void}
 */
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {

	// send message to content scripts that tab has updated
	removeVulnerabilitiesFromStorage(tab).then(function() {

		if (changeInfo.status === "complete" && tab.url.startsWith("http")) {

			chrome.storage.local.get([CONTRAST_USERNAME, CONTRAST_SERVICE_KEY, CONTRAST_API_KEY, TEAMSERVER_URL], function (items) {
				const credentialed = isCredentialed(items)

				if (credentialed) {

					// check form actions for vulnerabilities
					chrome.tabs.sendMessage(tabId, { action: GATHER_FORMS_ACTION, tabUrl: tab.url }, function(response) {

						let traceUrls = []

						if (!!response && !!response.formActions) {
							const formActions = response.formActions
							if (formActions.length > 0) {
								for (let i = 0; i < formActions.length; i++) {
									traceUrls.push(formActions[i])
								}
							}
						}
						// concat formAction TRACE_URLS with tab url
						traceUrls = traceUrls.concat(tab.url)
						evaluateVulnerabilities(credentialed, tab, traceUrls)
					});
				} else {
					getCredentials(tab)
				}
			});
		}
	})
});

/**
 * generateURLString - creates a string of base64 encoded urls to send to TS as params
 *
 * @param  {Array} traceUrls - array of urls retrieved from tab and form actions
 * @return {String} - string of base64 encoded urls to send to TS as params
 */
function generateURLString(traceUrls) {
	if (!traceUrls || traceUrls.length === 0) {
		console.log("traceUrls in generateURLString", traceUrls);
		return ""
	}
	const urls = traceUrls.map(u => {
		let url;
		// first make an array of url paths
		url = new URL(u).pathname

		// second convert each path to base64 and return
		return btoa(url)
	})
	// return each base64 encoded url path with a common in between
	return urls.join(',')
}

/**
 * evaluateVulnerabilities - method used by tab url, xhr and form actions to check TS for vulnerabilities
 *
 * @param  {Boolean} hasCredentials if the user has credentialed the extension
 * @param  {Object} tab            Gives the state of the current tab
 * @param  {Array} traceUrls     the urls that will be queried to TS
 * @return {void}
 */
function evaluateVulnerabilities(hasCredentials, tab, traceUrls) {
	// console.log(traceUrls.length);
	if (hasCredentials) {
		// generate an array of only pathnames
		const urlQueryString = generateURLString(traceUrls)
		getOrganizationVulnerabilityesIds(urlQueryString, function() {
			return function(e) {
				const xhr = e.currentTarget;
				if (xhr.readyState === 4 && xhr.responseText !== "") {

					const json = JSON.parse(xhr.responseText);
					if (json.traces && json.traces.length > 0) {
						if (chrome.runtime.lastError) {
							return;
						}
						setToStorage(json.traces, tab)
					}

				}
			};
		});
	} else {
		getCredentials(tab)
	}
}

/**
 * updateTabBadge - updates the extension badge on the toolbar
 *
 * @param  {Object} tab    Gives the state of the current tab
 * @param  {Integer} count the number of vulnerabilities found
 * @return {void}
 */
function updateTabBadge(tab, count) {
	if (tab.index >= 0) { // tab is visible
		chrome.browserAction.setBadgeBackgroundColor({
			color: CONTRAST_ICON_BADGE_BACKGROUND
		});
		chrome.browserAction.setBadgeText({
			tabId: tab.id,
			text: count.toString(),
		});
	}
}

/**
 * setToStorage - locals the trace ids of found vulnerabilities to storage
 *
 * @param  {Array} foundTraces - trace ids of vulnerabilities found
 * @param  {Object} tab - Gives the state of the current tab
 * @param {Boolean} isTraces - if saving traces or urls
 * @return {Promise}
 */
function setToStorage(foundTraces, tab, isTraces) {
	buildVulnerabilitiesArray(foundTraces, tab).then((vulnerabilities) => {
		updateTabBadge(tab, vulnerabilities.length)

		let traces = {}
		traces[STORED_TRACES_KEY] = JSON.stringify(vulnerabilities)

		chrome.storage.local.set(traces, (result) => {
			if (chrome.runtime.lastError) {
				console.log("error storing " + STORED_TRACES_KEY);
			} else {
				console.log(STORED_TRACES_KEY + " stored");
			}
		})
	})
	.catch(function(error) {
		console.log("caught promise in setToStorage");
	})
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
				resolve(removeDuplicatesFromArray(foundTraces))
			} else {
				try {
					// add existing foundTraces to passed in array
					results = JSON.parse(result[STORED_TRACES_KEY])
					results = results.concat(foundTraces)
					resolve(removeDuplicatesFromArray(results))
				} catch (e) {
					// if this errors then remove all the vulnerabilities from storage and start over
					removeVulnerabilitiesFromStorage(tab).then(() => {
						resolve([])
					})
				}
			}
		})
	})
}

/**
 * removeVulnerabilitiesFromStorage - removes all trace ids from storage
 *
 * @return {Promise} - returns a promise for localhronous execution
 */
function removeVulnerabilitiesFromStorage(tab) {

	// reset global TRACE_URLS to empty
	// TRACE_URLS = []

	return new Promise((resolve, reject) => {
		chrome.storage.local.remove(STORED_TRACES_KEY, () => {
			try {
				chrome.browserAction.setBadgeBackgroundColor({
					color: '#00FFFFFF' // transparent
				});
				chrome.browserAction.setBadgeText({ tabId: tab.id, text: '' });
				console.log("vulnerabilities removed");
			} catch (e) {
				console.log("error removing vulnerabilities");
			}
			resolve()
		})
	})
}

/**
 * chrome - description
 *
 * @param  {Object} request a request object
 * @param  {Object} sender  which script sent the request
 * @param  {Function} sendResponse return information to sender, must be JSON serializable
 * @return {Boolean} - From the documentation:
 * https://developer.chrome.com/extensions/runtime#event-onMessage
 * This function becomes invalid when the event listener returns, unless you return true from the event listener to indicate you wish to send a response alocalhronously (this will keep the message channel open to the other end until sendResponse is called).
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request === TRACES_REQUEST) {
		chrome.storage.local.get(STORED_TRACES_KEY, (result) => {
			if (!!result && !!result.traces) {
				sendResponse({ traces: JSON.parse(result.traces) })
			}
		})
	}

	return true
})

/**
 * getCredentials - retrieves and stores credentials for user extension
 *
 * @param  {Object} tab Gives the state of the current tab
 * @return {void}
 */
function getCredentials(tab) {
	const url = new URL(tab.url);
	if (VALID_TEAMSERVER_HOSTNAMES.includes(url.hostname)
		&& (tab.url.endsWith(TEAMSERVER_ACCOUNT_PATH_SUFFIX) || tab.url.endsWith(TEAMSERVER_PROFILE_PATH_SUFFIX))
		&& tab.url.indexOf(TEAMSERVER_INDEX_PATH_SUFFIX) !== -1) {

		chrome.browserAction.setBadgeBackgroundColor({
			color: CONTRAST_ICON_BADGE_CONFIGURE_EXTENSION_BACKGROUND
		});
		chrome.browserAction.setBadgeText({
			tabId: tab.id,
			text: CONTRAST_ICON_BADGE_CONFIGURE_EXTENSION_TEXT
		});

	} else {
		chrome.browserAction.getBadgeText({
			tabId: tab.id
		}, function (result) {
			if (result === CONTRAST_ICON_BADGE_CONFIGURE_EXTENSION_TEXT) {
				chrome.browserAction.setBadgeText({ tabId: tab.id, text: '' });
			}
		});
	}
}
