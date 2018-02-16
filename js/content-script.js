/*global
chrome, getOrganizationVulnerabilityesIds, document
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
