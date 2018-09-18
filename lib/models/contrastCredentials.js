'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _util = require('../util.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ContrastCredentials = function ContrastCredentials(options) {
  (0, _classCallCheck3.default)(this, ContrastCredentials);
  var apiKey = options.apiKey,
      orgUuid = options.orgUuid,
      teamServerUrl = options.teamServerUrl,
      serviceKey = options.serviceKey,
      profileEmail = options.profileEmail;

  this[_util.CONTRAST_API_KEY] = apiKey;
  this[_util.CONTRAST_ORG_UUID] = orgUuid;
  this[_util.TEAMSERVER_URL] = teamServerUrl;
  this[_util.CONTRAST_SERVICE_KEY] = serviceKey;
  this[_util.CONTRAST_USERNAME] = profileEmail;
};

exports.default = ContrastCredentials;