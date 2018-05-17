/*global
	URL,
	chrome,
	TEAMSERVER_INDEX_PATH_SUFFIX,
	TEAMSERVER_ACCOUNT_PATH_SUFFIX,
  VALID_TEAMSERVER_HOSTNAMES,
  CONTRAST_ICON_BADGE_BACKGROUND,
  CONTRAST_ICON_BADGE_CONFIGURE_EXTENSION_TEXT,
  CONTRAST_ICON_BADGE_CONFIGURE_EXTENSION_BACKGROUND,
  getOrganizationVulnerabilityIds,
  TEAMSERVER_PROFILE_PATH_SUFFIX,
	TEAMSERVER_API_PATH_SUFFIX,
	getStoredCredentials,
	isCredentialed,
	LISTENING_ON_DOMAIN,
	TRACES_REQUEST,
	GATHER_FORMS_ACTION,
	CONTRAT_GREEN,
	STORED_TRACES_KEY,
	deDupeArray,
	getVulnerabilityFilter,
	generateURLString
*/



"use strict";
let TAB_CLOSED = false
let VULNERABLE_TABS = [] // tab ids of tabs where vulnerabilities count != 0
let XHR_REQUESTS = [] // use to not re-evaluate xhr requests

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
	if (request.type === "xmlhttprequest" && !request.url.includes("Contrast")) {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

		const tab = tabs[0]
		if (!tab) return

		if (tab.url.includes(TEAMSERVER_API_PATH_SUFFIX) || request.url.includes(TEAMSERVER_API_PATH_SUFFIX)) {
			return;
		}

			getStoredCredentials().then(items => {
				const credentialed = isCredentialed(items)
				if (credentialed && !XHR_REQUESTS.includes(request.url)) {
					XHR_REQUESTS.push(request.url)
					evaluateVulnerabilities(credentialed, tab, [request.url])
				}
			})
		})
	}
}, { urls: [LISTENING_ON_DOMAIN] })

/**
 * @param  {Object} request a request object
 * @param  {Object} sender  which script sent the request
 * @param  {Function} sendResponse return information to sender, must be JSON serializable
 * @return {Boolean} - From the documentation:
 * https://developer.chrome.com/extensions/runtime#event-onMessage
 * This function becomes invalid when the event listener returns, unless you return true from the event listener to indicate you wish to send a response alocalhronously (this will keep the message channel open to the other end until sendResponse is called).
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	handleRuntimeOnMessage(request, sender, sendResponse)
	return true
})

chrome.tabs.onActivated.addListener(activeInfo => {
	handleTabActivated(activeInfo)
})

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
	TAB_CLOSED = true
})

function handleTabActivated(activeInfo) {
	if (VULNERABLE_TABS.includes(activeInfo.tabId)) {
		chrome.tabs.query({ active: true, windowId: activeInfo.windowId }, (tabs) => {
			if (!tabs || tabs.length === 0) return

			updateVulnerabilities(tabs[0])
		})
	}
}

function handleRuntimeOnMessage(request, sender, sendResponse) {
	if (request === TRACES_REQUEST) {
		chrome.storage.local.get(STORED_TRACES_KEY, (result) => {
			if (!!result && !!result.traces) {
				sendResponse({ traces: JSON.parse(result.traces) })
			}
		})
	}

	else if (request.sender === GATHER_FORMS_ACTION) {
		getStoredCredentials()
		.then(creds => {
			const { formActions } = request
			if (!!formActions && formActions.length > 0) {
				evaluateVulnerabilities(isCredentialed(creds), sender.tab, formActions)
			}
		})
	}
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
	if (tabUpdateComplete(changeInfo, tab)) {
		updateVulnerabilities(tab)
	}
})

function tabUpdateComplete(changeInfo, tab) {
	return changeInfo.status === "complete" && tab.url.startsWith("http")
}

/**
 * updateVulnerabilities - updates the currenctly stored trace ids
 *
 * @param  {Object} tab Gives the state of the tab that was updated.
 * @return {void}
 */
