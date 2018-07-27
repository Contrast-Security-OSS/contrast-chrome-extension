const chrome     = require('sinon-chrome/extensions');
global.chrome = chrome;
const URL        = require('url');
const sinon      = require("sinon");
const chai       = require("chai");
const { expect } = chai;
const util       = require('../../../lib/util.js');
const ApplicationModel = require('../../../lib/models/Application.js');
const Application = ApplicationModel.default;

const APP_ID = "webgoat-id-123";
const APP_NAME = "webgoat";
const APP_HOST = "localhost_8080";
const APP = {
  [APP_HOST]: APP_ID,
  id: APP_ID,
  name: APP_NAME,
  domain: APP_HOST,
  host: APP_HOST,
}

const APP_ID_2 = "bhima-id-123";
const APP_NAME_2 = "bhima";
const APP_HOST_2 = "localhost:3000";
const APP_2 = {
  [APP_HOST_2]: APP_ID_2,
  id: APP_ID_2,
  name: APP_NAME_2,
  domain: APP_HOST_2,
  host: APP_HOST_2,
}

let {
  STORED_APPS_KEY,
  updateTabBadge,
} = util;

describe('tests for Application model', function() {
  beforeEach(function() {
    global.URL = URL.URL;
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
  });

  it('creates a new application', function() {
    const application = new Application(APP_HOST, { name: APP_NAME, app_id: APP_ID });
    expect(JSON.stringify(application)).equal(JSON.stringify(APP));
  });

  it('resolves to null when no applications are in storage', function(done) {
    const tab = { url: "http://localhost:8080/WebGoat", id: 123 }
    const badgeSpy = sinon.spy(updateTabBadge);

    chrome.storage.local.get.yields({ [STORED_APPS_KEY]: [] })
    Application.retrieveApplicationFromStorage(tab)
    .then(application => {
      expect(JSON.stringify(application)).equal(JSON.stringify(null));
      expect(chrome.storage.local.get.called).equal(true);
      done();
    });
  });

  it('retrieves an app from storage', function(done) {
    const tab = { url: "http://localhost:8080/WebGoat", id: 123 };

    chrome.storage.local.get.yields({ [STORED_APPS_KEY]: [APP] })
    Application.retrieveApplicationFromStorage(tab)
    .then(application => {
      expect(JSON.stringify(application)).equal(JSON.stringify(APP));
      expect(chrome.storage.local.get.called).equal(true);
      done();
    })
    .catch(done)
  });

  it('filters an array of apps to get a specific app', function() {
    const app = { name: APP_NAME, app_id: APP_ID };
    const storedApps = { [STORED_APPS_KEY]: [APP, APP_2]};
    const storedApp  = Application.getStoredApp(storedApps, app);
    expect(JSON.stringify(storedApp)).equal(JSON.stringify(APP));
  });

  it('converts apps with hosts with : to hosts with _', function() {
    const domain = Application.subDomainColonForUnderscore(APP_2);
    expect(domain).equal(APP_2.domain.replace(":", "_"));
  });

  it('converts apps with hosts with _ to hosts with :', function() {
    const domain = Application.subDomainColonForUnderscore(APP);
    expect(domain).equal(APP.domain.replace("_", ":"));
  });

});
