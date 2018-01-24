function ContrastFetch(uri, onReadyStateChangeCallback) {

  chrome.storage.sync.get(["contrast_username", "contrast_service_key", "contrast_api_key"], function(items) {

    url = 'https://app.contrastsecurity.com/Contrast/api/' + uri

    console.log(url)
    var authHeader = btoa(items["contrast_username"] + ":" + ["contrast_service_key"])
    console.log(authHeader)
    console.log(items["contrast_api_key"])
    
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = onReadyStateChangeCallback(xhr)
    xhr.open('GET', url, true);
    xhr.setRequestHeader("Authorization", authHeader);
    xhr.setRequestHeader("API-Key", items["contrast_api_key"]);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.send();
  })
}