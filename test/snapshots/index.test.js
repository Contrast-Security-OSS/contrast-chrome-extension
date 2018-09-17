const chrome = require("sinon-chrome/extensions");
global.chrome = chrome;

const url = require("url");
global.URL = url.URL;

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const fs = require("fs");
const snapshot = require("snap-shot-it");
const sinon = require("sinon");
const chai = require("chai");
const { expect } = chai;

const util = require("../../lib/util.js");
const { getOrgApplications } = util;
const testData = require("../testData.js");
const ApplicationTable = require("../../lib/models/ApplicationTable.js")
  .default;

// global.window = new JSDOM(
//   `<!DOCTYPE html><html><head></head><body></body></html>`,
//   { url: "http://localhost" }
// ).window;
// global.document = global.window.document;

fs.readFile("html/index.html", (err, file) => {
  if (err) throw err;
  file = file.toString();
  global.window = new JSDOM(file, { url: "http://localhost" }).window;
  console.log("SETTING DOCUMENT GLOBAL");
  global.document = global.window.document;
});

const Config = require("../../lib/models/Config.js").default;

describe("tests the popup index.html file for changes", () => {
  const config = new Config(
    { id: 1, url: "http://localhost:8080/WebGoat" },
    "http://localhost:8080/WebGoat",
    true,
    {},
    true
  );

  // before(done => {
  //   fs.readFile("html/index.html", (err, file) => {
  //     if (err) throw err;
  //     file = file.toString();
  //     global.window = new JSDOM(file, { url: "http://localhost" }).window;
  //     console.log("SETTING DOCUMENT GLOBAL");
  //     global.document = global.window.document;
  //
  //     done();
  //   });
  // });

  it("takes a snapshot of the base index.html file", async () => {
    snapshot(global.document.querySelector("html").innerHTML);
  });

  it("takes a snapshot of the notContrastNotConfigured index.html file", async () => {
    config.popupScreen(0);
    snapshot(global.document.querySelector("html").innerHTML);
  });

  it("takes a snapshot of the contrastNotConfigured index.html file", async () => {
    config.popupScreen(1);
    snapshot(global.document.querySelector("html").innerHTML);
  });

  it("takes a snapshot of the contrastYourAccountNotConfigured index.html file", async () => {
    config.popupScreen(2);
    snapshot(global.document.querySelector("html").innerHTML);
  });

  it("takes a snapshot of the contrastYourAccountConfigured index.html file", async () => {
    config.popupScreen(3);
    snapshot(global.document.querySelector("html").innerHTML);
  });

  it("renders a table of applications", async () => {
    const appTable = new ApplicationTable(
      new URL("http://localhost:8080/WebGoat")
    );

    const isContrastTeamserverMock = sinon.stub(util, "isContrastTeamserver");
    isContrastTeamserverMock.returns(true);

    let app = testData.application;
    app.connectedAlready = true;

    appTable._showContrastApplications(testData.storedApps);
    appTable.createAppTableRow(app, testData.storedApps);
    snapshot(
      global.document.querySelector("#application-table-container-section")
        .innerHTML
    );
  });
});
