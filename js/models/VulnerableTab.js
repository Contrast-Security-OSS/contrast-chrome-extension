/*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
import {
  deDupeArray,
  murmur,
} from '../util.js';

function VulnerableTabError(message, vulnTabId, vulnTabUrl) {
  throw new Error(message, vulnTabId, vulnTabUrl);
}

function VulnerableTab(path, applicationName, traces = []) {
  this.traceIDs    = traces;
  this.path        = path.split("?")[0];
  this.vulnTabId   = murmur(this.path + "|" + applicationName);
  this.appNameHash = murmur(applicationName);
}

VulnerableTab.prototype.setTraceIDs = function(traceIDs) {
  this.traceIDs = deDupeArray(this.traceIDs.concat(traceIDs));
}

VulnerableTab.prototype.storeTab = function() {
  return new Promise(async(resolve, reject) => {

    let appTabs = await this.getApplicationTabs();
        appTabs[this.appNameHash][this.vulnTabId] = this.traceIDs;

    chrome.storage.local.set(appTabs, () => {
      chrome.storage.local.get(this.appNameHash, (storedTab) => {
        if (storedTab && storedTab[this.appNameHash]) {
          resolve(storedTab[this.appNameHash]);
        } else {
          reject(new VulnerableTabError("Error Storing Tab", this.vulnTabId, this.path));
        }
      });
    });
  });
}

VulnerableTab.prototype.getApplicationTabs = function() {
  return new Promise((resolve) => {
    chrome.storage.local.get(this.appNameHash, (appTabs) => {
      if (!appTabs[this.appNameHash]) {
        appTabs[this.appNameHash] = {};
      }
      resolve(appTabs)
    });
  });
}

VulnerableTab.prototype.getStoredTab = function() {
  return new Promise((resolve) => {
    chrome.storage.local.get(this.appNameHash, (storedTabs) => {
      if (storedTabs && storedTabs[this.appNameHash]) {
        resolve(storedTabs[this.appNameHash]);
      } else {
        resolve(null);
      }
    });
  });
}

VulnerableTab.buildTabPath = function(tabUrl) {
  const url = (new URL(tabUrl));
  let path = url.pathname;
  if (url.hash) {
    path += url.hash;
  }
  return path;
}

export default VulnerableTab;
