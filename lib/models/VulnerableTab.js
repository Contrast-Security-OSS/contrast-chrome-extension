"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _defineProperty2 = require("babel-runtime/helpers/defineProperty");

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _util = require("../util.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function VulnerableTabError(message, vulnTabId, vulnTabUrl) {
  throw new Error(message, vulnTabId, vulnTabUrl);
}

function VulnerableTab(path, applicationName) {
  var traces = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

  this.traceIDs = traces;
  this.path = path.split("?")[0];
  this.vulnTabId = btoa(this.path + "|" + applicationName);
  this.applicationName = btoa(applicationName);
}

VulnerableTab.prototype.decodeID = function () {
  return atob(this.vulnTabId);
};

VulnerableTab.prototype.setTraceIDs = function (traceIDs) {
  this.traceIDs = (0, _util.deDupeArray)(traceIDs);
};

VulnerableTab.prototype.storeTab = function () {
  var _this = this;

  return new _promise2.default(function (resolve, reject) {
    chrome.storage.local.set((0, _defineProperty3.default)({}, _this.applicationName, (0, _defineProperty3.default)({}, _this.vulnTabId, _this.traceIDs)), function () {
      chrome.storage.local.get(_this.applicationName, function (storedTab) {
        if (storedTab[_this.applicationName]) {
          resolve(storedTab[_this.applicationName]);
        } else {
          reject(new VulnerableTabError("Error Storing Tab", _this.vulnTabId, _this.path));
        }
      });
    });
  });
};

VulnerableTab.prototype.getStoredTab = function () {
  var _this2 = this;

  return new _promise2.default(function (resolve, reject) {
    chrome.storage.local.get(_this2.applicationName, function (storedTabs) {
      if (storedTabs && storedTabs[_this2.applicationName]) {
        resolve(storedTabs[_this2.applicationName]);
      } else {
        resolve(null);
      }
    });
  });
};

exports.default = VulnerableTab;