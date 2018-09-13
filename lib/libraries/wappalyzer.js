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
    var tabURL, response, json;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            tabURL = new URL(tab.url);
            _context.next = 3;
            return fetch(_util.WAPPALYZER_SERVICE + "?site=" + tabURL.href);

          case 3:
            response = _context.sent;

            if (!(response.ok && response.status === 200)) {
              _context.next = 11;
              break;
            }

            _context.next = 7;
            return response.json();

          case 7:
            json = _context.sent;

            if (!json.success) {
              _context.next = 10;
              break;
            }

            return _context.abrupt("return", json.libraries.applications);

          case 10:
            return _context.abrupt("return", null);

          case 11:
            console.log("ERROR IN WAPPALYZE RESPONSE", response);
            return _context.abrupt("return", null);

          case 13:
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