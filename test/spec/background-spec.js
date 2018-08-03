const chrome     = require('sinon-chrome/extensions');
global.chrome = chrome;

const urlModule  = require('url');
global.URL = urlModule.URL;

const testData   = require("../testData")
const sinon      = require("sinon");
const chai       = require("chai");
const fetch      = require('node-fetch');
const storageMock = require('../mocks/storageMock.js');
const { assert, expect } = chai;

const jsdom      = require("jsdom");
const { JSDOM }  = jsdom;
global.window = new JSDOM(
  `<!DOCTYPE html><html><head></head><body></body></html>`, { url: "http://localhost" }).window;
global.window.localStorage = storageMock;
global.document = global.window.document;


const VulnerableTab = require('../../lib/models/VulnerableTab.js');

const util       = require('../../lib/util.js');
const background = require('../../lib/background.js');
const ApplicationModel = require('../../lib/models/Application.js');
const Application = ApplicationModel.default;

const {
  _handleRuntimeOnMessage,
  APPLICATION_CONNECTED,
  APPLICATION_DISCONNECTED,
  LOADING_DONE,
} = background;

describe('tests for background methods', function() {
  beforeEach(function() {
    global.fetch = fetch;
    chrome.flush();
    chrome.reset();
    chrome.runtime.sendMessage.flush();
    chrome.runtime.sendMessage.reset();
    chrome.storage.local.get.flush();
    chrome.storage.local.get.reset();
    chrome.tabs.query.flush();
    chrome.tabs.query.reset();
  });

  afterEach(function() {
    chrome.flush();
    chrome.reset();
    chrome.storage.local.get.flush();
    chrome.storage.local.get.reset();
    chrome.tabs.query.flush();
    chrome.tabs.query.reset();
  })


  it('captures a request and evaluates it for vulnerabilities', function() {
    const url = "http://www.example.com/"

    // added in global space, so has been called
    const spy = sinon.spy();
    chrome.webRequest.onBeforeRequest.addListener(spy)

    expect(spy.called).equal(false);

    const params = {
      url,
      type: "xmlhttprequest"
    }
    chrome.webRequest.onBeforeRequest.trigger(params);

    expect(spy.calledOnce).equal(true);
    expect(spy.calledWith(params)).equal(true);
  });

  it('responds to messages', function() {
    const params = {
      request: "request",
      sender: "sender",
      sendResponse: sinon.spy(),
    }

    const spy = sinon.spy();
    chrome.runtime.onMessage.addListener(spy);

    expect(spy.called).equal(false);

    chrome.runtime.onMessage.trigger(params);

    expect(spy.calledOnce).equal(true);
    expect(spy.calledWith(params)).equal(true);
  });

  // it('directs the runtime message to the correct method', function() {
  //   const spy = sinon.spy();
  //   const vulnSpy = sinon.spy(VulnerableTab.default);
  //   const tab = {
  //     id: 1,
  //     url: "http://www.example.com/abc"
  //   };
  //
  // //   APPLICATION_CONNECTED
  // // APPLICATION_DISCONNECTED
  // // LOADING_DONE
  // // TRACES_REQUEST
  //
  //   const request = {
  //     application: {
  //       id    : "123",
  //       name  : "name",
  //       domain: "example.com",
  //       host  : "example.com",
  //     }
  //   }
  //
  //   let hand;
  //   request.action = TRACES_REQUEST;
  //
  //   _handleRuntimeOnMessage(request, spy, tab)
  //   expect(vulnSpy.called).equal(true);
  //
  //   // expect(chrome.storage.local.get.calledOnce).equal(true);
  //   // hand = _handleRuntimeOnMessage(TRACES_REQUEST, spy, tab);
  //   // expect(chrome.storage.local.get.calledTwice).equal(true);
  //   //
  //   // hand = _handleRuntimeOnMessage("not a thing", spy, tab);
  //   // expect(hand).equal("not a thing");
  // });
});
