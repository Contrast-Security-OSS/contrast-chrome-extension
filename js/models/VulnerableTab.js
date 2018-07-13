function VulnerableTabError(message, vulnTabId, vulnTabUrl) {
  throw new Error(message, vulnTabId, vulnTabUrl);
}

function VulnerableTab(url, applicationName) {
  this.url         = this.normalizeURL(url);
  this.id          = btoa(this.normalizeURL(url) + "|" + applicationName);
  this.traceIDs    = [];
  this.application = applicationName;
}

VulnerableTab.normalizeURL = function(url) {
  return url.split("?")[0];
}

VulnerableTab.prototype.decodeID = function() {
  return atob(this.id);
}

VulnerableTab.prototype.setTraceIDs = function(traceIDs) {
  this.traceIDs = traceIDs;
}

VulnerableTab.prototype.storeTab = function() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [this.applicationName]: { [this.id]: this }}, () => {
      chrome.storage.local.get(this.id, (storedTab) => {
        console.log("SET STORED TAB in storeTab", storedTab);
        if (storedTab) {
          resolve(storedTab);
        } else {
          reject(new VulnerableTabError("Error Storing Tab", this.id, this.url));
        }
      });
    });
  });
}

VulnerableTab.prototype.getApplicationVulnerableTabs = function() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([this.applicationName], (appTabs) => {
      if (appTabs) {
        resolve(appTabs);
      } else {
        reject(new VulnerableTabError("No vulnerable tabs for " + this.applicationName), this.id, this.url);
      }
    })
  });
}

VulnerableTab.prototype.getStoredTab = function() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(this.applicationName, (storedTab) => {
      console.log("GET STORED TAB in getStoredTab", storedTab);
      if (storedTab) {
        resolve(storedTab);
      } else {
        resolve("No Tab Found for given ID " + this.id);
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
          reject(new VulnerableTabError("Error Removing Tab", this.id, this.url));
        } else {
          resolve({ success: true, message: "Successfully Removed Vulnerable Tab" });
        }
      });
    });
  });
}
