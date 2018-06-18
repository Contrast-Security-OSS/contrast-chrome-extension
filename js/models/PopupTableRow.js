import {
  CONTRAST_RED,
  CONTRAST_GREEN,
  setElementText,
  setElementDisplay,
  changeElementVisibility,
  subDomainColonForUnderscore,
  hideElementAfterTimeout,
} from '../util.js'

import ConnectedDomain from './ConnectedDomain.js'

const CONNECT_BUTTON_TEXT     = "Click to Connect";
const CONNECT_SUCCESS_MESSAGE = "Successfully connected. You may need to reload the page.";
const CONNECT_FAILURE_MESSAGE = "Error connecting. Try refreshing the page.";
const DISCONNECT_SUCCESS_MESSAGE = "Successfully Disconnected";
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
    const connected = new ConnectedDomain(this.host, this.application);
    connected.connectDomain()
    .then(connected => this._showMessage(connected))
    .catch((error) => this._handleConnectError(error));
  });
}

// REMOVE DOMAIN

TableRow.prototype.renderDisconnect = function(storedApps, storedApp) {
  // const domain           = connected._getDomainFromApplication();
  const disconnectButton = document.createElement('button');
  const connected        = new ConnectedDomain(this.host, storedApp);
  // setElementText(this.domainTD, domain);
  setElementText(this.domainTD, subDomainColonForUnderscore(this.host));
  setElementText(disconnectButton, DISCONNECT_BUTTON_TEXT);

  disconnectButton.setAttribute('class', CONTRAST_BUTTON_CLASS);
  disconnectButton.addEventListener('click', () => {
    connected.disconnectDomain(storedApps, this)
    .then(disconnected => this._showMessage(disconnected))
    .catch(error => this._handleConnectError(error));
  });
  this.disconnectTD.appendChild(disconnectButton);
}

TableRow.prototype.removeDomainAndButton = function() {
  this.domainTD.innerHTML = "";
  this.disconnectTD.innerHTML = "";
}

// HELPERS

TableRow.prototype._showMessage = function(result) {
  const message = document.getElementById("connected-domain-message");
  changeElementVisibility(message);
  if (result) {
    this._successDisonnect(message);
    message.setAttribute('style', `color: ${CONTRAST_GREEN}`);
  } else {
    this._failDisonnect(message);
    message.setAttribute('style', `color: ${CONTRAST_RED}`);
  }
  hideElementAfterTimeout(message);
}

TableRow.prototype._handleConnectError = function(error) {
  const message = document.getElementById("connected-domain-message");
  this._failDisonnect(message);
  hideElementAfterTimeout(message);
}


TableRow.prototype._successConnect = function(message) {
  setElementText(message, CONNECT_SUCCESS_MESSAGE);
  message.setAttribute('style', `color: ${CONTRAST_GREEN}`);
}

TableRow.prototype._failConnect = function(message) {
  setElementText(message, CONNECT_FAILURE_MESSAGE);
  message.setAttribute('style', `color: ${CONTRAST_RED}`);
}

TableRow.prototype._successDisonnect = function(message) {
  setElementText(message, DISCONNECT_SUCCESS_MESSAGE);
  message.setAttribute('style', `color: ${CONTRAST_GREEN}`);
}

TableRow.prototype._failDisonnect = function(message) {
  setElementText(message, DISCONNECT_FAILURE_MESSAGE);
  message.setAttribute('style', `color: ${CONTRAST_RED}`);
}
