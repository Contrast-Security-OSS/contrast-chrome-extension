/*global
chrome
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
