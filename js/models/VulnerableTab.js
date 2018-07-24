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

function VulnerableTab(path, application, traces = []) {
  this.path        = path.split("?")[0];
  this.id          = btoa(path + "|" + application);
  this.traceIDs    = traces;
  this.application = btoa(application);
}

VulnerableTab.prototype.decodeID = function() {
  return atob(this.id);
}

VulnerableTab.prototype.setTraceIDs = function(traceIDs) {
  this.traceIDs = deDupeArray(traceIDs);
}

VulnerableTab.prototype.storeTab = function() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({
      [this.application]: { [this.id]: this.traceIDs }
    }, () => {
      chrome.storage.local.get(this.application, (storedTab) => {
        if (storedTab[this.application]) {
          resolve(storedTab[this.application]);
        } else {
          reject(new VulnerableTabError("Error Storing Tab", this.id, this.path));
        }
      });
    });
  });
}

VulnerableTab.prototype.getApplicationVulnerableTabs = function() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([this.application], (appTabs) => {
      if (appTabs) {
        resolve(appTabs);
      } else {
        reject(new VulnerableTabError("No vulnerable tabs for " + this.application), this.id, this.path);
      }
    })
  });
}

VulnerableTab.prototype.getStoredTab = function() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(this.application, (storedTab) => {
      if (storedTab && storedTab[this.application]) {
        resolve(storedTab[this.application]);
      } else {
        resolve(null);
      }
    });
  });
}

VulnerableTab.prototype.removeStoredTab = function() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(this.id, () => {
      chrome.storage.local.get(this.id, (storedTab) => {
        console.log("REMOVE STORED TAB in removeStoredTab", storedTab);
        if (storedTab) {
          reject(new VulnerableTabError("Error Removing Tab", this.id, this.path));
        } else {
          resolve({ success: true, message: "Successfully Removed Vulnerable Tab" });
        }
      });
    });
  });
}

export default VulnerableTab;
