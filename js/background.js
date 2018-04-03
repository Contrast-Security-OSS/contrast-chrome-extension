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

// called before any sync or async request is sent
// captures xhr and resource requests
chrome.webRequest.onBeforeRequest.addListener(function(request) {
	// only permit xhr requests
	// don't monitor xhr requests made by extension
	if (request.type === "xmlhttprequest" && !request.url.includes("Contrast")) {
	chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
		var tab = tabs[0]
		// console.log("request object", request);
		// if (!!tab && tab.status === "complete" && tab.url.startsWith("http")) {
			chrome.storage.sync.get([CONTRAST_USERNAME, CONTRAST_SERVICE_KEY, CONTRAST_API_KEY, TEAMSERVER_URL], function (items) {

				if (tab.url.includes("Contrast/api")) {
					return;
				}
				evaluateVulnerabilities(checkCredentials(items), tab, request.url)
			})
		})
	}
}, { urls: [LISTENING_ON_DOMAIN] })

// called when tab is updated including any changes to url
// build array of vulnerabilities
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	console.log("tab updated", tab);
	// send message to content scripts that tab has updated
	// get forms
	removeVulnerabilitiesFromStorage().then(function() {
		if (changeInfo.status === "complete" && tab.url.startsWith("http")) {

			chrome.storage.sync.get([CONTRAST_USERNAME, CONTRAST_SERVICE_KEY, CONTRAST_API_KEY, TEAMSERVER_URL], function (items) {

				// gets form actions
				chrome.tabs.sendMessage(tabId, { action: GATHER_FORMS_ACTION, tabUrl: tab.url }, function(response) {

					if (!!response && !!response.formActions) {
						var formActions = response.formActions
						if (formActions.length > 0) {
								for (var i = 0; i < formActions.length; i++) {
									evaluateVulnerabilities(checkCredentials(items), tab, formActions[i])
								}
						}
					}
				});

				// uses the tab url to evaluate
				// check if any values are undefined
				// console.log("items", items);
				evaluateVulnerabilities(checkCredentials(items), tab, tab.url)
			});
		}
	})
});

function checkCredentials(items) {
	"use strict";

	var noUsername = items.contrast_username === undefined || items.contrast_username === '',
		noServiceKey = items.contrast_service_key === undefined || items.contrast_service_key === '',
		noApiKey = items.contrast_api_key === undefined || items.contrast_api_key === '',
		noTeamserverUrl = items.teamserver_url === undefined || items.teamserver_url === ''

		return noUsername || noServiceKey || noApiKey || noTeamserverUrl
}

function evaluateVulnerabilities(needsCredentials, tab, requestURL) {
	"use strict";

	if (requestURL.includes("Contrast/api/ng")) {
		return;
	}
	else if (!needsCredentials) {
		var url = new URL(requestURL)
		// console.log("request url", url);
		getOrganizationVulnerabilityesIds(url.pathname, function () {
			return function (e) {
				var xhr = e.currentTarget, json;
				if (xhr.readyState === 4) {
					if (xhr.responseText !== "") {
						json = JSON.parse(xhr.responseText);
						if (json.traces && json.traces.length > 0) {
							// console.log("json returned in evaluateVulnerabilities", json);
							if (chrome.runtime.lastError) {
								return;
							}
							// if (tab.index >= 0) { // tab is visible
							// 	chrome.browserAction.setBadgeBackgroundColor({ color: CONTRAST_ICON_BADGE_BACKGROUND });
							// 	chrome.browserAction.setBadgeText({ tabId: tab.id, text: json.traces.length.toString() });
							// }
							setToStorage(json.traces, tab, true)
						}
					}
				}
			};
		});
	} else {
		getCredentials(tab)
	}
}

