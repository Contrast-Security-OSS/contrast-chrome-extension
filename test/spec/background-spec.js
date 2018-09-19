const chrome  = require('sinon-chrome/extensions');
global.chrome = chrome;

const urlModule  = require('url');
global.URL = urlModule.URL;

const testData   = require("../testData")
const {
  fakeTab,
} = testData;

const murmurHash3 = require('../scripts/murmurhash3.js');
global.murmurHash3 = murmurHash3;

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

const util       = require('../../lib/util.js');
const background = require('../../lib/background.js');
const ApplicationModel = require('../../lib/models/Application.js');
const Application = ApplicationModel.default;
const DomainStorage = require('../../lib/models/DomainStorage.js').default;

const VulnerableTab = require('../../lib/models/VulnerableTab.js').default;

const {
  updateExtensionIcon,
  TRACES_REQUEST,
  APPLICATION_CONNECTED,
  APPLICATION_DISCONNECTED,
  LOADING_DONE,
  CONNECTED_APP_DOMAINS,
} = util;

let {
  _handleRuntimeOnMessage,
  resetXHRRequests,
  TAB_CLOSED,
  notifyUserToConfigure,
} = background;

describe('tests for background methods', function() {

  let XHRDomainsStub = sinon.stub(DomainStorage.prototype, 'constructor');
  XHRDomainsStub.returns({ domains: ["http://localhost:*/*"] });
  // let XHRDomainsAddDomainStub;
  // let XHRDomainsRemoveDomainStub;
  beforeEach(function() {
    global.fetch = fetch;
    window.localStorage.setItem(CONNECTED_APP_DOMAINS, [])
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

  it('resets xhr requests', function() {
    window.XHR_REQUESTS = ["a", "b", "c", "d"];
    resetXHRRequests();
    expect(window.XHR_REQUESTS.length).equal(0);
  });

  it('notifies a user to config', function() {
    expect(TAB_CLOSED).equal(false);
    let tab = {
      id: 1,
      url: "http://app.contrastsecurity.com/Contrast/static/ng/index.html#/account"
    }
    expect(chrome.browserAction.setIcon.calledOnce).equal(false);
    notifyUserToConfigure(tab, 2);
    expect(chrome.browserAction.setIcon.calledOnce).equal(true);

    let details = {
      tabId: tab.id,
      path: "/img/contrast-not-configured.png"
    };
    expect(chrome.browserAction.setIcon.args[0][0]).to.deep.equal(details);
    expect(chrome.browserAction.setIcon.calledWith(details)).equal(true);
    expect(TAB_CLOSED).equal(false);
  });

  describe('it handles a runtime message', function() {

    let req;
    afterEach(function() {
      req = undefined;
      res = undefined;
    });

    it('returns null because the request is null', function(done) {
      let req = null;
      let spy = sinon.spy();
      let res = _handleRuntimeOnMessage(req, spy, fakeTab);
      expect(res instanceof Promise).equal(true);
      res.then(ret => {
        expect(ret).equal(req);
        expect(spy.calledOnce).equal(false);
        done();
      }).catch(done);
    });

    it('returns the request because there is no action', function(done) {
      let req = {};
      let spy = sinon.spy();
      let res = _handleRuntimeOnMessage(req, spy, fakeTab);
      expect(res instanceof Promise).equal(true);
      res.then(ret => {
        expect(JSON.stringify(ret)).equal(JSON.stringify(req));
        expect(spy.calledOnce).equal(false);
        done();
      }).catch(done);
    });

    it('returns the request because the action is not a case', function(done) {
      let spy = sinon.spy();
      let req = { action: "ACTION" };
      let res = _handleRuntimeOnMessage(req, spy, fakeTab);
      expect(res instanceof Promise).equal(true);
      res.then(ret => {
        expect(JSON.stringify(ret)).equal(JSON.stringify(req));
        expect(spy.calledOnce).equal(false);
        done();
      }).catch(done);
    });

    it('responds to a traces request', function(done) {
      let tab = {
        id: 253940142,
        url: "http://localhost:3000/",
      }
      let application = {
        name: "godzilla-express",
      }
      let vulnTab = {
        appNameHash: "c7fdc327a6f33538b19e8f8a189c8b03",
        path: "/",
        vulnTabId: "77a30adcdeb2ef7459df6491565a4e92",
      }
      let vulnTabStub = sinon.stub(VulnerableTab.prototype, 'constructor');
      vulnTabStub.returns(vulnTab);
      let storedTabStub = sinon.stub(VulnerableTab.prototype, 'getStoredTab');
      storedTabStub.returns(Promise.resolve({
        "77a30adcdeb2ef7459df6491565a4e92": [
          "43J8-AIHL-SC4F-TL4S",
          "96EH-MVNP-DQTH-6J4Y"
        ]
      }));
      let spy = sinon.spy();
      let req = {
        action: TRACES_REQUEST,
        application,
      };
      let res = _handleRuntimeOnMessage(req, spy, tab);
      expect(res instanceof Promise).equal(true);
      res.then(ret => {
        expect(spy.calledOnce).equal(true);
        expect(JSON.stringify(ret)).equal(JSON.stringify(req));
        done();
      }).catch(done);
    });

    it('adds domains to storage', function() {
      let domains = ["contrastsecurity", "localhost:8080"];
      let req = {
        action: APPLICATION_CONNECTED,
        data: {
          domains,
        },
      };
      let spy = sinon.spy();
      let res = _handleRuntimeOnMessage(req, spy, fakeTab);
      expect(res instanceof Promise).equal(true);
      expect(spy.calledOnce).equal(false);
      expect(window.localStorage.getItem(CONNECTED_APP_DOMAINS)).equal(JSON.stringify(domains));
    });

    it('removes domains from storage', function() {
      let domains = ["contrastsecurity", "localhost:8080"];
      let req = {
        action: APPLICATION_CONNECTED,
        data: {
          domains,
        },
      };
      let spy = sinon.spy();
      let res = _handleRuntimeOnMessage(req, spy, fakeTab);
      expect(window.localStorage.getItem(CONNECTED_APP_DOMAINS)).equal(JSON.stringify(domains));
      expect(res instanceof Promise).equal(true);
      expect(spy.calledOnce).equal(false);
      req = {
        action: APPLICATION_DISCONNECTED,
        data: {
          domains: ["contrastsecurity"],
        },
      }

      res = _handleRuntimeOnMessage(req, spy, fakeTab);
      expect(res instanceof Promise).equal(true);
      expect(spy.calledOnce).equal(false);
      expect(window.localStorage.getItem(CONNECTED_APP_DOMAINS))
        .equal(JSON.stringify(["localhost:8080"]));

      req.data.domains = ["localhost:8080"];
      res = _handleRuntimeOnMessage(req, spy, fakeTab);
      expect(res instanceof Promise).equal(true);
      expect(spy.calledOnce).equal(false);
      expect(window.localStorage.getItem(CONNECTED_APP_DOMAINS))
        .equal(JSON.stringify([]));
    });

    it('indicates that the page has finished loading', function() {
      let spy = sinon.spy();
      req = {
        action: LOADING_DONE,
      }
      expect(window.PAGE_FINISHED_LOADING).equal(false);
      res = _handleRuntimeOnMessage(req, spy, fakeTab);
      expect(res instanceof Promise).equal(true);
      expect(spy.calledOnce).equal(false);
      expect(window.PAGE_FINISHED_LOADING).equal(true);
    });
  });

});
