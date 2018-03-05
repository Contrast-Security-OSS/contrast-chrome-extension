/*global
URL, chrome, TEAMSERVER_INDEX_PATH_SUFFIX, TEAMSERVER_ACCOUNT_PATH_SUFFIX,
CONTRAST_USERNAME,
  CONTRAST_SERVICE_KEY,
  CONTRAST_API_KEY,
  CONTRAST_ORG_UUID,
  TEAMSERVER_URL,
  VALID_TEAMSERVER_HOSTNAMES,
  CONFIGURATION_NOTIFICATION_TITLE,
  CONFIGURATION_NOTIFICATION_MESSAGE,
  CONFIGURATION_NOTIFICATION_BUTTON_TITLE,
  CONFIGURATION_NOTIFICATION_ID
*/
chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		"use strict";
		if (request.traces && request.traces.length > 0) {

			chrome.tabs.get(sender.tab.id, function (tab) {
				if (chrome.runtime.lastError) {
					return;
				}
				if (tab.index >= 0) { // tab is visible
					chrome.browserAction.setBadgeBackgroundColor({ color: "red" });
					chrome.browserAction.setBadgeText({ tabId: tab.id, text: request.traces.length.toString() });
				} else {
					var tabId = sender.tab.id, text = request.traces.length.toString();
					chrome.webNavigation.onCommitted.addListener(function update(details) {
						if (details.tabId === tabId) {
							chrome.browserAction.setBadgeBackgroundColor({ color: "red" });
							chrome.browserAction.setBadgeText({ tabId: tabId, text: text });
							chrome.webNavigation.onCommitted.removeListener(update);
						}
					});
				}
			});
			// sendResponse({message: "message"});
		}
	}
);

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	"use strict";

	var url = new URL(tab.url);
	if (changeInfo.status === "complete" && tab.url.startsWith("http") && VALID_TEAMSERVER_HOSTNAMES.includes(url.hostname)
		&& tab.url.endsWith(TEAMSERVER_ACCOUNT_PATH_SUFFIX) && tab.url.indexOf(TEAMSERVER_INDEX_PATH_SUFFIX) !== -1) {

		chrome.storage.sync.get([CONTRAST_USERNAME, CONTRAST_SERVICE_KEY, CONTRAST_API_KEY, TEAMSERVER_URL], function (items) {
			// check if any values are undefined
			var noUsername = items.contrast_username === undefined || items.contrast_username === '',
				noServiceKey = items.contrast_service_key === undefined || items.contrast_service_key === '',
				noApiKey = items.contrast_api_key === undefined || items.contrast_api_key === '',
				noTeamserverUrl = items.teamserver_url === undefined || items.teamserver_url === '',
				needsCredentials = noUsername || noServiceKey || noApiKey || noTeamserverUrl, options;


			if (needsCredentials) {


				options = {
					type: 'basic',
					priority: 2,
					message: CONFIGURATION_NOTIFICATION_MESSAGE,
					title: CONFIGURATION_NOTIFICATION_TITLE,
					iconUrl: 'icon.png',
					buttons: [
						{ title: CONFIGURATION_NOTIFICATION_BUTTON_TITLE }
					],
					requireInteraction: true

				};

				chrome.notifications.create(CONFIGURATION_NOTIFICATION_ID, options);
				chrome.notifications.onButtonClicked.addListener(function (notificationId, buttonIndex) {
					if (notificationId === CONFIGURATION_NOTIFICATION_ID && buttonIndex === 0) {
						chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
							chrome.tabs.sendMessage(tabs[0].id, { url: tab.url }, function () {
								return;
							});
						});
						chrome.notifications.clear(notificationId);
					}
				});
			}
		});
	}

});
