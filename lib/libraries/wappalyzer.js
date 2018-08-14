"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.wappalzye = undefined;

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _util = require("../util.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var wappalzye = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(tab) {
    var tabURL, site, response, json;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            tabURL = new URL(tab.url);
            site = tabURL.href + tabURL.pathname;
            _context.next = 4;
            return fetch(_util.WAPPALYZER_SERVICE + "?site=" + site);

          case 4:
            response = _context.sent;

            if (!(response.ok && response.status === 200)) {
              _context.next = 12;
              break;
            }

            _context.next = 8;
            return response.json();

          case 8:
            json = _context.sent;

            if (!json.success) {
              _context.next = 11;
              break;
            }

            return _context.abrupt("return", json.libraries.applications);

          case 11:
            return _context.abrupt("return", null);

          case 12:
            console.log("ERROR IN WAPPALYZE RESPONSE", response);
            return _context.abrupt("return", null);

          case 14:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function wappalzye(_x) {
    return _ref.apply(this, arguments);
  };
}(); /*global
     	chrome,
     */

exports.wappalzye = wappalzye;