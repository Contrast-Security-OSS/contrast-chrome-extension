const chrome     = require('sinon-chrome/extensions');
global.chrome = chrome;

const testData   = require("../testData")
const sinon      = require("sinon");
const chai       = require("chai");
const fetch      = require('node-fetch');
const { assert, expect } = chai;
const util       = require('../../lib/util.js');
const background = require('../../lib/background.js');

let {
  handleWebRequest,
  handleRuntimeOnMessage,
  handleTabActivated,
  tabUpdateComplete,
  updateVulnerabilities,
  evaluateVulnerabilities,
  setToStorage,
  buildVulnerabilitiesArray,
  removeVulnerabilitiesFromStorage,
  getCredentials,
  _setCurrentApplication,
  TAB_CLOSED,
  VULNERABLE_TABS,
  XHR_REQUESTS,
  CURRENT_APPLICATION,
} = background;

let {
  getStoredCredentials,
  retrieveApplicationFromStorage,
  GATHER_FORMS_ACTION,
  TRACES_REQUEST,
} = util;

describe('tests for background methods', function() {
  beforeEach(function() {
    global.fetch = fetch;
    global.CURRENT_APPLICATION = CURRENT_APPLICATION;
    chrome.flush();
    chrome.reset();
    chrome.runtime.sendMessage.flush();
    chrome.runtime.sendMessage.reset();
    chrome.storage.local.get.flush();
    chrome.storage.local.get.reset();
    chrome.tabs.query.flush();
    chrome.tabs.query.reset();
  });

  after(function() {
    chrome.flush();
    chrome.reset();
    chrome.storage.local.get.flush();
    chrome.storage.local.get.reset();
    chrome.tabs.query.flush();
    chrome.tabs.query.reset();
  })


  it('captures a request and evaluates it for vulnerabilities', function() {
    const url = "http://www.example.com/"
    expect(XHR_REQUESTS.length).equal(0)

    // added in global space, so has been called
    const handlerSpy = sinon.spy(handleWebRequest);
    chrome.webRequest.onBeforeRequest.addListener(handlerSpy)
    expect(handlerSpy.called).equal(false);

    chrome.webRequest.onBeforeRequest.trigger({
      url,
      type: "xmlhttprequest"
    });
    expect(handlerSpy.called).equal(true);
    expect(XHR_REQUESTS.length).equal(1);
  });

  it('responds to messages', function() {
    const params = {
      request: "request",
      sender: "sender",
      sendResponse: sinon.spy(),
    }

    const handlerSpy = sinon.spy(handleRuntimeOnMessage);
    chrome.runtime.onMessage.addListener(handlerSpy);

    expect(handlerSpy.called).equal(false);

    chrome.runtime.onMessage.trigger(params);
    expect(handlerSpy.called).equal(true);
    expect(handlerSpy.calledWith(params)).equal(true);

  });

  it('directs the runtime message to the correct method', function() {
    const spy = sinon.spy();
    const tab = {
      id: 1,
      url: "http://example.com"
    };

    let hand;
    hand = handleRuntimeOnMessage({ sender: GATHER_FORMS_ACTION }, spy, tab);
    expect(hand.constructor.name === "Promise");

    expect(chrome.storage.local.get.calledOnce).equal(true);
    hand = handleRuntimeOnMessage(TRACES_REQUEST, spy, tab);
    expect(chrome.storage.local.get.calledTwice).equal(true);

    hand = handleRuntimeOnMessage("not a thing", spy, tab);
    expect(hand).equal("not a thing");
  });

  it('sets an application', function() {
    const application = { localhost_8080: "webgoat" };
    const setAppSpy = sinon.spy(_setCurrentApplication);

    expect(CURRENT_APPLICATION).equal(null);
    expect(setAppSpy.called).equal(false);

    const newApp = setAppSpy(application);

    expect(setAppSpy.called).equal(true);
    expect(newApp).equal(application);
  });
});
