const chrome = require("sinon-chrome/extensions");
global.chrome = chrome;

const url = require("url");
global.URL = url.URL;

const jsdom = require("jsdom");
const { JSDOM } = jsdom;
global.window = new JSDOM("<html><head></head><body></body></html>", { url: "http://localhost" }).window;
global.document = global.window.document;

const sinon      = require("sinon");
const chai       = require("chai");
const { expect } = chai;
const util       = require('../../../lib/util.js');
const testData = require('../../testData.js');
const Config = require('../../../lib/models/Config.js').default;

const {
  fakeTab, // url: "http://localhost:8080/WebGoat"
  fakeCreds,
} = testData;

/**************************************************
 * NOTE: Popup Screen tests are handled by Snapshots
 **************************************************/
describe('tests for Config model', function() {
  let config;
  beforeEach(function() {
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
    config = undefined;
    chrome.flush();
    chrome.reset();
    chrome.storage.local.get.flush();
    chrome.storage.local.get.reset();
    chrome.tabs.query.flush();
    chrome.tabs.query.reset();
  });

  it('creates a new Config', function() {
    let expectedConfig = {
      tab: fakeTab,
      url: fakeTab.url,
      credentialed: true,
      credentials: fakeCreds,
      hasApp: false,
    }
    config = new Config(fakeTab, new URL(fakeTab.url), true, fakeCreds, false);
    expect(config instanceof Config).equal(true);
    expect(JSON.stringify(expectedConfig)).equal(JSON.stringify(config));
  });

  it('builds a contrast url', function() {
    let input = "localhost:1234";
    config = new Config(fakeTab, new URL(fakeTab.url), true, fakeCreds, true);
    expect(config._buildContrastUrl(input)).equal(`http://${input}/Contrast/api`);

    input = "app.contrastsecurity.com";
    expect(config._buildContrastUrl(input)).equal(`https://${input}/Contrast/api`);

    // NOTE: Calling .throw(), pass a function not the result of a function
    // https://stackoverflow.com/a/21587239/6410635
    input = "javascript:alert(1)";
    expect(config._buildContrastUrl.bind(config, input)).to.throw();
  });

  it('is a contrast page', function() {
    fakeTab.url = "http://app.contrastsecurity.com/Contrast/static/ng";
    let url = "http://app.contrastsecurity.com/Contrast/static/ng";
    config = new Config(fakeTab, new URL(url), true, fakeCreds, true);
    expect(config._isContrastPage()).equal(true);
  });

  it('is the contrast your account page', function() {
    fakeTab.url = "http://app.contrastsecurity.com/Contrast/static/ng/index.html#/account";
    let url = "http://app.contrastsecurity.com/Contrast/static/ng/index.html#/account";
    config = new Config(fakeTab, new URL(url), true, fakeCreds, true);
    expect(config._isTeamserverAccountPage()).equal(true);
  });

  it('gets a contrast url', function() {
    config = new Config(fakeTab, new URL(fakeTab.url), true, fakeCreds, true);
    let stub = sinon.stub(config, '_isContrastPage');
    stub.returns(true);

    let origin = config.url.origin;

    let input = document.createElement('input');
    document.body.appendChild(input);
    input.value = "";

    expect(config._getContrastURL(input)).equal(`${origin}/Contrast/api`);
  });

  it('gets a contrast url with an input value', function() {
    config = new Config(fakeTab, new URL(fakeTab.url), true, fakeCreds, true);
    let stub = sinon.stub(config, '_isContrastPage');
    stub.returns(false);

    let origin = config.url.origin;

    let input = document.createElement('input');
    document.body.appendChild(input);
    input.value = "hello";

    expect(config._getContrastURL(input)).equal(`https://${input.value}/Contrast/api`);
  });
});
