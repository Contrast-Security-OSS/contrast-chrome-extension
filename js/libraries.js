const {
  GATHER_SCRIPTS,
} = Helpers;

export function getApplicationLibraries(tab) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tab.id, { action: GATHER_SCRIPTS }, (response) => {
      if (!response) {
        reject("No response to GATHER_SCRIPTS, response is " + response);
      }
      if (!Array.isArray(response)) {
        reject("Problem collecting scripts");
      } else {
        resolve(response);
      }
    });
  });
}

function _readLibraryVulnerabilities() {
  const retireJSURL = "https://raw.githubusercontent.com/RetireJS/retire.js/master/repository/jsrepository.json"
  const fetchOptions = {
    method: "GET",
  }
	return fetch(retireJSURL, fetchOptions)
	.then(response => {
    if (response.ok && response.status === 200) {
      return response.json()
    }
  })
	.catch(new Error("Error getting js lib vulnerabilities"))
}