function getCredentials(tab) {
	var url = new URL(tab.url);
	if (VALID_TEAMSERVER_HOSTNAMES.includes(url.hostname)
		&& (tab.url.endsWith(TEAMSERVER_ACCOUNT_PATH_SUFFIX) || tab.url.endsWith(TEAMSERVER_PROFILE_PATH_SUFFIX))
		&& tab.url.indexOf(TEAMSERVER_INDEX_PATH_SUFFIX) !== -1) {

		chrome.browserAction.setBadgeBackgroundColor({ color: CONTRAST_ICON_BADGE_CONFIGURE_EXTENSION_BACKGROUND });
		chrome.browserAction.setBadgeText({ tabId: tab.id, text: CONTRAST_ICON_BADGE_CONFIGURE_EXTENSION_TEXT });

	} else {
		chrome.browserAction.getBadgeText({ tabId: tab.id }, function (result) {
			if (result === CONTRAST_ICON_BADGE_CONFIGURE_EXTENSION_TEXT) {
				chrome.browserAction.setBadgeText({ tabId: tab.id, text: '' });
			}
		});
	}
}

function updateTabBadge(tab, number) {
	chrome.browserAction.setBadgeBackgroundColor({
		color: CONTRAST_ICON_BADGE_BACKGROUND
	});
	chrome.browserAction.setBadgeText({
		tabId: tab.id,
		text: number.toString(),
	});
}

function setToStorage(vulnerabilities, tab, isTraces) {
	var key = isTraces ? "traces" : "vulnerabilities"
	// first check if there are already vulnerabilities in storage
	var promise = new Promise(function(resolve, reject) {
		chrome.storage.sync.get(key, function(result) {
			var results;

			// results have not been set yet so just pass on vulnerabilities
			if (!result[key] || (!!result[key] && JSON.parse(result[key]).length === 0)) {
				resolve(vulnerabilities)
			} else {
				try {
					// add existing vulnerabilities to passed in array
					results = JSON.parse(result[key])
					results = results.concat(vulnerabilities)
					resolve(results)
				} catch (e) {
					// if this errors then remove all the vulnerabilities from storage and start over
					removeVulnerabilitiesFromStorage().then(function() {
						resolve([])
					})
				}
			}
		})
	})

	promise.then(function(vs) {
		var obj = {}

		// filter array for duplicates
		vs = vs.filter(function(item, position, self) {
			return self.indexOf(item) === position
		})
		updateTabBadge(tab, vs.length)
		obj[key] = JSON.stringify(vs)

		// console.log("vs in promise and obj", vs, obj);
		chrome.storage.sync.set(obj, function(result) {
			if (chrome.runtime.lastError) {
				// console.log("error setting vulnerabilities", chrome.runtime.lastError);
			} else {
				// console.log("vulnerabilities set", vs);
			}
		})
	})
	.catch(function(error) {
		// console.log("caught promise in setToStorage", error);
	})
}

function removeVulnerabilitiesFromStorage() {
	// console.log("removing vulnerabilities");
	return new Promise(function(resolve, reject) {
		chrome.storage.sync.remove(["vulnerabilities", "traces"], function() {
			try {
				chrome.browserAction.setBadgeBackgroundColor({
					color: '#00FFFFFF' // transparent
				});
				chrome.browserAction.setBadgeText({ text: '' });
			} catch (e) {
				console.log(chrome.runtime.lastError);
			}
			// console.log("vulnerabilities removed");
			resolve()
		})
	})
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	// console.log("request", request);
	if (request === "getXHRVulnerabilities") {
		chrome.storage.sync.get("vulnerabilities", function(result) {
			// console.log(result);
			if (!!result && !!result.vulnerabilities) {
				// console.log("sending response");
				sendResponse({ vulnerabilities: JSON.parse(result.vulnerabilities) })
			}
		})
	} else if (request === "getStoredTraces") {
		chrome.storage.sync.get("traces", function(result) {
			// console.log(result);
			if (!!result && !!result.traces) {
				// console.log("sending response");
				sendResponse({ traces: JSON.parse(result.traces) })
			}
		})
	}

	// https://developer.chrome.com/extensions/runtime#event-onMessage
	// This function becomes invalid when the event listener returns, unless you return true from the event listener to indicate you wish to send a response asynchronously (this will keep the message channel open to the other end until sendResponse is called).
	return true
})





// https://app.contrastsecurity.com/Contrast/api/ng/04bfd6c5-b24e-4610-b8b9-bcbde09f8e15/orgtraces/ids?urls=%2FWebGoat%2Fsqlinjection
