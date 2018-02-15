/*jslint white: true */
/*global
chrome, getOrganizationVulnerabilityesIds, document
*/
getOrganizationVulnerabilityesIds(document.URL, function () {
    "use strict";
    return function (e) {
        var xhr = e.currentTarget;
        if (xhr.readyState === 4) {
            if (xhr.responseText !== "") {
                var json = JSON.parse(xhr.responseText);
                chrome.runtime.sendMessage(json, function () { });
            }
        }
    };
});
