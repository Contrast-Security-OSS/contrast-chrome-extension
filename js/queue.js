import {
	TEAMSERVER_INDEX_PATH_SUFFIX,
	TEAMSERVER_ACCOUNT_PATH_SUFFIX,
	VALID_TEAMSERVER_HOSTNAMES,
	TEAMSERVER_PROFILE_PATH_SUFFIX,
	TEAMSERVER_API_PATH_SUFFIX,
	CONTRAST_RED,
	CONTRAST_YELLOW,
	CONTRAST_CONFIGURE_TEXT,
	LISTENING_ON_DOMAIN,
	TRACES_REQUEST,
	GATHER_FORMS_ACTION,
	LOADING_DONE,
	STORED_TRACES_KEY,
	getStoredCredentials,
	isCredentialed,
	isBlacklisted,
	updateTabBadge,
	removeLoadingBadge,
	loadingBadge,
  deDupeArray,
} from './util.js';

import Vulnerability from './models/Vulnerability.js';

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
    this.tabUrl         = "";
  }

  addXHRequests(requests, xhrReady) {
    this.xhrReady    = xhrReady;
    this.xhrRequests = this.xhrRequests.concat(requests);
  }

  addForms(forms, formsReady) {
    this.formsReady    = formsReady;
    this.gatheredForms = this.gatheredForms.concat(forms);
  }

  setTab(tab) {
    if (!tab.url) throw new Error("Tab URL is falsey, received", tab.url);
    this.tab    = tab;
    this.tabUrl = tab.url;
  }

  setApplication(application) {
    this.application = application;
  }

  setCredentialed(credentialed) {
    this.isCredentialed = credentialed;
  }

  _increaseExecutionCount() {
    this.executionCount += 1;
  }

  resetQueue() {
    this.xhrRequests    = [];
    this.gatheredForms  = [];
    this.traceIDs       = [];
    this.xhrReady       = false;
    this.formsReady     = false;
    this.isCredentialed = false;
    this.tab            = null;
    this.application    = null;
    this.executionCount = 0;
  }

  async executeQueue() {
    console.log("executing queue", this);
    // NOTE: At start loading badge still true

    // If tab URL is blacklisted, don't process anything
    const url = this.tabUrl || this.tab.url;
    if (isBlacklisted(url)) {
      removeLoadingBadge(tab);
      return;
    }

    const conditions = [
      this.xhrReady,
      this.formsReady,
      this.tab,
      this.tabUrl,
      this.isCredentialed,
      this.application,
    ];

    if (!conditions.every(Boolean)) {
      throw new Error("Queue not ready to execute!", conditions)
    }

    console.log("Removing vulnerabilities");
  	await Vulnerability.removeVulnerabilitiesFromStorage(this.tab);

    let traceUrls = this.xhrRequests.concat(this.gatheredForms, [this.tabUrl]);
        traceUrls = traceUrls.filter(url => !isBlacklisted(url));
        traceUrls = traceUrls.map(trace => (new URL(trace)).pathname);

    console.log("traceUrls", deDupeArray(traceUrls));

    Vulnerability.evaluateVulnerabilities(
      this.isCredentialed,    // if credentialed already
      this.tab, 					    // current tab
      deDupeArray(traceUrls), // gathered xhr requests from page load
      this.application, 	    // current app
    );

    this._increaseExecutionCount();
    // NOTE: At end, badge is number of vulnerabilities
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
 * 6. Continuously evaluate XHR
 */
