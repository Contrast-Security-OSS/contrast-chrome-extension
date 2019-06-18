import{CONTRAST_ORG_UUID,TEAMSERVER_URL,SEVERITY_NOTE,SEVERITY_LOW,SEVERITY_MEDIUM,SEVERITY_HIGH,SEVERITY_CRITICAL,SEVERITY,SEVERITY_BACKGROUND_COLORS,SEVERITY_TEXT_COLORS,TRACES_REQUEST,getVulnerabilityTeamserverUrl,setElementDisplay,getVulnerabilityShort}from"./util.js";function hideLoadingIcon(){document.getElementById("vulns-loading").style.display="none"}function populateVulnerabilitySection(e,t,n,i){e.length>0&&getShortVulnerabilities(e,i.id).then(e=>{hideLoadingIcon(),e.map(e=>renderListItem(e,t,n,i))}).catch(new Error("Error rendering sorted traces into list items."))}function getShortVulnerabilities(e,t){return Promise.all(e.map(e=>getVulnerabilityShort(e,t))).then(e=>e.map(e=>e.trace).sort((e,t)=>SEVERITY[t.severity]-SEVERITY[e.severity])).catch(new Error("Error getting and rendering vulnerabilities"))}function renderListItem(e,t,n){if(!e)return;let i=document.getElementById("vulnerabilities-found-on-page-list"),a=document.createElement("li");switch(a.classList.add("no-border"),a.classList.add("vulnerability-li"),e.severity){case SEVERITY_NOTE:createBadge(SEVERITY_NOTE,a);break;case SEVERITY_LOW:createBadge(SEVERITY_LOW,a);break;case SEVERITY_MEDIUM:createBadge(SEVERITY_MEDIUM,a);break;case SEVERITY_HIGH:createBadge(SEVERITY_HIGH,a);break;case SEVERITY_CRITICAL:createBadge(SEVERITY_CRITICAL,a)}const r=document.createElement("a");r.classList.add("vulnerability-link"),r.classList.add("vulnerability-rule-name"),r.innerText=e.title,r.onclick=function(){chrome.tabs.create({url:getVulnerabilityTeamserverUrl(t,n,e.uuid),active:!1})},a.appendChild(r),i.appendChild(a)}function getStorageVulnsAndRender(e,t,n){const i=document.getElementById("no-vulnerabilities-found"),a=document.getElementById("vulnerabilities-found-on-page");chrome.runtime.sendMessage({action:TRACES_REQUEST,application:t,tab:n},n=>{n&&n.traces&&n.traces.length>0?(setElementDisplay(i,"none"),setElementDisplay(a,"block"),populateVulnerabilitySection(n.traces,e[TEAMSERVER_URL],e[CONTRAST_ORG_UUID],t)):(hideLoadingIcon(),setElementDisplay(i,"block"),setElementDisplay(a,"none"))})}const createBadge=(e,t)=>{let n=document.createElement("div");n.classList.add("parent-badge");let i=document.createElement("div");i.classList.add("child-badge"),i.innerText=e,i.style.color=SEVERITY_TEXT_COLORS[e],n.style.backgroundColor=SEVERITY_BACKGROUND_COLORS[e],n.appendChild(i),t.appendChild(n)};export{hideLoadingIcon,populateVulnerabilitySection,renderListItem,getStorageVulnsAndRender,getShortVulnerabilities};