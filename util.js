function ContrastFetch(uri, onReadyStateChangeCallback) {

  chrome.storage.sync.get(["contrast_username", "contrast_service_key", "contrast_api_key"], function(items) {

    url = 'https://app.contrastsecurity.com/Contrast/api/' + uri

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