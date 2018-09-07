/*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
import {
  CONTRAST_RED,
  CONTRAST_GREEN,
  setElementText,
  setElementDisplay,
  changeElementVisibility,
  hideElementAfterTimeout,
  APPLICATION_CONNECTED,
} from '../util.js'

import Application from './Application.js';
import ConnectedDomain from './ConnectedDomain.js'

const CONNECT_BUTTON_TEXT     = "Click to Connect";
const CONNECT_SUCCESS_MESSAGE = "Successfully connected. Please reload the page.";
const CONNECT_FAILURE_MESSAGE = "Error connecting. Try refreshing the page.";
// const DISCONNECT_SUCCESS_MESSAGE = "Successfully Disconnected";
const DISCONNECT_FAILURE_MESSAGE = "Error Disconnecting";
const DISCONNECT_BUTTON_TEXT     = "Disconnect";

const CONTRAST_BUTTON_CLASS = "btn btn-primary btn-xs btn-contrast-plugin";

export default function TableRow(application, url, table) {
  this.application  = application;
  this.url          = url;
  this.table        = table;
  this.host         = "";
  this.row          = document.createElement('tr');
  this.nameTD       = document.createElement('td');
  this.appIdTD      = document.createElement('td');
  this.domainTD     = document.createElement('td');
  this.disconnectTD = document.createElement('td');
}

TableRow.prototype.setHost = function(host) {
  this.host = host;
}

// DOM STUFF

TableRow.prototype.appendChildren = function() {
  this.table.appendChild(this.row);
  this.row.appendChild(this.nameTD);
  this.row.appendChild(this.domainTD);
  this.row.appendChild(this.appIdTD);
  this.row.appendChild(this.disconnectTD);
}

TableRow.prototype.setAppId = function() {
  setElementText(this.appIdTD, this.application.app_id);
  setElementDisplay(this.appIdTD, "none");
}

TableRow.prototype.createConnectButton = function() {
  const domainTD  = this.domainTD;
  const domainBtn = document.createElement('button');

  domainBtn.setAttribute('class', `${CONTRAST_BUTTON_CLASS} domainBtn`);
  domainTD.appendChild(domainBtn);

  setElementText(domainBtn, CONNECT_BUTTON_TEXT);
  setElementText(this.nameTD, this.application.name.titleize());

  domainBtn.addEventListener('click', () => {
    const cd = new ConnectedDomain(this.host, this.application);
    cd.connectDomain()
    .then(connected => this._showMessage(connected, true))
    .catch((error) => this._handleConnectError(error));
  });
}

// REMOVE DOMAIN

TableRow.prototype.renderDisconnect = function(storedApps, storedApp) {
  // const domain           = connected._getDomainFromApplication();
  const disconnectButton = document.createElement('button');
  const connected        = new ConnectedDomain(this.host, storedApp);

  setElementText(this.domainTD, Application.subDomainColonForUnderscore(this.host));
  setElementText(disconnectButton, DISCONNECT_BUTTON_TEXT);

  disconnectButton.setAttribute('class', CONTRAST_BUTTON_CLASS);
  disconnectButton.addEventListener('click', () => {
    console.log("disconnecting");
    connected.disconnectDomain(this)
    .then(disconnected => {
      if (disconnected) {
        this.removeDomainAndButton();
      } else {
        throw new Error("Error Disconnecting Domain");
      }
    })
    .catch(error => this._handleConnectError(error));
  });
  this.disconnectTD.appendChild(disconnectButton);
}

TableRow.prototype.removeDomainAndButton = function() {
  this.domainTD.innerHTML = "";
  this.disconnectTD.innerHTML = "";
}

// HELPERS

TableRow.prototype._showMessage = function(result, connect) {
  const message = document.getElementById("connected-domain-message");
  changeElementVisibility(message);
  if (result && connect) {
    this._successConnect(message);
    message.setAttribute('style', `color: ${CONTRAST_GREEN}`);
    // hideElementAfterTimeout(message);
  } else if (!result && connect) {
    this._failConnect(message);
    message.setAttribute('style', `color: ${CONTRAST_GREEN}`);
    // hideElementAfterTimeout(message);
  }
  else if (!result && !connect) {
    this._failDisonnect(message);
    message.setAttribute('style', `color: ${CONTRAST_RED}`);
    // hideElementAfterTimeout(message);
  } else {
    changeElementVisibility(message);
  }
}

TableRow.prototype._handleConnectError = function(error) {
  const message = document.getElementById("connected-domain-message");
  this._failDisonnect(message);
  hideElementAfterTimeout(message);
  throw new Error(error);
}


TableRow.prototype._successConnect = function(message) {
  setElementText(message, CONNECT_SUCCESS_MESSAGE);
  message.setAttribute('style', `color: ${CONTRAST_GREEN}`);
  chrome.runtime.sendMessage({
    action: APPLICATION_CONNECTED,
    data: {
      domains: this._addHTTProtocol(this.host),
    },
  });
}

TableRow.prototype._failConnect = function(message) {
  setElementText(message, CONNECT_FAILURE_MESSAGE);
  message.setAttribute('style', `color: ${CONTRAST_RED}`);
}

TableRow.prototype._failDisonnect = function(message) {
  setElementText(message, DISCONNECT_FAILURE_MESSAGE);
  message.setAttribute('style', `color: ${CONTRAST_RED}`);
}

TableRow.prototype._addHTTProtocol = function(host) {
  host = Application.subDomainColonForUnderscore(host);
  let http  = host;
  let https = host;
  if (!http.includes('http://')) {
    http = 'http://' + host + "/*";
  }
  if (!https.includes('https://')) {
    https = 'https://' + host + "/*";
  }
  return [http, https]; // eslint-disable-line
}


function loadingIconHTML() {
  return `<img style="padding: 5px; width: 20px;" id="config-loading-icon" class="loading-icon" src="../img/ring-alt.gif" alt="loading">`;
}
