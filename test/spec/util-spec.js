const chrome    = require('sinon-chrome/extensions');
const jsdom     = require("jsdom");
const testData  = require("../testData");
const sinon     = require("sinon");
const chai      = require("chai");
const fetch     = require('node-fetch');
const btoa      = require('btoa');
const url       = require('url');
const { assert, expect } = chai;

const {
  returnShortTraceData,
  returnShortTraceDataLowSeverity,
  returnVulnerabilityIdData,
  returnFilterTraceData,
} = testData;

const util = require("../../lib/util.js");
let {
  CONTRAST_USERNAME,
  CONTRAST_SERVICE_KEY,
  CONTRAST_API_KEY,
  CONTRAST_ORG_UUID,
  TEAMSERVER_URL,
  SEVERITY_NOTE,
  SEVERITY_LOW,
  SEVERITY_MEDIUM,
  SEVERITY_HIGH,
  SEVERITY_CRITICAL,
  SEVERITY,
  SEVERITY_NOTE_ICON_PATH,
  SEVERITY_LOW_ICON_PATH,
  SEVERITY_MEDIUM_ICON_PATH,
  SEVERITY_HIGH_ICON_PATH,
  SEVERITY_CRITICAL_ICON_PATH,
  TEAMSERVER_INDEX_PATH_SUFFIX,
  TEAMSERVER_ACCOUNT_PATH_SUFFIX,
  TEAMSERVER_PROFILE_PATH_SUFFIX,
  TEAMSERVER_API_PATH_SUFFIX,
  VALID_TEAMSERVER_HOSTNAMES,
  CONTRAST_GREEN,
  CONTRAST_RED,
  CONTRAST_YELLOW,
  CONTRAST_CONFIGURE_TEXT,
  LISTENING_ON_DOMAIN,
  GATHER_FORMS_ACTION,
  STORED_TRACES_KEY,
  TRACES_REQUEST,
  STORED_APPS_KEY,
  fetchTeamserver,
  getAuthorizationHeader,
  getOrganizationVulnerabilitiesIdsUrl,
  getVulnerabilityShortUrl,
  getApplicationsUrl,
  getVulnerabilityTeamserverUrl,
  getStoredCredentials,
  getOrganizationVulnerabilityIds,
  getVulnerabilityShort,
  getApplications,
  isCredentialed,
  deDupeArray,
  getHostFromUrl,
  isBlacklisted,
  isContrastTeamserver,
  updateTabBadge,
  removeLoadingBadge,
  retrieveApplicationFromStorage,
  generateTraceURLString,
  processTeamserverUrl,
  setElementDisplay,
  setElementText,
} = util;

