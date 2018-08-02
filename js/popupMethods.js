/*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
/*global
*/
import {
  CONTRAST_RED,
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
  DELETE_TRACE,
  TRACES_REQUEST,
  getVulnerabilityTeamserverUrl,
  setElementDisplay,
  getVulnerabilityShort,
  deleteApplicationTraces,
  updateTabBadge,
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
    getShortVulnerabilities(traces)
    .then(sortedTraces => {
      sortedTraces.map(trace => renderListItem(trace, teamserverUrl, orgUuid, application));
    })
    .catch(new Error("Error rendering sorted traces into list items."));
  }
  // else {
  //   const vulnsOnPage  = document.getElementById("vulnerabilities-found-on-page");
  //   const noVulnsFound = document.getElementById("no-vulnerabilities-found");
  //   setElementDisplay(noVulnsFound, "block");
  //   setElementDisplay(vulnsOnPage, "none");
  // }
}

function getShortVulnerabilities(traces) {
  return Promise.all(traces.map(t => getVulnerabilityShort(t)))
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
function renderListItem(trace, teamserverUrl, orgUuid, application) {

  if (!trace) return;

  let ul = document.getElementById('vulnerabilities-found-on-page-list');
  let li = document.createElement('li');
  li.classList.add('no-border');
  li.classList.add('vulnerability-li');

  let img = document.createElement('img');

  switch (trace.severity) {
    case SEVERITY_NOTE:
      img.setAttribute("src", SEVERITY_NOTE_ICON_PATH);
      li.classList.add("vuln-5");
      break;
    case SEVERITY_LOW:
      img.setAttribute("src", SEVERITY_LOW_ICON_PATH);
      li.classList.add("vuln-4");
      break;
    case SEVERITY_MEDIUM:
      img.setAttribute("src", SEVERITY_MEDIUM_ICON_PATH);
      li.classList.add("vuln-3");
      break;
    case SEVERITY_HIGH:
      img.setAttribute("src", SEVERITY_HIGH_ICON_PATH);
      li.classList.add("vuln-2");
      break;
    case SEVERITY_CRITICAL:
      img.setAttribute("src", SEVERITY_CRITICAL_ICON_PATH);
      li.classList.add("vuln-1");
      break;
    default:
      break;
  }
  li.appendChild(img);

  // Teamserver returns camelCase vs snake_case depending on endpoint
  const ruleName = trace.ruleName || trace.rule_name;

  const anchor = document.createElement('a');
  anchor.classList.add('vulnerability-rule-name');
  anchor.innerText = " " + ruleName.split('-').join(' ').titleize();
  anchor.onclick = function() {
    chrome.tabs.create({
      url: getVulnerabilityTeamserverUrl(teamserverUrl, orgUuid, trace.uuid),
      active: false
    });
  }
  li.appendChild(anchor);

  _addTrashIcon(li, trace, application);

  // append li last to load content smootly (is the way it works?)
  ul.appendChild(li);
}

function _addTrashIcon(li, trace, application) {
  let trash = document.createElement('img');
  trash.setAttribute('src', '../img/trash.svg');
  trash.classList.add('trash-icon');
  trash.onclick = function() {
    deleteApplicationTraces([trace.uuid], trace.app_id)
    .then(json => {
      if (json && json.success) {
        li.remove();
        _updateTabBadge(application, trace.uuid);
      } else {
        console.log("ERROR deleting trace", json);
      }
    })
    .catch(error => {
      console.log("ERROR deleting trace", error);
    })
  }
  li.appendChild(trash);
}

function _updateTabBadge(application, traceUuid) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) return;
    const tab = tabs[0];

    chrome.runtime.sendMessage({
      action: DELETE_TRACE,
      tab,
      application,
      traceUuid
    });

    chrome.browserAction.getBadgeText({ tabId: tab.id }, (currentBadgeText) => {
      console.log("CURRENT BADGE TEXT", currentBadgeText);
      const currentBadgeValue = parseInt(currentBadgeText, 10);

      console.log("CURRENT BADGE VALUE", currentBadgeValue);
      if (!currentBadgeValue) return;

      if ((currentBadgeValue - 1) === 0) {
        const noVulnsFound = document.getElementById("no-vulnerabilities-found");
        const vulnsOnPage  = document.getElementById("vulnerabilities-found-on-page");
        setElementDisplay(noVulnsFound, "block");
        setElementDisplay(vulnsOnPage, "none");
      }

      updateTabBadge(tab, (currentBadgeValue - 1).toString(), CONTRAST_RED);
    });
  });
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



export {
  populateVulnerabilitySection,
  renderListItem,
  getStorageVulnsAndRender,
  getShortVulnerabilities,
}
