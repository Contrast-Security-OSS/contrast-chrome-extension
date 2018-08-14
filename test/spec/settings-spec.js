const chrome   = require('sinon-chrome/extensions');
const jsdom    = require("jsdom");
const testData = require("../testData")
const sinon    = require("sinon");
const chai     = require("chai");
const { assert, expect } = chai;
const Helpers  = require('../../lib/util.js');
const {
  CONTRAST_USERNAME,
  CONTRAST_SERVICE_KEY,
  CONTRAST_API_KEY,
  CONTRAST_ORG_UUID,
  TEAMSERVER_URL,
  processTeamserverUrl,
} = Helpers;

const { JSDOM } = jsdom;

describe('setting the initial credentials for the extension from teamserver', () => {

  global.document = (new JSDOM(
    `<!DOCTYPE html><html><head></head><body></body></html>`
  )).window.document;

  const dummyElement       = document.createElement('button')
  const dummyUsername      = document.createElement('input')
  const dummyServiceKey    = document.createElement('input')
  const dummyApiKey        = document.createElement('input')
  const dummyOrgUuid       = document.createElement('input')
  const dummyTeamserverUrl = document.createElement('input')

  dummyUsername.value      = "contrast_admin"
  dummyServiceKey.value    = "demo"
  dummyApiKey.value        = "demo"
  dummyOrgUuid.value       = "04bfd6c5-b24e-4610-b8b9-bcbde09f8e15"
  dummyTeamserverUrl.value = "localhost:19080"

  let contrastCredentials;

  beforeEach(() => {
    global.chrome = chrome;
    contrastCredentials = {
      [CONTRAST_USERNAME]: dummyUsername.value,
      [CONTRAST_SERVICE_KEY]: dummyServiceKey.value,
      [CONTRAST_API_KEY]: dummyApiKey.value,
      [CONTRAST_ORG_UUID]: dummyOrgUuid.value,
      [TEAMSERVER_URL]: processTeamserverUrl(dummyTeamserverUrl.value),
    }

    dummyElement.click = function() {
      chrome.storage.local.get.yields(contrastCredentials);
    }
    chrome.storage.local.clear()
  });

  it('fills in empty credentials', function() {
    const username      = dummyUsername.value.trim();
    const serviceKey    = dummyServiceKey.value.trim();
    const apiKey        = dummyApiKey.value.trim();
    const orgUuid       = dummyOrgUuid.value.trim();
    const teamserverUrl = processTeamserverUrl(dummyTeamserverUrl.value.trim());

    expect(username).equal(dummyUsername.value);
    expect(serviceKey).equal(dummyServiceKey.value);
    expect(apiKey).equal(dummyApiKey.value);
    expect(orgUuid).equal(dummyOrgUuid.value);
    expect(teamserverUrl).equal("https://localhost:19080/Contrast/api");

    chrome.storage.local.get.yields({})
    chrome.storage.local.get([
      CONTRAST_USERNAME,
      CONTRAST_SERVICE_KEY,
      CONTRAST_API_KEY,
      CONTRAST_ORG_UUID,
      TEAMSERVER_URL,
    ], (items) => {
      expect(Object.values(items).length).equal(0);
    });

    dummyElement.click();

    chrome.storage.local.get([
      CONTRAST_USERNAME,
      CONTRAST_SERVICE_KEY,
      CONTRAST_API_KEY,
      CONTRAST_ORG_UUID,
      TEAMSERVER_URL,
    ], (items) => {
      expect(Object.values(items).length).equal(5);
    });
  });
});