describe("testing utility functions and constants", function() {
  const authHeader = "Y29udHJhc3RfYWRtaW46ZGVtbw=="
  const apiKey = "demo"
  const fetchOptions = {
    method: "GET",
    headers: {
      "Authorization": authHeader,
      "API-Key": apiKey,
      "Accept": "application/json"
    },
  }
  let teamserverUrl, orgUuid, traceUuid, urls, credentials, fetchSpy;

  beforeEach(() => {
    global.fetch   = fetch;
    global.btoa    = btoa;
    global.chrome  = chrome;
    global.Headers = fetch.Headers;
    global.URL     = url.URL;

    credentials = {
      [CONTRAST_USERNAME]: "admin",
      [CONTRAST_SERVICE_KEY]: "demo",
      [CONTRAST_API_KEY]: "demo",
      [CONTRAST_ORG_UUID]: "i-am-an-org-uuid-123",
      [TEAMSERVER_URL]: "localhost:19080",
    };
    chrome.storage.local.set(credentials);
    orgUuid = "i-am-an-org-uuid-123";
    teamserverUrl = "localhost:19080";
    traceUuid = "7HC2-TYLR-VATF-Z2ZO"; // webgoat sql injection url
    urls = [
      "http://localhost:8080/WebGoat/SqlInjection/attack5a",
      "http://localhost:8080/WebGoat",
      "http://localhost:8080/WebGoat/login",
    ];
  });

  it('0 == 0 to test if mocha works', function() {
    assert.equal(0, 0);
  });

  it('expect variables set in beforeEach to be defined', function() {
    const variables = [
      teamserverUrl,
      orgUuid,
      traceUuid
    ];
    assert.isTrue(variables.every(v => !!v));
  });

  it('returns a base64 encoded Authorization header', function() {
    assert.equal(getAuthorizationHeader("admin", "demo"), "YWRtaW46ZGVtbw==");
  });

  it('returns the TS url to get all trace ids for an organization', function() {
    const url = getOrganizationVulnerabilitiesIdsUrl(teamserverUrl, orgUuid);
    const expectedURL = teamserverUrl + '/ng/' + orgUuid + '/orgtraces/ids';
    assert.equal(url, expectedURL);
  });

  it('returns the TS url for trace short info', function() {
    const url = getVulnerabilityShortUrl(teamserverUrl, orgUuid, traceUuid);
    const expectedURL = teamserverUrl + '/ng/' + orgUuid + '/orgtraces/' + traceUuid + "/short";
    assert.equal(url, expectedURL);
  });

  it('returns a trace overview url without /api', function() {
    const url = getVulnerabilityTeamserverUrl(teamserverUrl, orgUuid, traceUuid);
    assert.equal(url.includes("/api"), false);
  });

  it('returns the expected trace overview url', function() {
    const url = getVulnerabilityTeamserverUrl(teamserverUrl, orgUuid, traceUuid);
    if (teamserverUrl.endsWith("/api")) {
      teamserverUrl = teamserverUrl.substring(0, teamserverUrl.indexOf("/api"));
    }
    const expectedURL = teamserverUrl + '/static/ng/index.html#/' + orgUuid + '/vulns/' + traceUuid + "/overview";

    assert.equal(url, expectedURL);
  });

  it('calls returns a promise of credentials', function(done) {
    const getStoredCreds = getStoredCredentials()
    assert.isTrue(getStoredCreds.constructor.name === "Promise");
    assert.isTrue(chrome.storage.local.get.called);

    chrome.storage.local.get.yields(credentials);

    getStoredCredentials = sinon.stub().returns(Promise.resolve(credentials));
    getStoredCredentials()
    .then(result => {
      assert.isTrue(getStoredCredentials.calledOnce);
      assert.isTrue(chrome.storage.local.get.called);
      assert.isTrue(Object.keys(result).length === 5);
      getStoredCredentials.reset();
      done();
    })
    .catch(done);
  });

  it('processes a given teamserver url', function() {
    for (let i = 0; i < VALID_TEAMSERVER_HOSTNAMES.length; i++) {
      let url = VALID_TEAMSERVER_HOSTNAMES[i];
      assert.equal(processTeamserverUrl(url), `https://${url}/Contrast/api`);
    }
  });

  it('removes duplicates from an array', function() {
    let array = [1,2,3];
    assert.equal(deDupeArray(array).length, 3);

    array = [1,1,1]
    assert.equal(deDupeArray(array).length, 1);
  })

  it('returns if the user is or is not credentialed', function(done) {
    assert.isDefined(credentials);

    function checkCredentials() {
      assert.isTrue(isCredentialed(credentials));
      done();
    }
    checkCredentials();
  });

  it('throws an error fetching data from teamserver', function(done) {
    const url = "http://" + TEAMSERVER_URL +   "/Contrast/api/ng/thisisnotaroute"
    let tsSpy = sinon.spy(fetchTeamserver);

    fetchTeamserver(url, "", authHeader, apiKey)
    .then(result => {
      assert.isTrue(result.constructor.name === "Error");
      done();
    })
    .catch(done);
  });

  it('fetches successfully from teamserver', function(done) {
    const url = "http://" + TEAMSERVER_URL + "/Contrast/api/ng/messages"
    const returnData = {
      "success": true,
    }
    fetchTeamserver = sinon.stub().returns(Promise.resolve(returnData));

    fetchTeamserver(url, "", authHeader, apiKey)
    .then(result => {
      expect(result.success).equal(true);
      expect(fetchTeamserver.called).equal(true);
      fetchTeamserver.reset();
      done();
    })
    .catch(done);
  });

  it('returns a base64 string of urls', function() {
    const base64URLs = generateTraceURLString(urls);
    expect(typeof base64URLs).equal("string");
  });

  it('returns an array of trace uuids', function(done) {
    getOrganizationVulnerabilityIds = sinon.stub().returns(Promise.resolve(returnVulnerabilityIdData));

    getOrganizationVulnerabilityIds(generateTraceURLString(urls))
    .then(result => {
      expect(result.success).equal(true);
      expect(result.traces.length).equal(4);
      expect(getOrganizationVulnerabilityIds.calledWith(generateTraceURLString(urls))).equal(true);
      getOrganizationVulnerabilityIds.reset();
      done();
    });
  });


  it('returns a short trace object', function(done) {
    getVulnerabilityShort = sinon.stub().returns(Promise.resolve(returnShortTraceData));

    getVulnerabilityShort(traceUuid)
    .then(result => {
      expect(result.success).equal(true);
      expect(getVulnerabilityShort.calledWith(traceUuid));

      const keys = Object.keys(result.trace);
      assert.isDefined(keys);
      expect(keys.length).not.equal(0);
      expect(result.trace.uuid).equal(traceUuid);
      expect(result.trace.status).equal("Reported");
      getVulnerabilityShort.reset();
      done();
    })
  })
})
