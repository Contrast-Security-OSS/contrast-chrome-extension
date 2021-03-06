// const chrome   = require('sinon-chrome/extensions');
// const jsdom    = require("jsdom");
// const testData = require("../testData")
// const sinon    = require("sinon");
// const chai     = require("chai");
// const assert   = chai.assert;
//
// const { JSDOM } = jsdom;
//
// const {
//   returnShortTraceData,
//   returnShortTraceDataLowSeverity,
// } = testData;
//
// const popupMethods = require('../../lib/popupMethods.js');
// let {
//   renderListItem,
//   populateVulnerabilitySection,
//   getStorageVulnsAndRender,
//   getShortVulnerabilities,
// } = popupMethods;
//
// const Helpers = require('../../lib/util.js');
// let {
//   setElementDisplay,
//   setElementText,
//   getVulnerabilityShort,
// } = Helpers;
//
// /**
// * Array.prototype.flatten - reduce multi-dimensional arrays to single dimension
// *
// * add the .flatten() method to Array instances
// * the empty array is the initial value of the new array
// *
// * @return {Array}
// */
// Array.prototype.flatten = function() {
//   return this.reduce((newArray, val) => newArray.concat(val), []);
// }
//
//
// /**
// * String.prototype.titleize - capitalize the first letter of each word in a string, regardless of special characters
// * https://stackoverflow.com/a/6251509/6410635
// * https://stackoverflow.com/a/196991/6410635
// *
// * @return {String} titleized string
// */
// String.prototype.titleize = function() {
//   return this.replace(/\b([a-z])/g, function(captured) {
//     return captured.charAt(0).toUpperCase() + captured.substr(1).toLowerCase();
//   });
// }
//
//
// describe('test how vulnerabilities are rendered to user', function() {
//
//   const traces = ['this-is-a-trace', 'this-is-another-trace'];
//   const teamserver_url = "url";
//   const contrast_org_uuid = "uuid";
//   const items = {
//     teamserver_url,
//     contrast_org_uuid,
//   }
//
//   let child;
//
//   beforeEach(function() {
//     setGlobals();
//     setDomElements(true);
//     resetChrome();
//   })
//
//   afterEach(function() {
//     setDomElements(false);
//     resetChrome();
//   });
//
//   function setGlobals() {
//     global.chrome = chrome;
//     global.document = (new JSDOM(
//       `<!DOCTYPE html><html><head></head><body></body></html>`
//     )).window.document;
//   }
//
//   function resetChrome() {
//     chrome.flush();
//     chrome.reset();
//     chrome.runtime.sendMessage.flush();
//     chrome.runtime.sendMessage.reset();
//     chrome.storage.local.get.flush();
//     chrome.storage.local.get.reset();
//     chrome.tabs.query.flush();
//     chrome.tabs.query.reset();
//   }
//
//   function setDomElements(addOrRemove) {
//     if (addOrRemove) {
//       const container   = document.createElement('ul');
//       const noVulns     = document.createElement('div');
//       const vulnsOnPage = document.createElement('div');
//
//       noVulns.setAttribute('id', 'no-vulnerabilities-found');
//       vulnsOnPage.setAttribute('id', 'vulnerabilities-found-on-page');
//
//       document.children[0].appendChild(container);
//       document.body.appendChild(noVulns);
//       document.body.appendChild(vulnsOnPage);
//
//       container.setAttribute('id', 'vulnerabilities-found-on-page-list');
//       container.style.display = 'none';
//       noVulns.style.display = '';
//       vulnsOnPage.style.display = '';
//       if (!!container.children.length > 0) {
//         container.children[0].parentNode.removeChild(container.children[0]);
//       } else {
//         renderListItem(returnShortTraceData, "teamserverURL", "org uuid");
//         child = container.children[0];
//       }
//     } else {
//       document.getElementById('vulnerabilities-found-on-page-list').remove();
//       document.getElementById('no-vulnerabilities-found').remove();
//       document.getElementById('vulnerabilities-found-on-page').remove();
//     }
//   }
//
//   function availableNodes() {
//     return {
//       container: document.getElementById('vulnerabilities-found-on-page-list'),
//       noVulns: document.getElementById('no-vulnerabilities-found'),
//       vulnsOnPage: document.getElementById('vulnerabilities-found-on-page'),
//     }
//   }
//
//   it('renders a number of vulnerabilities equal to the number of traces provided', function() {
//     assert.equal(availableNodes().container.children.length, 1);
//     assert.equal(child.tagName, "LI");
//     assert.equal(child.className, "list-group-item no-border vulnerability-li vuln-1");
//     assert.equal(child.children.length, 2);
//   });
//
//   it('navigates to teamserver when a vulnerability is clicked', function() {
//     const anchor  = child.getElementsByTagName('a')[0];
//     anchor.click();
//     assert.isTrue(chrome.tabs.create.calledOnce);
//   });
//
//   it('orders the rendered vulnerabilities by severity', function() {
//     assert.equal(availableNodes().container.children.length, 1);
//     renderListItem(returnShortTraceDataLowSeverity, "teamserverURL", "org-uuid")
//     assert.equal(availableNodes().container.children.length, 2);
//
//     const child1 = availableNodes().container.children[1];
//
//     assert.ok(child.getElementsByTagName('img')[0].src.includes("critical"));
//     assert.ok(child1.getElementsByTagName('img')[0].src.includes("low"));
//   });
//
//   it('requests stored traces from background', function() {
//     getStorageVulnsAndRender({
//       teamserver_url: "url",
//       contrast_org_uuid: "uuid"
//     });
//     assert.ok(chrome.runtime.sendMessage.calledOnce);
//   });
//
//   it('shows no vulnerabilities found if trace request returns an empty list', function() {
//     chrome.runtime.sendMessage.yields({ traces: [] });
//
//     try {
//       getStorageVulnsAndRender({
//         teamserver_url: "url",
//         contrast_org_uuid: "uuid"
//       });
//       assert.isTrue(getStorageVulnsAndRender.calledOnce);
//     } catch (e) {
//       // console.log(e);
//       // assert.isTrue(chrome.runtime.sendMessage.threw());
//     }
//
//     assert.isTrue(availableNodes().noVulns.style.display === 'block');
//     assert.isTrue(availableNodes().vulnsOnPage.style.display === 'none');
//     assert.isTrue(chrome.runtime.sendMessage.calledOnce);
//   });
//
//   it('shows vulnerabilities found if trace request returns a non-empty list', function() {
//     let popSpy = sinon.spy(populateVulnerabilitySection);
//     chrome.runtime.sendMessage.yields({ traces });
//
//     try {
//       getStorageVulnsAndRender(items);
//       assert.isTrue(getStorageVulnsAndRender.calledOnce);
//       assert.isTrue(popSpy.calledWith(
//         traces,
//         teamserver_url,
//         contrast_org_uuid
//       ));
//     } catch (e) {
//       assert.isFalse(chrome.runtime.sendMessage.threw());
//     }
//
//     assert.isTrue(availableNodes().noVulns.style.display === 'none');
//     assert.isTrue(availableNodes().vulnsOnPage.style.display === 'block');
//     assert.isTrue(chrome.runtime.sendMessage.calledOnce);
//   });
//
//   it('can call done on promises', function(done) {
//     const promise = new Promise((resolve, reject) => {
//       resolve()
//     })
//     promise.then(() => {
//       assert.ok(true)
//       done();
//     })
//     .catch(done)
//   });
//
//   it('returns a promise that contains short vulnerabilities', function() {
//     const shorts = getShortVulnerabilities(traces, teamserver_url, contrast_org_uuid);
//     assert.isTrue(shorts.constructor.name === "Promise");
//   });
//
//   it('renders the short traces in the popup after receiving shortTraces', function() {
//
//     // 1 set in beforeEach
//     assert.isTrue(availableNodes().container.children.length === 1);
//
//     let shortStub = sinon.stub(popupMethods, 'getShortVulnerabilities');
//     const shortTraces = [returnShortTraceData, returnShortTraceDataLowSeverity];
//
//     shortStub.callsFake(function() {
//       return new Promise((resolve, reject) => {
//         resolve(shortTraces)
//       });
//     });
//
//     return shortStub()
//     .then(vulns => {
//       vulns.map(v => renderListItem(v));
//       assert.isTrue(availableNodes().container.children.length === 3);
//     });
//   });
//
// });
