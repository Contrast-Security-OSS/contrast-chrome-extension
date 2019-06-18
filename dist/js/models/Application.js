import{STORED_APPS_KEY,CONTRAST_GREEN,getHostFromUrl,isBlacklisted,updateTabBadge,updateExtensionIcon,isEmptyObject}from"../util.js";export default function Application(e,r){this[e]=r.app_id,this.id=r.app_id,this.name=r.name,this.domain=e,this.host=e}Application.retrieveApplicationFromStorage=function(e){return new Promise((r,t)=>{chrome.storage.local.get(STORED_APPS_KEY,i=>{chrome.runtime.lastError&&t(new Error("Error retrieving stored applications")),i&&i[STORED_APPS_KEY]||(i={[STORED_APPS_KEY]:[]});const n=new URL(e.url),o=getHostFromUrl(n),a=i[STORED_APPS_KEY].filter(e=>e.host===o)[0];if(a){if(a&&a.name){const e=document.getElementById("scan-libs-text");e&&(e.innerText=`Current Application:\n${a.name.trim()}`)}r(a)}else{if(isBlacklisted(e.url)||chrome.runtime.lastError){if(isBlacklisted(e.url)&&!chrome.runtime.lastError)try{updateExtensionIcon(e,1),updateTabBadge(e,"",CONTRAST_GREEN)}catch(e){t(new Error("Error updating tab badge"))}}else try{updateExtensionIcon(e,1),updateTabBadge(e,"")}catch(e){t(new Error("Error updating tab badge"))}r(null)}})})},Application.getStoredApp=function(e,r){if(!r)throw new Error("application must be defined");if(isEmptyObject(e))return;return(e[STORED_APPS_KEY]||e).filter(e=>e.id===r.app_id)[0]},Application.subDomainColonForUnderscore=function(e){return"object"==typeof e?this._subColonOrUnderscore(e.domain):this._subColonOrUnderscore(e)},Application._subColonOrUnderscore=function(e){return e.includes("_")?e.replace("_",":"):e.includes(":")?e.replace(":","_"):e};