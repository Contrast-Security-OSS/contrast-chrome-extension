function ContrastFetch(uri, onReadyStateChangeCallback) {
  // authHeader = btoa(chrome.storage.sync.get("contrast_username") + ':' + chrome.storage.sync.get("contrast_service_key"))
  // apiKey = chrome.storage.sync.get("contrast_api_key")
  url = 'https://app.contrastsecurity.com/Contrast/api/' + uri

  console.log(url)
  
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = onReadyStateChangeCallback(xhr)
  xhr.open('GET', url, true);
  xhr.setRequestHeader("Authorization", "FOO");
  xhr.setRequestHeader("API-Key", "FOO");
  xhr.setRequestHeader("Accept", "application/json");
  xhr.send();
}