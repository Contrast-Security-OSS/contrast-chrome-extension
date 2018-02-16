/*global
chrome, getOrganizationVulnerabilityesIds, document, TEAMSERVER_INDEX_PATH_SUFFIX, 
TEAMSERVER_API_PATH_SUFFIX,
TEAMSERVER_ACCOUNT_PATH_SUFFIX
*/
getOrganizationVulnerabilityesIds(document.URL, function () {
    "use strict";
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
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.url !== undefined) {

            var teamServerUrl = request.url.substring(0, request.url.indexOf(TEAMSERVER_INDEX_PATH_SUFFIX)) + TEAMSERVER_API_PATH_SUFFIX,
                orgUuid = request.url.substring(request.url.indexOf(TEAMSERVER_INDEX_PATH_SUFFIX) + TEAMSERVER_INDEX_PATH_SUFFIX.length,
                    request.url.indexOf(TEAMSERVER_ACCOUNT_PATH_SUFFIX)),
                profileEmail = document.getElementsByClassName('profile-email');

            console.log(teamServerUrl);
            console.log(orgUuid);
            // console.log(profileEmail);
        }
    }
);
