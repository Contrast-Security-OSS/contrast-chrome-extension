/*global
chrome, getOrganizationVulnerabilityesIds, document, TEAMSERVER_INDEX_PATH_SUFFIX, 
TEAMSERVER_API_PATH_SUFFIX,
TEAMSERVER_ACCOUNT_PATH_SUFFIX, MutationObserver, HTML_BODY
*/

chrome.storage.sync.get(["contrast_username", "contrast_service_key", "contrast_api_key", "teamserver_url"], function (items) {
    // check if any values are undefined
    "use strict";
    var noUsername = items.contrast_username === undefined || items.contrast_username === '',
        noServiceKey = items.contrast_service_key === undefined || items.contrast_service_key === '',
        noApiKey = items.contrast_api_key === undefined || items.contrast_api_key === '',
        noTeamserverUrl = items.teamserver_url === undefined || items.teamserver_url === '',
        needsCredentials = noUsername || noServiceKey || noApiKey || noTeamserverUrl;

    if (!needsCredentials) {
        getOrganizationVulnerabilityesIds(document.URL, function () {
            return function (e) {
                var xhr = e.currentTarget, json;
                if (xhr.readyState === 4) {
                    if (xhr.responseText !== "") {
                        json = JSON.parse(xhr.responseText);
                        chrome.runtime.sendMessage(json, function () {
                            return;
                        });
                    }
                }
            };
        });
    }
});

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {

        "use strict";
        if (request.url !== undefined) {

            var teamServerUrl = request.url.substring(0, request.url.indexOf(TEAMSERVER_INDEX_PATH_SUFFIX)) + TEAMSERVER_API_PATH_SUFFIX,
                orgUuid = request.url.substring(request.url.indexOf(TEAMSERVER_INDEX_PATH_SUFFIX) + TEAMSERVER_INDEX_PATH_SUFFIX.length,
                    request.url.indexOf(TEAMSERVER_ACCOUNT_PATH_SUFFIX)),
                profileEmail, apiKey, serviceKey,
                body = document.getElementsByTagName(HTML_BODY).item(0), observer;

            observer = new MutationObserver(function () {
                if (document.getElementsByClassName('profile-email').item(0) !== null
                    && document.getElementsByClassName('profile-email').item(0).textContent.length > 0
                    && document.getElementsByClassName('org-key').item(0) !== null
                    && document.getElementsByClassName('org-key').item(0).textContent.length > 0
                    && document.getElementsByClassName('org-key').item(1) !== null
                    && document.getElementsByClassName('org-key').item(1).textContent.length > 0) {

                    observer.disconnect();

                    profileEmail = document.getElementsByClassName('profile-email').item(0).textContent;
                    apiKey = document.getElementsByClassName('org-key').item(0).textContent;
                    serviceKey = document.getElementsByClassName('org-key').item(1).textContent;

                    chrome.storage.sync.set({
                        'contrast_username': profileEmail,
                        'contrast_service_key': serviceKey,
                        'contrast_api_key': apiKey,
                        'contrast_org_uuid': orgUuid,
                        'teamserver_url': teamServerUrl
                    }, function () {
                        return;
                    });
                }

            });
            observer.observe(body, { childList: true, characterData: true, subtree: true });
        }
    }
);