function updateVulnerabilities(tab) {
	// reset XHR request array to empty, now accepting new requests
	XHR_REQUESTS = []

	// first remove old vulnerabilities since tab has updated
	removeVulnerabilitiesFromStorage(tab).then(() => {

		// set color of badge for until update is complete
		setBadgeLoading(tab)

		getStoredCredentials().then(items => {
			let evaluated = false
			const credentialed = isCredentialed(items)

			if (credentialed && !evaluated) {
				chrome.tabs.sendMessage(tab.id, { action: GATHER_FORMS_ACTION }, (response) => {

					evaluated = true
					if (!!response) {
						const { formActions } = response
						if (!!formActions && formActions.length > 0) {
							const traceUrls = [tab.url].concat(formActions)
							evaluateVulnerabilities(credentialed, tab, traceUrls)
						}
					} else {
						evaluateVulnerabilities(credentialed, tab, [tab.url])
					}
				})
			} else {
				getCredentials(tab)
			}
		}).catch(error => error)
	}).catch(error => error)
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
function evaluateVulnerabilities(hasCredentials, tab, traceUrls) {
	if (hasCredentials && !!traceUrls && traceUrls.length > 0) {
		// generate an array of only pathnames
		const urlQueryString = generateURLString(traceUrls)
		getOrganizationVulnerabilityIds(urlQueryString)
		.then(json => setToStorage(json.traces, tab))
		.catch(error => error)
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
	if (!TAB_CLOSED && !chrome.runtime.lastError && tab.index >= 0) { // tab is visible
		try {
			chrome.browserAction.setBadgeBackgroundColor({
				color: CONTRAST_ICON_BADGE_BACKGROUND
			})
			chrome.browserAction.setBadgeText({
				tabId: tab.id,
				text: count.toString(),
			})
		} catch (e) { return null }
			finally { TAB_CLOSED = false }
	}
	return null
}

/**
 * setBadgeLoading - set badge to a loading indicator, especially useful with settimeout thing in the content script
 *
 * @param  {Object} tab    Gives the state of the current tab
 * @return {void}
 */
 // https://stackoverflow.com/questions/44090434/chrome-extension-badge-text-renders-as-%C3%A2%C5%93
function setBadgeLoading(tab) {
	if (!TAB_CLOSED && tab.index >= 0 && !chrome.runtime.lastError) {
		// &#x21bb; is unicode clockwise circular arrow
		try {
			chrome.browserAction.setBadgeBackgroundColor({ color: CONTRAT_GREEN })
			chrome.browserAction.setBadgeText({
				tabId: tab.id,
				text: "↻"
			})
		}
		catch (e) { e }
		finally { TAB_CLOSED = false }
	}
}

/**
 * processTraces - description
 *
 * @param  {Array<String>} traces - array of trace uuids
 * @param  {Object} tab - Gives the state of the current tab
 * @return {Promise<Array>} - A promise that resolves to an array of trace objects
 */
function processTraces(traces, tab) {
	if (!traces || traces.length === 0) {
		return Promise.resolve([])
	}

	/**
	 * asyncRequest - not technically needed, could return getVulnerabilityFilter inside of traces.map below, but it looks cleaner
	 *
	 * @param  {String} trace - a trace uuid
	 * @return {String} - blank or the trace uuid, after it has been checked against the URI of the tab vs. the URI of the trace request
	 */
	function asyncRequest(trace) {
		return getVulnerabilityFilter(trace)
		.then(json => {
			if (!json) {
				return ""
			}
			const request = json.trace.request
			const url 		= new URL(tab.url)

			if (!url) return ""
			if (!url.pathname) {
				console.log("url in bg line 265", url);
			}


			const path 		= url.pathname.match(/\/\w+/)[0] // 1st index is string
			const match 	= request.uri.indexOf(path)
			if (match === -1) {
				return ""
			}
			return trace
		})
		.catch(error)
	}
	return Promise.all(traces.map(t => asyncRequest(t))) // eslint-disable-line consistent-return
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
	processTraces(foundTraces, tab)
	.then(traces => {
		if (!traces) return

		// clean the traces array of empty strings which are falsey in JS and which will be there if a trace doesn't match a given URI (see processTraces)
		traces = traces.filter(t => !!t)

		buildVulnerabilitiesArray(traces, tab)
		.then(vulnerabilities => {

			let storedTraces = {}
			storedTraces[STORED_TRACES_KEY] = JSON.stringify(vulnerabilities)

			// add tab id to VULNERABLE_TABS so that vulnerabilities can be assessed if tab is reactivated
			if (JSON.stringify(vulnerabilities).length > 0) {
				VULNERABLE_TABS.push(tab.id)
			}

			// takes a callback with a result param but there's nothing to do with it and eslint doesn't like unused params or empty blocks
			chrome.storage.local.set(storedTraces, () => {
				chrome.storage.local.get(STORED_TRACES_KEY, (result) => {

					// set tab badget to the length of traces in storage (can change)
					if (!chrome.runtime.lastError && !!tab && tab.id) {
						updateTabBadge(tab, JSON.parse(result[STORED_TRACES_KEY]).length)
					}
				})
			})
		})
		.catch(error => error)
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
				resolve(deDupeArray(foundTraces))
			} else {
				try {
					// add existing foundTraces to passed in array
					results = JSON.parse(result[STORED_TRACES_KEY])
					results = results.concat(foundTraces)
					resolve(deDupeArray(results))
				} catch (e) {
					// if this errors then remove all the vulnerabilities from storage and start over
					removeVulnerabilitiesFromStorage(tab).then(() => {
						resolve([])
					})
				}
			}
			reject(Error("Rejected buildVulnerabilitiesArray"))
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
			if (!TAB_CLOSED && !chrome.runtime.lastError) {
				try {
					chrome.browserAction.setBadgeBackgroundColor({
						color: '#00FFFFFF' // transparent
					});
					chrome.browserAction.setBadgeText({ tabId: tab.id, text: '' });
				} catch (e) { reject(e) }
					finally { TAB_CLOSED = false }
			}
			resolve()
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
	const url = new URL(tab.url);
	const conditions = [
		VALID_TEAMSERVER_HOSTNAMES.includes(url.hostname) && tab.url.endsWith(TEAMSERVER_ACCOUNT_PATH_SUFFIX),
		tab.url.endsWith(TEAMSERVER_PROFILE_PATH_SUFFIX) && tab.url.indexOf(TEAMSERVER_INDEX_PATH_SUFFIX) !== -1,
		!chrome.runtime.lastError
	]
	if (!TAB_CLOSED && conditions.some(c => !!c)) {
		try {
			chrome.browserAction.setBadgeBackgroundColor({
				color: CONTRAST_ICON_BADGE_CONFIGURE_EXTENSION_BACKGROUND
			});
			chrome.browserAction.setBadgeText({
				tabId: tab.id,
				text: CONTRAST_ICON_BADGE_CONFIGURE_EXTENSION_TEXT
			});
		} catch (e) { e }
			finally { TAB_CLOSED = false }
	} else if (!TAB_CLOSED && !chrome.runtime.lastError) {
		try {
			chrome.browserAction.getBadgeText({ tabId: tab.id }, (result) => {
				if (result === CONTRAST_ICON_BADGE_CONFIGURE_EXTENSION_TEXT) {
					chrome.browserAction.setBadgeText({ tabId: tab.id, text: '' });
				}
			})
		} catch (e) { e }
			finally { TAB_CLOSED = false }
	}
}
