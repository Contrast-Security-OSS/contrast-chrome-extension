import {
  CONTRAST_CONFIGURE_TEXT,
  CONTRAST_RED,
  CONTRAST_YELLOW,
  CONTRAST_GREEN,
  STORED_TRACES_KEY,
  GATHER_FORMS_ACTION,
  HIGHLIGHT_VULNERABLE_FORMS,
  deDupeArray,
  generateTraceURLString,
  getOrganizationVulnerabilityIds,
  hasIDorUUID,
  isBlacklisted,
} from '../util.js';

function VulnerableTabError(message, vulnTabId, vulnTabUrl) {
  throw new Error(message, vulnTabId, vulnTabUrl);
}

function VulnerableTab(path, applicationName, traces = []) {
  this.traceIDs        = traces;
  this.path            = path.split("?")[0];
  this.vulnTabId       = btoa(this.path + "|" + applicationName);
  this.applicationName = btoa(applicationName);
}

VulnerableTab.prototype.decodeID = function() {
  return atob(this.vulnTabId);
}

VulnerableTab.prototype.setTraceIDs = function(traceIDs) {
  this.traceIDs = deDupeArray(traceIDs);
}

VulnerableTab.prototype.storeTab = function() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({
      [this.applicationName]: { [this.vulnTabId]: this.traceIDs }
    }, () => {
      chrome.storage.local.get(this.applicationName, (storedTab) => {
        if (storedTab[this.applicationName]) {
          resolve(storedTab[this.applicationName]);
        } else {
          reject(new VulnerableTabError("Error Storing Tab", this.vulnTabId, this.path));
        }
      });
    });
  });
}


VulnerableTab.prototype.getStoredTab = function() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(this.applicationName, (storedTabs) => {
      if (storedTabs && storedTabs[this.applicationName]) {
        resolve(storedTabs[this.applicationName]);
      } else {
        resolve(null);
      }
    });
  });
}

export default VulnerableTab;
