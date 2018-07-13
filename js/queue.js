class Queue {
  constructor() {
    // loading badge is true
    // resetVulnerabilities
    this.xhrRequests   = [];
    this.gatheredForms = [];
    this.tabUrl        = "";
    this.tab           = null;
  }

  addXHRequest = (request) => {
    this.xhrRequests = this.xhrRequests.concat(request);
  }

  addForm = (form) => {
    this.gatheredForms = this.gatheredForms.concat(form);
  }

  setTabUrl = (url) => {
    this.tabUrl = url;
  }

  resetQueue = () => {
    // resetVulnerabilities
    this = new this.constructor();
  }

  executeQueue = () => {
    // loading badge still true
    // 
  }




}
