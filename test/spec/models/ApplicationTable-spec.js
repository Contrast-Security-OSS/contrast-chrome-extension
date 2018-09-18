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
const ApplicationTable = require('../../../lib/models/ApplicationTable.js').default;
