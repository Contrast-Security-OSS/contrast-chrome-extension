'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _util = require('../util.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DomainStorage = function () {
  function DomainStorage() {
    (0, _classCallCheck3.default)(this, DomainStorage);

    var domains = this._getDomainsFromStorage();
    this.domains = ["http://localhost:*/"].concat(domains);
  }

  (0, _createClass3.default)(DomainStorage, [{
    key: 'addDomainsToStorage',
    value: function addDomainsToStorage(requestDomains) {
      var domains = this._getDomainsFromStorage();
      domains = domains.concat(requestDomains);
      this._setNewDomains(domains);
    }
  }, {
    key: 'removeDomainsFromStorage',
    value: function removeDomainsFromStorage(requestDomains) {
      var domains = this._getDomainsFromStorage();
      domains = domains.filter(function (d) {
        return !requestDomains.includes(d);
      });
      this._setNewDomains(domains);
    }
  }, {
    key: '_setNewDomains',
    value: function _setNewDomains(domains) {
      this.domains = domains;
      window.localStorage.setItem(_util.CONNECTED_APP_DOMAINS, (0, _stringify2.default)(domains));
    }
  }, {
    key: '_getDomainsFromStorage',
    value: function _getDomainsFromStorage() {
      var domains = window.localStorage.getItem(_util.CONNECTED_APP_DOMAINS);
      if (!domains) {
        return [];
      } else if (typeof domains === 'string') {
        return JSON.parse(domains);
      }
      return domains;
    }
  }]);
  return DomainStorage;
}();

exports.default = DomainStorage;