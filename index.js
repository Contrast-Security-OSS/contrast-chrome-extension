document.addEventListener('DOMContentLoaded', function() {
  var signInButton = document.getElementById('sign-in');
  var extensionId = chrome.runtime.id;
  signInButton.addEventListener('click', function() {
    var settingsUrl = 'chrome-extension://' + String(extensionId) + '/settings.html';
    chrome.tabs.create({url: settingsUrl});
  }, false);
}, false);
