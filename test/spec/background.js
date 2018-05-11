describe('tests for background methods', () => {

  beforeEach(() => {
    let webRequest = {
      url: "http://localhost:8080/WebGoat/SqlInjection/attack5a",
      type: "xmlhttprequest"
    }

    let runtimeRequest = {
      action: "action"
    }

    let runtimeSender = {
      tab: "tab"
    }

    let runtimeSendResponse = function(responseToBeSent) {}

    chrome.runtime.onMessage.addListener = function(callback) {
      const request      = runtimeRequest
      const sender       = runtimeSender
      const sendResponse = runtimeSendResponse
      return callback(request, sender, sendResponse)
    }
    chrome.runtime.sendMessage = function(request, response) {
      return chrome.runtime.onMessage.addListener(response)
    }
  })



  it('captures a request and evaluates it for vulnerabilities', (done) => {
    spyOn(chrome.tabs, 'query').and.callThrough()
    spyOn(window, 'evaluateVulnerabilities')

    const url = "http://www.example.com/"

    expect(XHR_REQUESTS.length).toEqual(0)

    function checkVulnerabilities() {
      expect(chrome.tabs.query).toHaveBeenCalled()
      expect(evaluateVulnerabilities).toHaveBeenCalled()
      expect(XHR_REQUESTS.length).toEqual(1)
      done()
    }

    fetch(url).then(response => {
      chrome.tabs.getCurrent((tab) => {
        setTimeout(checkVulnerabilities, 1500)
      })
    })
  })

  it('responds to messages', () => {
    spyOn(window, 'handleRuntimeOnMessage')
    chrome.runtime.sendMessage("hello", handleRuntimeOnMessage)
    expect(handleRuntimeOnMessage).toHaveBeenCalled()
  })

  it('directs the runtime message to the correct method', (done) => {
    spyOn(window, 'handleRuntimeOnMessage').and.callThrough()
    spyOn(window, 'getStoredCredentials').and.returnValue(Promise.resolve())
    spyOn(chrome.storage.local, 'get')

    chrome.tabs.query({ active: true, currentWindow: true }, (tab) => {
      handleRuntimeOnMessage({ sender: GATHER_FORMS_ACTION }, { tab }, function() {})
      expect(getStoredCredentials.calls.count()).toEqual(1)

      handleRuntimeOnMessage(TRACES_REQUEST, { tab }, function() {})
      expect(getStoredCredentials.calls.count()).toEqual(1)
      expect(chrome.storage.local.get.calls.count()).toEqual(1)

      handleRuntimeOnMessage("not a thing", { tab }, function() {})
      expect(getStoredCredentials.calls.count()).toEqual(1)
      expect(chrome.storage.local.get.calls.count()).toEqual(1)
      done()
    })
  })

  it('stores vulnerabilities after receiving a message', (done) => {
    spyOn(window, 'handleRuntimeOnMessage').and.callThrough()
    spyOn(window, 'getOrganizationVulnerabilityIds').and.returnValue(
      Promise.resolve({
        traces: returnVulnerabilityIdData['traces']
      })
    )
    spyOn(window, 'processTraces').and.returnValue(
      Promise.resolve(returnVulnerabilityIdData['traces'])
    )
    spyOn(window, 'getVulnerabilityFilter').and.returnValue(
      Promise.resolve({
        trace: returnFilterTraceData
      })
    )
    spyOn(window, 'buildVulnerabilitiesArray').and.returnValue(
      Promise.resolve(returnVulnerabilityIdData['traces'])
    )
    spyOn(chrome.storage.local, 'set').and.callThrough()

    chrome.storage.local.get(STORED_TRACES_KEY, (result) => {
      expect(Object.keys(result).length).toEqual(0)

      chrome.tabs.query({ active: true, currentWindow: true }, tab => {
        handleRuntimeOnMessage({
          sender: GATHER_FORMS_ACTION,
          formActions: ["http://example.com", "http://contrastsecurity.com"]
        }, { tab }, () => {})
      })

      function checkStorage() {
        chrome.storage.local.get(STORED_TRACES_KEY, (newResult) => {
          expect(chrome.storage.local.set).toHaveBeenCalled()
          expect(Object.keys(newResult).length).toEqual(1)
          chrome.storage.local.remove(STORED_TRACES_KEY)
          done()
        })
      }
      setTimeout(checkStorage, 2000) // wait for chrome storage to update
    })
  })
})
