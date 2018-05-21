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
	BLACKLISTED_DOMAINS,
	getStoredCredentials,
	isCredentialed,
	isBlacklisted,
	LISTENING_ON_DOMAIN,
	TRACES_REQUEST,
	GATHER_FORMS_ACTION,
	CONTRAST_GREEN,
	STORED_TRACES_KEY,
	deDupeArray,
	getVulnerabilityFilter,
	generateURLString,
	getHostFromUrl,
*/



"use strict"
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
	if (request.type === "xmlhttprequest" && !isBlacklisted(request)) {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			const tab = tabs[0]
			if (!tab) return

			if (tab.url.includes(TEAMSERVER_API_PATH_SUFFIX) || request.url.includes(TEAMSERVER_API_PATH_SUFFIX)) {
				return;
			}

			getStoredCredentials()
			.then(items => {
				const credentialed = isCredentialed(items)
				if (credentialed && !XHR_REQUESTS.includes(request.url)) {
					XHR_REQUESTS.push(request.url)
					evaluateVulnerabilities(credentialed, tab, [request.url])
				}
			})
			.catch(error => updateTabBadge(tabs[0], "X", CONTRAST_RED))
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
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		updateTabBadge(tabs[0], "↻", CONTRAST_GREEN)
		handleRuntimeOnMessage(request, sender, sendResponse)
	})

	return true
})

chrome.tabs.onActivated.addListener(activeInfo => {
	handleTabActivated(activeInfo)
})

function handleTabActivated(activeInfo) {
	// if (VULNERABLE_TABS.includes(activeInfo.tabId)) {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

			if (!tabs || tabs.length === 0) return

			const tab = tabs[0]

			updateTabBadge(tab, "↻", CONTRAST_GREEN)
			updateVulnerabilities(tab)
		})
	// }
}

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => TAB_CLOSED = true)

// set color of badge for until update is complete
// https://stackoverflow.com/questions/44090434/chrome-extension-badge-text-renders-as-%C3%A2%C5%93
//#x21bb; is unicode clockwise circular arrow try {

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
	updateTabBadge(tab, "↻", CONTRAST_GREEN)

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
		getStoredCredentials().then(items => {
			let evaluated = false
			const credentialed = isCredentialed(items)

			chrome.storage.local.get("APPS", (result) => {
				if (chrome.runtime.lastError || !result) {
					console.log("chrome runtime error")
					throw new Error("Error getting apps from storage")
				}

				const application = getApplicationFromStorage(result, tab)

				if (!application) return

				if (credentialed && !evaluated) {
					chrome.tabs.sendMessage(tab.id, { action: GATHER_FORMS_ACTION }, (response) => {

						evaluated = true

						if (!!response) {
							const { formActions } = response

							if (!!formActions && formActions.length > 0) {

								const traceUrls = [tab.url].concat(formActions)
								evaluateVulnerabilities(credentialed, tab, traceUrls, application)
							}
						} else {
							evaluateVulnerabilities(credentialed, tab, [tab.url], application)
						}
					})
				} else {
					getCredentials(tab)
				}
			})
		}).catch(error => updateTabBadge(tab, "X", CONTRAST_RED))
	}).catch(error => updateTabBadge(tab, "X", CONTRAST_RED))
	return;
}

function getApplicationFromStorage(result, tab) {
	const url  = new URL(tab.url)
	const host = getHostFromUrl(url)

	let application
	if (!!result.APPS) {
		application = result.APPS.filter(app => app[host])[0]
	}

	if (!application && !TAB_CLOSED && tab.index >= 0) {
		updateTabBadge(tab, CONTRAST_ICON_BADGE_CONFIGURE_EXTENSION_TEXT, CONTRAST_ICON_BADGE_CONFIGURE_EXTENSION_BACKGROUND)
		return null
	}

	if (!application) return null

	return application
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
	const url  = new URL(tab.url)
	const host = getHostFromUrl(url)

	if (hasCredentials && !!traceUrls && traceUrls.length > 0) {
		// generate an array of only pathnames
		const urlQueryString = generateURLString(traceUrls)

		if (!application) return

		getOrganizationVulnerabilityIds(urlQueryString, application[host])
		.then(json => {
			if (!json) {
				throw new Error("Error getting json from application trace ids")
			}
			setToStorage(json.traces, tab)
		})
		.catch(error => updateTabBadge(tab, "X", CONTRAST_RED))
	} else if (hasCredentials && !!traceUrls && traceUrls.length === 0) {
		updateTabBadge(tab, traceUrls.length.toString(), CONTRAST_RED)
	} else {
		getCredentials(tab)
	}
}

/**
 * updateTabBadge - updates the extension badge on the toolbar
 *
 * @param  {Object} tab    Gives the state of the current tab
 * @param  {String} text   What the badge should display
 * @return {void}
 */
function updateTabBadge(tab, text, color) {
	if (chrome.runtime.lastError) {
		return
	}
	try {
		if (!TAB_CLOSED && tab.index >= 0) { // tab is visible
			chrome.browserAction.setBadgeBackgroundColor({ color })
			chrome.browserAction.setBadgeText({ tabId: tab.id, text })
		}
	} catch (e) { return null }
		finally { TAB_CLOSED = false }
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
		const traces = foundTraces.filter(t => !!t)

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
					updateTabBadge(
						tab,
						JSON.parse(result[STORED_TRACES_KEY]).length.toString(),
						CONTRAST_RED
					)
				})
			})
		})
		.catch(error => updateTabBadge(tab, "X", CONTRAST_RED))
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
	return new Promise((resolve, reject) => {
		chrome.storage.local.remove(STORED_TRACES_KEY, () => {
			if (chrome.runtime.lastError) {
				console.log("chrome.runtime.lastError not null")
				reject(null)
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
	if (chrome.runtime.lastError) {
		console.log("chrome.runtime.lastError not null")
		return
	}

	const url = new URL(tab.url)
	const conditions = [
		VALID_TEAMSERVER_HOSTNAMES.includes(url.hostname) && tab.url.endsWith(TEAMSERVER_ACCOUNT_PATH_SUFFIX),
		tab.url.endsWith(TEAMSERVER_PROFILE_PATH_SUFFIX) && tab.url.indexOf(TEAMSERVER_INDEX_PATH_SUFFIX) !== -1,
		!chrome.runtime.lastError
	]
	if (!TAB_CLOSED && conditions.some(c => !!c)) {
		updateTabBadge(tab, CONTRAST_ICON_BADGE_CONFIGURE_EXTENSION_TEXT, CONTRAST_ICON_BADGE_CONFIGURE_EXTENSION_BACKGROUND)
	}
	// else if (!TAB_CLOSED && !chrome.runtime.lastError) {
	// 	chrome.browserAction.getBadgeText({ tabId: tab.id }, (result) => {
	// 		console.log("get badge text result", result);
	// 		if (result === CONTRAST_ICON_BADGE_CONFIGURE_EXTENSION_TEXT) {
	// 			updateTabBadge(tab, '')
	// 		}
	// 	})
	// }
}
