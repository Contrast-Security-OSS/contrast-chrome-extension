class Queue {
  constructor() {
    this.xhrRequests    = [];
    this.gatheredForms  = [];
    this.traceIDs       = [];
    this.xhrReady       = false;
    this.formsReady     = false;
    this.isCredentialed = false;
    this.tab            = null;
    this.application    = null;
  }

  addXHRequests = (requests, xhrSet) => {
    this.xhrReady    = xhrSet;
    this.xhrRequests = this.xhrRequests.concat(requests);
  }

  addForms = (forms) => {
    this.gatheredForms = this.gatheredForms.concat(forms);
  }

  setTab = (tab) => {
    if (!tab.url) throw new Error("Tab URL is falsey, received", tab.url);
    this.tab    = tab;
    this.tabUrl = tab.url;
  }

  setApplication = (application) => {
    this.application = application;
  }

  setCredentialed = (credentialed) => {
    this.isCredentialed = credentialed;
  }

  executeQueue = async() => {
    // NOTE: At start loading badge still true

    if (isBlacklisted(this.tab.url)) {
      removeLoadingBadge(tab);
      return;
    }

    const conditions = [
      this.xhrReady,
      this.formsReady,
      this.tab,
      this.isCredentialed,
      this.application,
    ];

    if (!conditions.every(Boolean)) {
      throw new Error("Queue not ready to execute!", conditions)
    }

  	await Vulnerability.removeVulnerabilitiesFromStorage(this.tab);

    const urls = this.xhrRequests.concat(this.gatheredForms, [this.tab.url]);

    Vulnerability.evaluateVulnerabilities(
      isCredentialed(creds), // if credentialed already
      this.tab, 					   // current tab
      urls, 					       // gathered xhr requests from page load
      CURRENT_APPLICATION, 	 // current app
      false 								 // isXHR
    );

    // NOTE: At end, badge is number of vulnerabilities
  }

  _storeTabVulnerabilities = () => {
    const tab = new VulnerableTab(this.tab.url);
  }


}

export default Queue;


/**
 * 1. Check that application for tab URL has been connected
 * 2. Check that user has configured and has credentials
 * 3. Wait for page to load
 * 3a. Capture XHR Requests
 * 4. Scrape for forms
 * 5. Execute on stored XHR, forms and tab url
 */
