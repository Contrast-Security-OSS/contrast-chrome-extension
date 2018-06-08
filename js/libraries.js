/*global
	chrome,
	Helpers,
*/

const {
  GATHER_SCRIPTS,
} = Helpers;

export function getApplicationLibraries(tab) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tab.id, { action: GATHER_SCRIPTS }, (response) => {
      if (!response) {
        reject(new Error("No response to GATHER_SCRIPTS, response is " + response));
      }
      if (!Array.isArray(response)) {
        reject(new Error("Problem collecting scripts"));
      } else {
        resolve(response);
      }
    });
  });
}
