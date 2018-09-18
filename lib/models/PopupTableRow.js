"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = TableRow;

var _util = require("../util.js");

var _Application = require("./Application.js");

var _Application2 = _interopRequireDefault(_Application);

var _ConnectedDomain = require("./ConnectedDomain.js");

var _ConnectedDomain2 = _interopRequireDefault(_ConnectedDomain);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var HOST_SPAN_CLASS = "app-host-span"; /*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */

var CONNECT_BUTTON_TEXT = "Connect";
var CONNECT_SUCCESS_MESSAGE = "Successfully connected. Please reload the page.";
var CONNECT_FAILURE_MESSAGE = "Error connecting. Try refreshing the page.";
// const DISCONNECT_SUCCESS_MESSAGE = "Successfully Disconnected";
var DISCONNECT_FAILURE_MESSAGE = "Error Disconnecting";
var DISCONNECT_BUTTON_TEXT = "Disconnect";

var CONTRAST_BUTTON_CLASS = "btn btn-primary btn-xs btn-contrast-plugin btn-connect";
var CONTRAST_BUTTON_DISCONNECT_CLASS = "btn btn-primary btn-xs btn-contrast-plugin btn-disconnect";

function TableRow(application, url, table) {
  this.application = application;
  this.url = url;
  this.table = table;
  this.host = "";
  this.row = document.createElement("tr");
  this.nameTD = document.createElement("td");
  // this.appIdTD      = document.createElement('td');
  this.buttonTD = document.createElement("td");
  // this.disconnectTD = document.createElement('td');
}

TableRow.prototype.setHost = function (host) {
  this.host = host;
};

// DOM STUFF

TableRow.prototype.appendChildren = function () {
  this.table.appendChild(this.row);
  this.row.appendChild(this.nameTD);
  this.row.appendChild(this.buttonTD);
  // this.row.appendChild(this.appIdTD);
  // this.row.appendChild(this.disconnectTD);
};

// TableRow.prototype.setAppId = function() {
//   setElementText(this.appIdTD, this.application.app_id);
//   setElementDisplay(this.appIdTD, "none");
// }

TableRow.prototype.createConnectButton = function () {
  var _this = this;

  var buttonTD = this.buttonTD;
  var domainBtn = document.createElement("button");

  domainBtn.setAttribute("class", CONTRAST_BUTTON_CLASS + " domainBtn");
  buttonTD.appendChild(domainBtn);

  (0, _util.setElementText)(domainBtn, CONNECT_BUTTON_TEXT);
  (0, _util.setElementText)(this.nameTD, this.application.name.titleize());

  domainBtn.addEventListener("click", function () {
    var cd = new _ConnectedDomain2.default(_this.host, _this.application);
    cd.connectDomain().then(function (connected) {
      return _this._showMessage(connected, true);
    }).catch(function (error) {
      return _this._handleConnectError(error);
    });
  });
};

// REMOVE DOMAIN

TableRow.prototype.renderDisconnect = function (storedApps, storedApp) {
  var _this2 = this;

  // const domain           = connected._getDomainFromApplication();
  var disconnectButton = document.createElement("button");
  var connected = new _ConnectedDomain2.default(this.host, storedApp);

  var appHostSpan = document.createElement("span");
  appHostSpan.innerText = _Application2.default.subDomainColonForUnderscore(this.host);
  appHostSpan.setAttribute("class", HOST_SPAN_CLASS);
  this.nameTD.appendChild(appHostSpan);

  // setElementText(this.buttonTD, Application.subDomainColonForUnderscore(this.host));
  (0, _util.setElementText)(disconnectButton, DISCONNECT_BUTTON_TEXT);

  disconnectButton.setAttribute("class", CONTRAST_BUTTON_DISCONNECT_CLASS);

  disconnectButton.addEventListener("click", function () {
    connected.disconnectDomain(_this2).then(function (disconnected) {
      if (disconnected) {
        _this2.removeDomainAndButton();
      } else {
        throw new Error("Error Disconnecting Domain");
      }
    }).catch(function (error) {
      return _this2._handleConnectError(error);
    });
  });
  this.buttonTD.appendChild(disconnectButton);
};

TableRow.prototype.removeDomainAndButton = function () {
  this.buttonTD.innerHTML = "";
  this.nameTD.innerHTML = this.application.name;
};

// HELPERS

TableRow.prototype._showMessage = function (result, connect) {
  var message = document.getElementById("connected-domain-message");
  var tableContainer = document.getElementById("table-container");
  (0, _util.changeElementVisibility)(message);
  if (result && connect) {
    this._successConnect(message);
    message.setAttribute("style", "color: " + _util.CONTRAST_GREEN);
    (0, _util.setElementDisplay)(tableContainer, "none");
    // hideElementAfterTimeout(message);
  } else if (!result && connect) {
    this._failConnect(message);
    message.setAttribute("style", "color: " + _util.CONTRAST_GREEN);
    (0, _util.setElementDisplay)(tableContainer, "none");
    // hideElementAfterTimeout(message);
  } else if (!result && !connect) {
    this._failDisonnect(message);
    message.setAttribute("style", "color: " + _util.CONTRAST_RED);
    (0, _util.setElementDisplay)(tableContainer, "none");
    // hideElementAfterTimeout(message);
  } else {
    (0, _util.changeElementVisibility)(message);
    (0, _util.setElementDisplay)(tableContainer, "none");
  }
};

TableRow.prototype._handleConnectError = function (error) {
  var message = document.getElementById("connected-domain-message");
  this._failDisonnect(message);
  (0, _util.hideElementAfterTimeout)(message);
  throw new Error(error);
};

TableRow.prototype._successConnect = function (message) {
  (0, _util.setElementText)(message, CONNECT_SUCCESS_MESSAGE);
  message.setAttribute("style", "color: " + _util.CONTRAST_GREEN);
  chrome.runtime.sendMessage({
    action: _util.APPLICATION_CONNECTED,
    data: {
      domains: this._addHTTProtocol(this.host)
    }
  });
};

TableRow.prototype._failConnect = function (message) {
  (0, _util.setElementText)(message, CONNECT_FAILURE_MESSAGE);
  message.setAttribute("style", "color: " + _util.CONTRAST_RED);
};

TableRow.prototype._failDisonnect = function (message) {
  (0, _util.setElementText)(message, DISCONNECT_FAILURE_MESSAGE);
  message.setAttribute("style", "color: " + _util.CONTRAST_RED);
};

TableRow.prototype._addHTTProtocol = function (host) {
  host = _Application2.default.subDomainColonForUnderscore(host);
  var http = host;
  var https = host;
  if (!http.includes("http://")) {
    http = "http://" + host + "/*";
  }
  if (!https.includes("https://")) {
    https = "https://" + host + "/*";
  }
  return [http, https]; // eslint-disable-line
};