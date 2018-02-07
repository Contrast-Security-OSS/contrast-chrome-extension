var onActivatedListener = function (activeInfo) {

};
chrome.tabs.onActivated.addListener(onActivatedListener);

chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		if (request.traces.length > 0) {
			chrome.browserAction.setBadgeText({ text: request.traces.length.toString() });
		} else {
			chrome.browserAction.setBadgeText({ text: "" });
		}
		// sendResponse({message: "message"});
	}
);
