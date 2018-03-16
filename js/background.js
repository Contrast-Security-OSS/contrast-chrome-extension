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

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	"use strict";

	if (changeInfo.status === "complete" && tab.url.startsWith("http")) {
		chrome.storage.sync.get([CONTRAST_USERNAME, CONTRAST_SERVICE_KEY, CONTRAST_API_KEY, TEAMSERVER_URL], function (items) {
			// check if any values are undefined
			var noUsername = items.contrast_username === undefined || items.contrast_username === '',
				noServiceKey = items.contrast_service_key === undefined || items.contrast_service_key === '',
				noApiKey = items.contrast_api_key === undefined || items.contrast_api_key === '',
				noTeamserverUrl = items.teamserver_url === undefined || items.teamserver_url === '',
				needsCredentials = noUsername || noServiceKey || noApiKey || noTeamserverUrl,
				url;

			if (!needsCredentials) {
				getOrganizationVulnerabilityesIds(tab.url, function () {
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
				url = new URL(tab.url);
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
		});
	}
});
