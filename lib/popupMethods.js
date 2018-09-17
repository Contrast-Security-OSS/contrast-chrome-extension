'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getShortVulnerabilities = exports.getStorageVulnsAndRender = exports.renderListItem = exports.populateVulnerabilitySection = exports.hideLoadingIcon = undefined;

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _util = require('./util.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function hideLoadingIcon() {
  var loading = document.getElementById('vulns-loading');
  loading.style.display = 'none';
}

/**
 * populateVulnerabilitySection - Get details about each trace from teamserver and then render each of them as a list item in the extension popup
 *
 * @param  {Array<String>} traces Trace uuids sent to teamserver for more info
 * @param  {String} teamserverUrl The url of the TS environment we're using
 * @param  {String} orgUuid       The uuid of our org
 * @return {void}                 Renders a list of vulnerabilities
 */
/*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
/*global
*/
function populateVulnerabilitySection(traces, teamserverUrl, orgUuid, application) {
  if (traces.length > 0) {
    // NOTE: Elements set to display show in getStorageVulnsAndRender
    getShortVulnerabilities(traces, application.id).then(function (sortedTraces) {
      hideLoadingIcon();
      sortedTraces.map(function (trace) {
        return renderListItem(trace, teamserverUrl, orgUuid, application);
      });
    }).catch(new Error("Error rendering sorted traces into list items."));
  }
}

function getShortVulnerabilities(traces, appID) {
  return _promise2.default.all(traces.map(function (t) {
    return (0, _util.getVulnerabilityShort)(t, appID);
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

  switch (trace.severity) {
    case _util.SEVERITY_NOTE:
      createBadge(_util.SEVERITY_NOTE, li);
      break;
    case _util.SEVERITY_LOW:
      createBadge(_util.SEVERITY_LOW, li);
      break;
    case _util.SEVERITY_MEDIUM:
      createBadge(_util.SEVERITY_MEDIUM, li);
      break;
    case _util.SEVERITY_HIGH:
      createBadge(_util.SEVERITY_HIGH, li);
      break;
    case _util.SEVERITY_CRITICAL:
      createBadge(_util.SEVERITY_CRITICAL, li);
      break;
    default:
      break;
  }

  // Teamserver returns camelCase vs snake_case depending on endpoint
  // const ruleName = trace.ruleName || trace.rule_name;

  var anchor = document.createElement('a');
  anchor.classList.add('vulnerability-link');
  anchor.classList.add('vulnerability-rule-name');
  anchor.innerText = trace.title; //" " + ruleName.split('-').join(' ').titleize();
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
  console.log("getting stored vulns");
  chrome.runtime.sendMessage({ action: _util.TRACES_REQUEST, application: application, tab: tab }, function (response) {
    if (response && response.traces && response.traces.length > 0) {
      (0, _util.setElementDisplay)(noVulnsFound, "none");
      (0, _util.setElementDisplay)(vulnsOnPage, "block");

      populateVulnerabilitySection(response.traces, items[_util.TEAMSERVER_URL], items[_util.CONTRAST_ORG_UUID], application);
    } else {
      hideLoadingIcon();
      (0, _util.setElementDisplay)(noVulnsFound, "block");
      (0, _util.setElementDisplay)(vulnsOnPage, "none");
    }
  });
}

var createBadge = function createBadge(severity, li) {
  var parent = document.createElement('div');
  parent.classList.add('parent-badge');

  var child = document.createElement('div');
  child.classList.add('child-badge');
  child.innerText = severity;
  child.style.color = _util.SEVERITY_TEXT_COLORS[severity];

  parent.style.backgroundColor = _util.SEVERITY_BACKGROUND_COLORS[severity];

  parent.appendChild(child);
  li.appendChild(parent);
};

exports.hideLoadingIcon = hideLoadingIcon;
exports.populateVulnerabilitySection = populateVulnerabilitySection;
exports.renderListItem = renderListItem;
exports.getStorageVulnsAndRender = getStorageVulnsAndRender;
exports.getShortVulnerabilities = getShortVulnerabilities;