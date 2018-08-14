"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getShortVulnerabilities = exports.getStorageVulnsAndRender = exports.renderListItem = exports.populateVulnerabilitySection = undefined;

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _util = require("./util.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * populateVulnerabilitySection - Get details about each trace from teamserver and then render each of them as a list item in the extension popup
 *
 * @param  {Array<String>} traces Trace uuids sent to teamserver for more info
 * @param  {String} teamserverUrl The url of the TS environment we're using
 * @param  {String} orgUuid       The uuid of our org
 * @return {void}                 Renders a list of vulnerabilities
 */
function populateVulnerabilitySection(traces, teamserverUrl, orgUuid, application) {
  if (traces.length > 0) {
    // NOTE: Elements set to display show in getStorageVulnsAndRender
    getShortVulnerabilities(traces).then(function (sortedTraces) {
      sortedTraces.map(function (trace) {
        return renderListItem(trace, teamserverUrl, orgUuid, application);
      });
    }).catch(new Error("Error rendering sorted traces into list items."));
  }
} /*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
/*global
*/


function getShortVulnerabilities(traces) {
  return _promise2.default.all(traces.map(function (t) {
    return (0, _util.getVulnerabilityShort)(t);
  })).then(function (shortTraces) {
    return shortTraces.map(function (t) {
      return t.trace;
    }).sort(function (a, b) {
      return _util.SEVERITY[b.severity] - _util.SEVERITY[a.severity];
    });
  }).catch(new Error("Error getting and rendering vulnerabilities"));
}

/**
 * renderListItem - Renders details about a vulnerability as a list item
 *
 * @param  {Object} shortTrace    Details about a vulnerability
 * @param  {String} teamserverUrl The url of the TS environment we're using
 * @param  {String} orgUuid       The uuid of our org
 * @return {void}                 a new list item
 */
function renderListItem(trace, teamserverUrl, orgUuid) {

  if (!trace) return;

  var ul = document.getElementById('vulnerabilities-found-on-page-list');
  var li = document.createElement('li');
  li.classList.add('no-border');
  li.classList.add('vulnerability-li');

  var img = document.createElement('img');

  switch (trace.severity) {
    case _util.SEVERITY_NOTE:
      img.setAttribute("src", _util.SEVERITY_NOTE_ICON_PATH);
      li.classList.add("vuln-5");
      break;
    case _util.SEVERITY_LOW:
      img.setAttribute("src", _util.SEVERITY_LOW_ICON_PATH);
      li.classList.add("vuln-4");
      break;
    case _util.SEVERITY_MEDIUM:
      img.setAttribute("src", _util.SEVERITY_MEDIUM_ICON_PATH);
      li.classList.add("vuln-3");
      break;
    case _util.SEVERITY_HIGH:
      img.setAttribute("src", _util.SEVERITY_HIGH_ICON_PATH);
      li.classList.add("vuln-2");
      break;
    case _util.SEVERITY_CRITICAL:
      img.setAttribute("src", _util.SEVERITY_CRITICAL_ICON_PATH);
      li.classList.add("vuln-1");
      break;
    default:
      break;
  }
  li.appendChild(img);

  // Teamserver returns camelCase vs snake_case depending on endpoint
  var ruleName = trace.ruleName || trace.rule_name;

  var anchor = document.createElement('a');
  anchor.classList.add('vulnerability-rule-name');
  anchor.innerText = " " + ruleName.split('-').join(' ').titleize();
  anchor.onclick = function () {
    chrome.tabs.create({
      url: (0, _util.getVulnerabilityTeamserverUrl)(teamserverUrl, orgUuid, trace.uuid),
      active: false
    });
  };
  li.appendChild(anchor);

  // append li last to load content smootly (is the way it works?)
  ul.appendChild(li);
}

/**
 * getStorageVulnsAndRender - gets stored traces from background, renders the vulnerability section of the popup and sends the vulnerabilities to populateVulnerabilitySection for rendering into a list
 *
 * @param  {Object} items - credentials
 * @return {void}
 */
function getStorageVulnsAndRender(items, application, tab) {
  var noVulnsFound = document.getElementById("no-vulnerabilities-found");
  var vulnsOnPage = document.getElementById("vulnerabilities-found-on-page");
  chrome.runtime.sendMessage({ action: _util.TRACES_REQUEST, application: application, tab: tab }, function (response) {
    if (response && response.traces && response.traces.length > 0) {
      (0, _util.setElementDisplay)(noVulnsFound, "none");
      (0, _util.setElementDisplay)(vulnsOnPage, "block");

      populateVulnerabilitySection(response.traces, items[_util.TEAMSERVER_URL], items[_util.CONTRAST_ORG_UUID], application);
    } else {
      (0, _util.setElementDisplay)(noVulnsFound, "block");
      (0, _util.setElementDisplay)(vulnsOnPage, "none");
    }
  });
}

exports.populateVulnerabilitySection = populateVulnerabilitySection;
exports.renderListItem = renderListItem;
exports.getStorageVulnsAndRender = getStorageVulnsAndRender;
exports.getShortVulnerabilities = getShortVulnerabilities;