/*global
chrome, getOrganizationVulnerabilityesIds, document, TEAMSERVER_INDEX_PATH_SUFFIX, 
TEAMSERVER_API_PATH_SUFFIX,
TEAMSERVER_ACCOUNT_PATH_SUFFIX, MutationObserver, HTML_BODY,
CONTRAST_USERNAME,
  CONTRAST_SERVICE_KEY,
  CONTRAST_API_KEY,
  CONTRAST_ORG_UUID,
  TEAMSERVER_URL
*/

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {

        "use strict";
        if (request.url !== undefined) {

            var teamServerUrl = request.url.substring(0, request.url.indexOf(TEAMSERVER_INDEX_PATH_SUFFIX)) + TEAMSERVER_API_PATH_SUFFIX,
                orgUuid = request.url.substring(request.url.indexOf(TEAMSERVER_INDEX_PATH_SUFFIX) + TEAMSERVER_INDEX_PATH_SUFFIX.length,
                    request.url.indexOf(TEAMSERVER_ACCOUNT_PATH_SUFFIX)),
                profileEmail, apiKey, serviceKey;

            profileEmail = document.getElementsByClassName('profile-email').item(0).textContent;
            apiKey = document.getElementsByClassName('org-key').item(0).textContent;
            serviceKey = document.getElementsByClassName('org-key').item(1).textContent;

            chrome.storage.sync.set({
                'contrast_username': profileEmail.trim(),
                'contrast_service_key': serviceKey.trim(),
                'contrast_api_key': apiKey.trim(),
                'contrast_org_uuid': orgUuid.trim(),
                'teamserver_url': teamServerUrl
            }, function () {
                return;
            });
        }
    }
);
