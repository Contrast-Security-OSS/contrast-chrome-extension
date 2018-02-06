getOrganizationVulnerabilityesIds(document.URL, function () {
    return function (e) {
        var xhr = e.currentTarget;
        if (xhr.readyState == 4) {
            if (xhr.responseText != "") {
                const json = JSON.parse(xhr.responseText);
                var traces = json["traces"];

                chrome.runtime.sendMessage(json, function (response) {
                    //console.log(response);
                });

                //console.log(traces);
            }
        }
    }
});
