import{getStoredCredentials,isCredentialed}from"./util.js";import Application from"./models/Application.js";import ApplicationTable from"./models/ApplicationTable.js";import Config from"./models/Config.js";export function indexFunction(){chrome.tabs.query({active:!0,currentWindow:!0},e=>{const n=e[0],t=new URL(n.url);getStoredCredentials().then(async e=>{const o=isCredentialed(e),i=await Application.retrieveApplicationFromStorage(n),r=new Config(n,t,o,e,!!i);if(r.addListenerToConfigButton(),r.popupScreen(),o){if(o&&r._isContrastPage()){new ApplicationTable(t).renderApplicationsMenu(),r.setGearIcon(),r.renderContrastUsername()}else if(r.setGearIcon(),r.renderContrastUsername(),!r._isContrastPage()){const e=new ApplicationTable(t);e.renderActivityFeed(),r.hasApp&&e.renderApplicationsMenu()}}else console.log("Please Configure the Extension")}).catch(e=>new Error(e))})}document.addEventListener("DOMContentLoaded",indexFunction,!1);