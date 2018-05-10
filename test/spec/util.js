describe("testing utility functions and constants", () => {
  const authHeader = "Y29udHJhc3RfYWRtaW46ZGVtbw=="
  const apiKey = "demo"
  const fetchOptions = {
    method: "GET",
    headers: new Headers({
      "Authorization": authHeader,
      "API-Key": apiKey,
      "Accept": "application/json"
    })
  }
  let teamserverUrl, orgUuid, traceUuid, spy, obj, urls, credentials;

  beforeEach((done) => {
    const fetchSpy = spyOn(window, 'fetch').and.callThrough()
    chrome.storage.local.get([
      CONTRAST_USERNAME,
      CONTRAST_SERVICE_KEY,
      CONTRAST_API_KEY,
      CONTRAST_ORG_UUID,
      TEAMSERVER_URL,
      CONTRAST_ORG_UUID
    ], (items) => {
      teamserverUrl = items[TEAMSERVER_URL]
      orgUuid = items[CONTRAST_ORG_UUID]
      traceUuid = "7HC2-TYLR-VATF-Z2ZO" // webgoat sql injection url
      urls = [
        "http://localhost:8080/WebGoat/SqlInjection/attack5a",
        "http://localhost:8080/WebGoat",
        "http://localhost:8080/WebGoat/login",
      ]
      credentials = items

      // callback from jasmine
      done()
    })
  })

  it('0 == 0 to test if jasmine works', () => expect(0).toEqual(0))

  it('expect variables set in beforeEach to be defined', () => {
    const variables = [
      teamserverUrl,
      orgUuid,
      traceUuid
    ]
    expect(variables.every(v => !!v)).toBe(true)
  })

  it('returns a base64 encoded Authorization header', () => {
    expect(getAuthorizationHeader("admin", "demo")).toEqual("YWRtaW46ZGVtbw==")
  })

  it('returns the TS url to get all trace ids for an organization', () => {
    const url = getOrganizationVulnerabilitiesIdsUrl(teamserverUrl, orgUuid)
    const expectedURL = teamserverUrl + '/ng/' + orgUuid + '/orgtraces/ids'
    expect(url).toEqual(expectedURL)
  })

  it('returns the TS url for trace short info', () => {
    const url = getVulnerabilityShortUrl(teamserverUrl, orgUuid, traceUuid)
    const expectedURL = teamserverUrl + '/ng/' + orgUuid + '/orgtraces/' + traceUuid + "/short"
    expect(url).toEqual(expectedURL)
  })

  it('returns a trace overview url without /api', () => {
    const url = getVulnerabilityTeamserverUrl(teamserverUrl, orgUuid, traceUuid)
    expect(url.includes("/api")).toBe(false)
  })
  it('returns the expected trace overview url', () => {
    const url = getVulnerabilityTeamserverUrl(teamserverUrl, orgUuid, traceUuid)
    if (teamserverUrl.endsWith("/api")) {
      teamserverUrl = teamserverUrl.substring(0, teamserverUrl.indexOf("/api"));
    }
    const expectedURL = teamserverUrl + '/static/ng/index.html#/' + orgUuid + '/vulns/' + traceUuid + "/overview"

    expect(url).toEqual(expectedURL)
  })

  it('calls returns a promise of credentials', (done) => {
    const getStoredCredentialsSpy = spyOn(window,'getStoredCredentials').and.callThrough()
    const storageSpy = spyOn(chrome.storage.local, 'get').and.callThrough()

    getStoredCredentialsSpy()
    .then(result => {
      expect(getStoredCredentialsSpy).toHaveBeenCalledWith()
      expect(Object.keys(result).length).toEqual(5)
      expect(storageSpy).toHaveBeenCalled()
      done()
    })
  })

  it('removes duplicates from an array', () => {
    let array = [1,2,3]
    expect(deDupeArray(array).length).toEqual(3)

    array = [1,1,1]
    expect(deDupeArray(array).length).toEqual(1)
  })

  it('returns if the user is or is not credentialed', () => {
    const isCredentialedSpy = spyOn(window, 'isCredentialed').and.callThrough()
    expect(isCredentialedSpy(credentials)).toEqual(true)
  })

  it('throws an error fetching data from teamserver', (done) => {
    const url      = "http://localhost:19080/Contrast/api/ng/thisisnotaroute"
    const tsSpy    = spyOn(window, 'fetchTeamserver').and.callThrough()
    tsSpy(url, "", authHeader, apiKey)
    .then(result => {
      expect(result).toEqual("error fetching from teamserver")
      expect(window.fetch).toHaveBeenCalledWith(url, fetchOptions)
      done()
    })
  })

  it('fetches successfully from teamserver', (done) => {
    const url = "http://localhost:19080/Contrast/api/ng/messages"
    const returnData = {
      "success": true,
    }
    const tsSpy = spyOn(window, 'fetchTeamserver').and.returnValue(Promise.resolve(returnData))
    tsSpy(url, "", authHeader, apiKey)
    .then(result => {
      expect(result.success).toEqual(true)
      expect(fetchTeamserver).toHaveBeenCalled()
      done()
    })
  })

  it('returns an array of trace uuids', (done) => {
    const getOrganizationVulnerabilityIdsSpy = spyOn(window,'getOrganizationVulnerabilityIds').and.returnValue(Promise.resolve(returnVulnerabilityIdData))

    getOrganizationVulnerabilityIdsSpy(generateURLString(urls))
    .then(result => {
      expect(result.success).toEqual(true)
      expect(result.traces.length).toEqual(4)
      expect(getOrganizationVulnerabilityIds).toHaveBeenCalledWith(generateURLString(urls))
      done()
    })
  })

  it('returns an extended trace object', (done) => {
    const getVulnerabilityFilterSpy = spyOn(window,'getVulnerabilityFilter').and.returnValue(Promise.resolve(returnFilterTraceData))

    getVulnerabilityFilterSpy(traceUuid)
    .then(result => {
      expect(result.success).toEqual(true)
      expect(getVulnerabilityFilter).toHaveBeenCalledWith(traceUuid)

      const keys = Object.keys(result.trace)
      expect(keys).toBeDefined()
      expect(keys.length).not.toEqual(0)
      expect(keys.includes("application")).toEqual(true)
      expect(keys.includes("rule_name")).toEqual(true)
      expect(keys.includes("severity")).toEqual(true)
      expect(keys.includes("request")).toEqual(true)
      expect(result.trace.uuid).toEqual(traceUuid)
      expect(result.trace.status).toEqual("Reported")
      done()
    })
  })

  it('returns a short trace object', (done) => {
    const getVulnerabilityShortSpy = spyOn(window,'getVulnerabilityShort').and.returnValue(Promise.resolve(returnShortTraceData))

    getVulnerabilityShortSpy(traceUuid)
    .then(result => {
      expect(result.success).toEqual(true)
      expect(getVulnerabilityShort).toHaveBeenCalledWith(traceUuid)

      const keys = Object.keys(result.trace)
      expect(keys).toBeDefined()
      expect(keys.length).not.toEqual(0)
      expect(result.trace.uuid).toEqual(traceUuid)
      expect(result.trace.status).toEqual("Reported")
      done()
    })
  })
})
