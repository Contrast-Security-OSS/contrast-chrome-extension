// describe("Player", function() {
//   var player;
//   var song;
//
//   beforeEach(function() {
//     player = new Player();
//     song = new Song();
//   });
//
//   it("should be able to play a Song", function() {
//     player.play(song);
//     expect(player.currentlyPlayingSong).toEqual(song);
//
//     //demonstrates use of custom matcher
//     expect(player).toBePlaying(song);
//   });
//
describe("testing utility functions and constants", () => {
  let teamserverUrl, orgUuid, traceUuid, spy, obj;
  beforeEach((done) => {
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

  it('returns a string of urls, separated by commas, encoded in base64', () => {
    const expectedString = "L1dlYkdvYXQvU3FsSW5qZWN0aW9uL2F0dGFjazVh,L1dlYkdvYXQ=,L1dlYkdvYXQvbG9naW4="
    expect(generateURLString(urls)).toEqual(expectedString)
  })

  it('calls the xhr callback to generate a list of trace uuids', (done) => {
    const traceUrls = generateURLString(urls)
    const spy = jasmine.createSpy('callback')
    const sendXhr = spyOn(window, 'sendXhr')
    const getTraces = spyOn(window, 'getOrganizationVulnerabilityesIds').and.callThrough()
    const chromeSpy = spyOn(window.chrome.storage.local, 'get').and.callThrough()

    getTraces(traceUrls, spy)
    done()
    console.log(sendXhr.calls.all());

    expect(chromeSpy).toHaveBeenCalled()


  })

})
