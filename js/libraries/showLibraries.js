import { Helpers } from '../helpers/helpers-module.js';

const {
  SEVERITY,
  SEVERITY_LOW,
  SEVERITY_LOW_ICON_PATH,
  SEVERITY_MEDIUM,
  SEVERITY_MEDIUM_ICON_PATH,
  SEVERITY_HIGH,
  SEVERITY_HIGH_ICON_PATH,
} = Helpers;

export function renderVulnerableLibraries(libraries) {
  console.log(libraries);
  if (!libraries || libraries.length === 0) return;

  document.getElementById('libs-not-configured').style.display = "none";
  document.getElementById('libs-no-vulnerabilities-found').style.display = "none";

  const container = document.getElementById('libs-vulnerabilities-found-on-page');
  const ul = document.getElementById('libs-vulnerabilities-found-on-page-list');

  libraries = libraries.sort((a, b) => {
    return SEVERITY[a.severity.titleize()] < SEVERITY[b.severity.titleize()];
  });

  for (let i = 0, len = libraries.length; i < len; i++) {
    let lib = libraries[i];
    let { name, version, severity, title, link } = lib;

    console.log(name, version, severity, title, link);

    console.log(ul);

    let li = document.createElement('li');
    li.classList.add('list-group-item');
    li.classList.add('no-border');
    li.classList.add('vulnerability-li');

    let img = document.createElement('img');

    switch (severity.toLowerCase()) {
      case SEVERITY_LOW.toLowerCase():
        img.setAttribute("src", SEVERITY_LOW_ICON_PATH);
        li.classList.add("vuln-4");
        break;
      case SEVERITY_MEDIUM.toLowerCase():
        img.setAttribute("src", SEVERITY_MEDIUM_ICON_PATH);
        li.classList.add("vuln-3");
        break;
      case SEVERITY_HIGH.toLowerCase():
        img.setAttribute("src", SEVERITY_HIGH_ICON_PATH);
        li.classList.add("vuln-2");
        break;
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
    anchor.innerText = title;
    anchor.onclick = function() {
      chrome.tabs.create({
        url: link,
        active: false
      });
    }
    li.appendChild(titleSpan);
    li.appendChild(anchor);

    // append li last to load content smootly (is the way it works?)
    ul.appendChild(li);
  }
  container.style.display = "block";
}
