document.addEventListener('DOMContentLoaded', function() {
  // Inputs
  var username = document.getElementById('contrast_username');
  var serviceKey = document.getElementById('contrast_service_key');
  var apiKey = document.getElementById('contrast_api_key');
  var orgUuid = document.getElementById('contrast_org');
  var teamserverUrl = document.getElementById('teamserver_url');

  var submitButton = document.getElementById('contrast-submit');

  // Run when form is submitted
  submitButton.addEventListener('click', function() {
    // retrieve values form inputs
    usernameValue = username.value;
    serviceKeyValue = serviceKey.value;
    apiKeyValue = apiKey.value;
    orgUuidValue = orgUuid.value;
    teamserverUrlValue = teamserverUrl.value;

    //save values to local storage
    chrome.storage.sync.set({
      'contrast_username': usernameValue,
      'contrast_service_key': serviceKeyValue,
      'contrast_api_key': apiKeyValue,
      'contrast_org': orgUuidValue,
      'teamserver_url': teamserverUrlValue
    }, function() {
      console.log('Contrast values saved');
      username.value = "";
      serviceKey.value = "";
      apiKey.value = "";
      orgUuid.value = "";
      teamserverUrl.value = "";

    });
  }, false);

}, false);
