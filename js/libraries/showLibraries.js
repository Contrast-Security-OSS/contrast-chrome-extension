import {
  SEVERITY,
  SEVERITY_LOW,
  SEVERITY_MEDIUM,
  SEVERITY_HIGH,
  CONTRAST__STORED_APP_LIBS,
  SEVERITY_BACKGROUND_COLORS,
  SEVERITY_TEXT_COLORS,
  isEmptyObject,
  capitalize,
} from '../util.js';

import Application from '../models/Application.js';

const getLibrariesFromStorage = (tab, application) => {
  return new Promise((resolve, reject) => {
    const appKey = "APP_LIBS__ID_" + application.domain;
    chrome.storage.local.get(CONTRAST__STORED_APP_LIBS, (result) => {
      if (isEmptyObject(result)) {
        resolve(null);
      } else {
        const libraries = result[CONTRAST__STORED_APP_LIBS][appKey];
        resolve(libraries);
      }
      reject(new Error("result was", typeof result));
    });
  });
}

const _getTabAndApplication = () => {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, async(tabs) => {
      const tab = tabs[0];
      if (!tab) {
        reject(new Error("Tab is null"));
        return;
      }
      const application = await Application.retrieveApplicationFromStorage(tab);
      resolve({ tab, application });
    });
  });
}

const renderVulnerableLibraries = async(tab, application) => {
  if (!tab || !application) {
    const tabAndApp = await _getTabAndApplication();
    tab = tabAndApp.tab;
    application = tabAndApp.application;
  }
  let libraries = await getLibrariesFromStorage(tab, application);

  if (!libraries || libraries.length === 0) return;

  const container = document.getElementById('libs-vulnerabilities-found-on-page');
  const ul = document.getElementById('libs-vulnerabilities-found-on-page-list');

  libraries = libraries.sort((a, b) => {
    if (!a.severity && b.severity) {
      return 1;
    } else if (a.severity && !b.severity) {
      return -1;
    } else if (!a.severity && !b.severity) {
      return 0;
    }
    return SEVERITY[b.severity.titleize()] - SEVERITY[a.severity.titleize()];
  });

  let listItemTexts = [];
  for (let i = 0, len = libraries.length; i < len; i++) {
    let lib = libraries[i];
    if (!lib) continue;
    for (let j = 0; j < lib.vulnerabilitiesCount; j++) {
      if (!lib.vulnerabilities) continue;
      let vulnObj     = lib.vulnerabilities[j];
          vulnObj.title = _vulnObjTitle(vulnObj);
      // vulnObj.version = _setVulnerabilityVersion(vulnObj);
      let name = vulnObj.name || lib.name;
      if (!listItemTexts.includes(vulnObj.title + name)) {
        _createVulnerabilityListItem(ul, lib.name, vulnObj);
        listItemTexts.push(vulnObj.title + name);
      }
    }
  }

  container.classList.remove('hidden');
  container.classList.add('visible');
}

const _vulnObjTitle = (vulnObj) => {
  let title = vulnObj.title;
  if (!title) {
    title = vulnObj.identifiers;
    if (typeof title !== 'string') {
      return title.summary;
    }
    return title;
  }
  return title;
}

// NOTE: Leave for now, not sure if version should be included
//
// const versionTypes = {
//   atOrAbove: ">=",
//   atOrBelow: "<=",
//   below: "<",
//   above: ">",
// }
//
// const _setVulnerabilityVersion = (vulnObj) => {
//   let versions = vulnObj.versions || vulnObj;
//   let version  = [];
//   try {
//     let keys = Object.keys(versions);
//     let vals = Object.values(versions);
//     for (let k = keys.length, kLen = -1; k > kLen; k--) {
//       if (versionTypes[keys[k]]) {
//         version.push(
//           `${versionTypes[keys[k]]} ${vals[k]}`);
//       }
//     }
//   } catch (e) { e }
//
//   if (version.length > 1) {
//     version = version.join(" and ");
//   } else {
//     version = version[0];
//   }
//   return version;
// }

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

const _createVulnerabilityListItem = (ul, libName, vulnObj) => {
  let { name, severity, title, link } = vulnObj;
  if (!name) {
    name = libName;
    name = name.titleize();
  }

  let li = document.createElement('li');
  li.classList.add('list-group-item');
  li.classList.add('no-border');
  li.classList.add('vulnerability-li');

  switch (severity.toLowerCase()) {
    case SEVERITY_LOW.toLowerCase(): {
      createBadge(SEVERITY_LOW, li);
      break;
    }
    case SEVERITY_MEDIUM.toLowerCase(): {
      createBadge(SEVERITY_MEDIUM, li);
      break;
    }
    case SEVERITY_HIGH.toLowerCase(): {
      createBadge(SEVERITY_HIGH, li);
      break;
    }
    default:
      break;
  }

  name = name.replace('Jquery', 'JQuery');

  let anchor = document.createElement('a');
  anchor.classList.add('vulnerability-link');
  anchor.classList.add('vulnerability-rule-name');
  anchor.innerText = name + ":  " + capitalize(title.trim()); // + version
  anchor.onclick = function() {
    chrome.tabs.create({
      url: link,
      active: false
    });
  }
  li.appendChild(anchor);

  ul.appendChild(li);
}

export {
  renderVulnerableLibraries,
}
