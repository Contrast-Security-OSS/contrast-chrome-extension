function getActivities(onReadyStateChangeCallback) {

  chrome.storage.sync.get(["contrast_username", 
                           "contrast_service_key", 
                           "contrast_api_key",
                           "contrast_org_uuid", 
                           "teamserver_url"], function(items) {

    url = items["teamserver_url"] + '/api/ng/' + items["contrast_org_uuid"] + '/events'

    var authHeader = btoa(items["contrast_username"] + ":" + ["contrast_service_key"])
    
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = onReadyStateChangeCallback(xhr)
    xhr.open('GET', url, true);
    xhr.setRequestHeader("Authorization", authHeader);
    xhr.setRequestHeader("API-Key", items["contrast_api_key"]);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.send();
  })
}