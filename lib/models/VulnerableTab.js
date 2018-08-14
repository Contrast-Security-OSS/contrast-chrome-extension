"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _util = require("../util.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function VulnerableTabError(message, vulnTabId, vulnTabUrl) {
  throw new Error(message, vulnTabId, vulnTabUrl);
} /*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */


function VulnerableTab(path, applicationName) {
  var traces = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

  this.traceIDs = traces;
  this.path = path.split("?")[0];
  this.vulnTabId = (0, _util.murmur)(this.path + "|" + applicationName);
  this.appNameHash = (0, _util.murmur)(applicationName);
}

VulnerableTab.prototype.setTraceIDs = function (traceIDs) {
  this.traceIDs = (0, _util.deDupeArray)(this.traceIDs.concat(traceIDs));
};

VulnerableTab.prototype.storeTab = function () {
  var _this = this;

  return new _promise2.default(function () {
    var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(resolve, reject) {
      var appTabs;
      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return _this.getApplicationTabs();

            case 2:
              appTabs = _context.sent;

              appTabs[_this.appNameHash][_this.vulnTabId] = _this.traceIDs;

              chrome.storage.local.set(appTabs, function () {
                chrome.storage.local.get(_this.appNameHash, function (storedTab) {
                  if (storedTab && storedTab[_this.appNameHash]) {
                    resolve(storedTab[_this.appNameHash]);
                  } else {
                    reject(new VulnerableTabError("Error Storing Tab", _this.vulnTabId, _this.path));
                  }
                });
              });

            case 5:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, _this);
    }));

    return function (_x2, _x3) {
      return _ref.apply(this, arguments);
    };
  }());
};

VulnerableTab.prototype.getApplicationTabs = function () {
  var _this2 = this;

  return new _promise2.default(function (resolve) {
    chrome.storage.local.get(_this2.appNameHash, function (appTabs) {

      // NOTE: if an application has just been added, appTabs will be empty obj
      // Add appNameHash key with val as empty object for storing vulnTabIds
      if (!appTabs || (0, _util.isEmptyObject)(appTabs)) {
        appTabs[_this2.appNameHash] = {};
      }

      resolve(appTabs);
    });
  });
};

VulnerableTab.prototype.getStoredTab = function () {
  var _this3 = this;

  return new _promise2.default(function (resolve) {
    chrome.storage.local.get(_this3.appNameHash, function (storedTabs) {
      if (storedTabs && storedTabs[_this3.appNameHash]) {
        resolve(storedTabs[_this3.appNameHash]);
      } else {
        resolve(null);
      }
    });
  });
};

VulnerableTab.buildTabPath = function (tabUrl) {
  var url = new URL(tabUrl);
  var path = url.pathname;
  if (url.hash) {
    path += url.hash;
  }
  return path;
};

exports.default = VulnerableTab;