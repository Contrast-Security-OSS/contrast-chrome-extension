/*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
/*global
*/
import {
  CONTRAST_ORG_UUID,
  TEAMSERVER_URL,
  SEVERITY_NOTE,
  SEVERITY_LOW,
  SEVERITY_MEDIUM,
  SEVERITY_HIGH,
  SEVERITY_CRITICAL,
  SEVERITY,
  SEVERITY_NOTE_ICON_PATH,
  SEVERITY_LOW_ICON_PATH,
  SEVERITY_MEDIUM_ICON_PATH,
  SEVERITY_HIGH_ICON_PATH,
  SEVERITY_CRITICAL_ICON_PATH,
  SEVERITY_BACKGROUND_COLORS,
  SEVERITY_TEXT_COLORS,
  TRACES_REQUEST,
  getVulnerabilityTeamserverUrl,
  setElementDisplay,
  getVulnerabilityShort,
} from './util.js';



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
    getShortVulnerabilities(traces, application.id)
    .then(sortedTraces => {
      sortedTraces.map(trace => renderListItem(trace, teamserverUrl, orgUuid, application));
    })
    .catch(new Error("Error rendering sorted traces into list items."));
  }
}

// rule + from what + on which page

function getShortVulnerabilities(traces, appID) {
  return Promise.all(traces.map(t => getVulnerabilityShort(t, appID)))
  .then(shortTraces => {
    return shortTraces.map(t => t.trace).sort((a, b) => {
      return SEVERITY[b.severity] - SEVERITY[a.severity];
    });
  })
  .catch(new Error("Error getting and rendering vulnerabilities"));
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

  let ul = document.getElementById('vulnerabilities-found-on-page-list');
  let li = document.createElement('li');
  li.classList.add('no-border');
  li.classList.add('vulnerability-li');

  // let img = document.createElement('img');

  switch (trace.severity) {
    case SEVERITY_NOTE:
      createBadge(SEVERITY_NOTE, li);
      // img.setAttribute("src", SEVERITY_NOTE_ICON_PATH);
      // li.classList.add("vuln-5");
      break;
    case SEVERITY_LOW:
      createBadge(SEVERITY_LOW, li);
      // img.setAttribute("src", SEVERITY_LOW_ICON_PATH);
      // li.classList.add("vuln-4");
      break;
    case SEVERITY_MEDIUM:
      createBadge(SEVERITY_MEDIUM, li);
      // img.setAttribute("src", SEVERITY_MEDIUM_ICON_PATH);
      // li.classList.add("vuln-3");
      break;
    case SEVERITY_HIGH:
      createBadge(SEVERITY_HIGH, li);
      // img.setAttribute("src", SEVERITY_HIGH_ICON_PATH);
      // li.classList.add("vuln-2");
      break;
    case SEVERITY_CRITICAL:
      createBadge(SEVERITY_CRITICAL, li);
      // img.setAttribute("src", SEVERITY_CRITICAL_ICON_PATH);
      // li.classList.add("vuln-1");
      break;
    default:
      break;
  }
  // li.appendChild(img);

  // Teamserver returns camelCase vs snake_case depending on endpoint
  // const ruleName = trace.ruleName || trace.rule_name;

  const anchor = document.createElement('a');
  anchor.classList.add('vulnerability-link');
  anchor.classList.add('vulnerability-rule-name');
  anchor.innerText = trace.title; //" " + ruleName.split('-').join(' ').titleize();
  anchor.onclick = function() {
    chrome.tabs.create({
      url: getVulnerabilityTeamserverUrl(teamserverUrl, orgUuid, trace.uuid),
      active: false
    });
  }
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
  const noVulnsFound = document.getElementById("no-vulnerabilities-found");
  const vulnsOnPage  = document.getElementById("vulnerabilities-found-on-page");
  chrome.runtime.sendMessage({ action: TRACES_REQUEST, application, tab }, (response) => {
    if (response && response.traces && response.traces.length > 0) {
      setElementDisplay(noVulnsFound, "none");
      setElementDisplay(vulnsOnPage, "block");

      populateVulnerabilitySection(
        response.traces, items[TEAMSERVER_URL], items[CONTRAST_ORG_UUID], application);
    } else {
      setElementDisplay(noVulnsFound, "block");
      setElementDisplay(vulnsOnPage, "none");
    }
  });
}

const createBadge = (severity, li) => {
  let parent = document.createElement('div');
  parent.classList.add('parent-badge');

  let child = document.createElement('div');
  child.classList.add('child-badge');
  child.innerText = severity;
  child.style.color = SEVERITY_TEXT_COLORS[severity];

  parent.style.backgroundColor = SEVERITY_BACKGROUND_COLORS[severity];

  parent.appendChild(child);
  li.appendChild(parent);
}


export {
  populateVulnerabilitySection,
  renderListItem,
  getStorageVulnsAndRender,
  getShortVulnerabilities,
}
