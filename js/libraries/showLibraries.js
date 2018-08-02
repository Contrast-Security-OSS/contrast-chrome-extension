import {
  SEVERITY,
  SEVERITY_LOW,
  SEVERITY_LOW_ICON_PATH,
  SEVERITY_MEDIUM,
  SEVERITY_MEDIUM_ICON_PATH,
  SEVERITY_HIGH,
  SEVERITY_HIGH_ICON_PATH,
  CONTRAST__STORED_APP_LIBS,
  isEmptyObject,
  capitalize,
} from '../util.js';

import Application from '../models/Application.js';

const versionTypes = {
  atOrAbove: ">=",
  atOrBelow: "<=",
  below: "<",
  above: ">",
}

const getLibrariesFromStorage = (tab, application) => {
  return new Promise((resolve, reject) => {
    const appKey = "APP_LIBS__ID_" + application.domain;
    // console.log("APPKEY", appKey);
    chrome.storage.local.get(CONTRAST__STORED_APP_LIBS, (result) => {
      // console.log("GOT STORED LIBS RESULT", result);
      if (isEmptyObject(result)) {
        resolve(null);
      } else {
        const libraries = result[CONTRAST__STORED_APP_LIBS][appKey];
        // console.log("GOT LIBRARIES IN getLibrariesFromStorage", libraries);
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

  document.getElementById('libs-not-configured').style.display = "none";
  document.getElementById('libs-no-vulnerabilities-found').style.display = "none";

  const container = document.getElementById('libs-vulnerabilities-found-on-page');
  const ul = document.getElementById('libs-vulnerabilities-found-on-page-list');

  libraries = libraries.sort((a, b) => {
    if (!a.severity && !!b.severity) {
      return a < b;
    } else if (!!a.severity && !b.severity) {
      return b < a;
    } else if (!a.severity && !b.severity) {
      return a === b;
    }
    return SEVERITY[a.severity.titleize()] < SEVERITY[b.severity.titleize()];
  });

  // console.log("LIBRARIES AFTER SORT", libraries);

  for (let i = 0, len = libraries.length; i < len; i++) {
    let lib = libraries[i];
    // console.log("LIB", lib);
    if (lib.vulnerabilitiesCount > 1) {
      for (let j = 0; j < lib.vulnerabilitiesCount; j++) {
        let versions = lib.vulnerabilities[j].versions;
        let keys = Object.keys(versions);
        let vals = Object.values(versions);
        let version = [];
        for (let k = 0, kLen = keys.length; k < kLen; k++) {
          version.push(
            `${versionTypes[keys[k]]} ${vals[k]}`);
        }
        if (version.length > 1) {
          version = version.join(" and ");
        } else {
          version = version[0];
        }
        lib.vulnerabilities[j].version = version;
        _createVulnerabilityListItem(ul, lib.name, lib.vulnerabilities[j]);
      }
    } else {
      _createVulnerabilityListItem(ul, lib.name, lib);
    }
  }
  container.style.display = "block";
}

const _createVulnerabilityListItem = (ul, libName, vulnObj) => {
  let { name, version, severity, title, link } = vulnObj;
  if (!name) name = libName;
             name = name.titleize();

  let li = document.createElement('li');
  li.classList.add('list-group-item');
  li.classList.add('no-border');
  li.classList.add('vulnerability-li');

  let img = document.createElement('img');

  switch (severity.toLowerCase()) {
    case SEVERITY_LOW.toLowerCase(): {
      img.setAttribute("src", SEVERITY_LOW_ICON_PATH);
      li.classList.add("vuln-4");
      break;
    }
    case SEVERITY_MEDIUM.toLowerCase(): {
      img.setAttribute("src", SEVERITY_MEDIUM_ICON_PATH);
      li.classList.add("vuln-3");
      break;
    }
    case SEVERITY_HIGH.toLowerCase(): {
      img.setAttribute("src", SEVERITY_HIGH_ICON_PATH);
      li.classList.add("vuln-2");
      break;
    }
    default:
      break;
  }
  li.appendChild(img);

  let titleSpan = document.createElement('span');
  titleSpan.classList.add('vulnerability-rule-name');
  titleSpan.innerText = " " + name + " " + version + "\n";
  titleSpan.style.weight = 'bold';

  let anchor = document.createElement('a');
  anchor.classList.add('vulnerability-rule-name');
  // console.log("TITLE", title);
  anchor.innerText = capitalize(title.trim()) + ".";
  anchor.onclick = function() {
    chrome.tabs.create({
      url: link,
      active: false
    });
  }
  li.appendChild(titleSpan);
  li.appendChild(anchor);

  ul.appendChild(li);
}

export {
  renderVulnerableLibraries,
}
