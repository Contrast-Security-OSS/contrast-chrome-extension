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

// called before any sync or async request is sent
// captures xhr and resource requests
chrome.webRequest.onBeforeRequest.addListener(function(request) {
	"use strict";
	// only permit xhr requests
	// don't monitor xhr requests made by extension
	if (request.type === "xmlhttprequest" && !request.url.includes("Contrast")) {
	chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
		var tab = tabs[0]
		console.log("request object", request);
		// if (!!tab && tab.status === "complete" && tab.url.startsWith("http")) {
			chrome.storage.sync.get([CONTRAST_USERNAME, CONTRAST_SERVICE_KEY, CONTRAST_API_KEY, TEAMSERVER_URL], function (items) {

				// only grab requests made from the domain we're monitoring
				var url = new URL(tab.url);
				// console.log("xhr request object", request);
				console.log("tab url includes contrast", tab.url.includes("Contrast"));
				// console.log("url", url);
				// !request.url.includes(url.hostname) ||
				if (tab.url.includes("Contrast")) {
					return;
				}
				evaluateXHRVulnerabilities(checkCredentials(items), tab, request.url)
			})
		})
	}
}, { urls: [LISTENING_ON_DOMAIN] })

// called when tab is updated including any changes to url
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	"use strict";

	// send message to content scripts that tab has updated
	// get forms
	chrome.tabs.sendMessage(tabId, { action: GATHER_FORMS_ACTION }, function(response) {
		if (!!response) {
			var formActions = response.formActions
			if (formActions.length > 0) {
				chrome.storage.sync.get([CONTRAST_USERNAME, CONTRAST_SERVICE_KEY, CONTRAST_API_KEY, TEAMSERVER_URL], function (items) {
					console.log(formActions);
					evaluateXHRVulnerabilities(checkCredentials(items), tab, formActions)
				})
			}
		}
	});

	if (changeInfo.status === "complete" && tab.url.startsWith("http")) {
		chrome.storage.sync.get([CONTRAST_USERNAME, CONTRAST_SERVICE_KEY, CONTRAST_API_KEY, TEAMSERVER_URL], function (items) {
			// check if any values are undefined
			evaluateVulnerabilities(checkCredentials(items), tab, tab.url)
		});
	}
});

function checkCredentials(items) {
	"use strict";

	var noUsername = items.contrast_username === undefined || items.contrast_username === '',
		noServiceKey = items.contrast_service_key === undefined || items.contrast_service_key === '',
		noApiKey = items.contrast_api_key === undefined || items.contrast_api_key === '',
		noTeamserverUrl = items.teamserver_url === undefined || items.teamserver_url === ''

		return noUsername || noServiceKey || noApiKey || noTeamserverUrl
}

function evaluateXHRVulnerabilities(needsCredentials, tab, requestURL) {
	if (!needsCredentials) {
		var url = new URL(requestURL);
		getAllOrganizationVulnerabilties(url.href, function() {
			return function (e) {
				var xhr = e.currentTarget, json;
				if (xhr.readyState === 4) {
					if (xhr.responseText !== "") {
						json = JSON.parse(xhr.responseText);
						console.log("json response from TS", json);
						if (!!json.filters && json.filters.length > 0) {
							if (chrome.runtime.lastError) {
								return;
							}
							// received a list of filter objects containing a url, a base64 encoded url path (the keycode) and a count of vulnerabilities

							console.log("url pathname", url.pathname);
							console.log("url pathname btoa", btoa(url.pathname));
							var vuln = json.filters.filter(f => {
								console.log("filter keycode", f.keycode);
								console.log("filter label", f.label);
								return f.keycode === btoa(url.pathname) || btoa(f.label) === btoa(url.pathname)
							})

							console.log("vulnerability found", vuln[0]);
							if (vuln.length > 0) {
								chrome.browserAction.setBadgeBackgroundColor({ color: CONTRAST_ICON_BADGE_BACKGROUND });
								chrome.browserAction.setBadgeText({ tabId: tab.id, text: vuln[0].count.toString() });
							}
						}
					}
				}
			}
		})
	} else {
		getCredentials(tab)
	}
}


function evaluateVulnerabilities(needsCredentials, tab, uri) {
	"use strict";

	if (!needsCredentials) {
		getOrganizationVulnerabilityesIds(uri, function () {
			return function (e) {
				var xhr = e.currentTarget, json;
				if (xhr.readyState === 4) {
					if (xhr.responseText !== "") {
						json = JSON.parse(xhr.responseText);
						if (json.traces && json.traces.length > 0) {
							if (chrome.runtime.lastError) {
								return;
							}
							if (tab.index >= 0) { // tab is visible
								chrome.browserAction.setBadgeBackgroundColor({ color: CONTRAST_ICON_BADGE_BACKGROUND });
								chrome.browserAction.setBadgeText({ tabId: tab.id, text: json.traces.length.toString() });
							}
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
	console.log("url.hostname includes valid ts hostname", VALID_TEAMSERVER_HOSTNAMES.includes(url.hostname));
	console.log(url.hostname);
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
