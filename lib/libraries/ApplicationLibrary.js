'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _util = require('../util.js');

var _Library = require('./Library.js');

var _Library2 = _interopRequireDefault(_Library);

var _VulnerableApplicationLibrary = require('./VulnerableApplicationLibrary.js');

var _VulnerableApplicationLibrary2 = _interopRequireDefault(_VulnerableApplicationLibrary);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ApplicationLibrary = function () {
  function ApplicationLibrary(tab, application) {
    (0, _classCallCheck3.default)(this, ApplicationLibrary);

    this.tab = tab;
    this.application = application;
    this.libraries = [];
    this.STORED_APP_LIBS_ID = "APP_LIBS__ID_" + application.domain;
  }

  (0, _createClass3.default)(ApplicationLibrary, [{
    key: '_setCurrentLibs',
    value: function _setCurrentLibs(libraries) {
      if (libraries && Array.isArray(libraries)) {
        this.libraries = libraries.filter(Boolean);
      }
    }
  }, {
    key: 'getApplicationLibraries',
    value: function getApplicationLibraries() {
      var _this = this;

      return new _promise2.default(function (resolve, reject) {
        var tab = _this.tab;

        chrome.tabs.sendMessage(tab.id, { action: _util.GATHER_SCRIPTS, tab: tab }, function (response) {
          if (!response) {
            reject(new Error("No Response to GATHER_SCRIPTS"));
            return;
          }
          var sharedLibraries = response.sharedLibraries;

          var libraries = void 0;
          try {
            libraries = sharedLibraries.map(function (lib) {
              return new _Library2.default(tab, lib).createVersionedLibrary();
            });
          } catch (e) {
            return;
          }
          _promise2.default.all(libraries) // eslint-disable-line consistent-return
          .then(function (libResult) {
            var vulnerableApplicationLibs = libResult.map(function (l) {
              var vAL = new _VulnerableApplicationLibrary2.default(l);

              if (l && l.vulnerabilities && l.version) {
                // confident version is in app
                return vAL.highConfidenceVulnerability();
              }
              // not confident version is in app
              return vAL.lowConfidenceVulnerabilities();
            }).filter(Boolean);
            resolve(vulnerableApplicationLibs);
          }).catch(function (error) {
            error;
          });
        });
      });
    }
  }, {
    key: 'addNewApplicationLibraries',
    value: function addNewApplicationLibraries(libsToAdd) {
      var _this2 = this;

      return new _promise2.default(function () {
        var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(resolve) {
          var STORED_APP_LIBS_ID, libraries, currentLibs, deDupedNewLibs, newLibs;
          return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  STORED_APP_LIBS_ID = _this2.STORED_APP_LIBS_ID;
                  _context.next = 3;
                  return _this2._getStoredApplicationLibraries();

                case 3:
                  libraries = _context.sent;
                  currentLibs = libraries[_util.CONTRAST__STORED_APP_LIBS] ? libraries[_util.CONTRAST__STORED_APP_LIBS][STORED_APP_LIBS_ID] : null;


                  _this2._setCurrentLibs(currentLibs);

                  if (!(!libraries || (0, _util.isEmptyObject)(libraries))) {
                    _context.next = 11;
                    break;
                  }

                  libraries[_util.CONTRAST__STORED_APP_LIBS] = {};
                  libraries[_util.CONTRAST__STORED_APP_LIBS][STORED_APP_LIBS_ID] = libsToAdd;
                  _context.next = 21;
                  break;

                case 11:
                  if (!((0, _util.isEmptyObject)(libraries[_util.CONTRAST__STORED_APP_LIBS]) || !currentLibs || !Array.isArray(currentLibs))) {
                    _context.next = 15;
                    break;
                  }

                  libraries[_util.CONTRAST__STORED_APP_LIBS][STORED_APP_LIBS_ID] = libsToAdd;
                  _context.next = 21;
                  break;

                case 15:
                  deDupedNewLibs = _this2._dedupeLibs(libsToAdd);

                  if (!(deDupedNewLibs.length === 0)) {
                    _context.next = 19;
                    break;
                  }

                  resolve(null);
                  return _context.abrupt('return');

                case 19:
                  newLibs = currentLibs.concat(deDupedNewLibs);

                  libraries[_util.CONTRAST__STORED_APP_LIBS][STORED_APP_LIBS_ID] = newLibs;

                case 21:
                  chrome.storage.local.set(libraries, function () {
                    chrome.storage.local.get(_util.CONTRAST__STORED_APP_LIBS, function (stored) {
                      resolve(stored[_util.CONTRAST__STORED_APP_LIBS][STORED_APP_LIBS_ID]);
                    });
                  });

                case 22:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee, _this2);
        }));

        return function (_x) {
          return _ref.apply(this, arguments);
        };
      }());
    }
  }, {
    key: '_getStoredApplicationLibraries',
    value: function _getStoredApplicationLibraries() {
      return new _promise2.default(function (resolve, reject) {
        chrome.storage.local.get(_util.CONTRAST__STORED_APP_LIBS, function (stored) {
          if (!stored || (0, _util.isEmptyObject)(stored)) {
            resolve({});
          } else {
            resolve(stored);
          }
          reject(new Error("Stored Libs are", typeof stored === 'undefined' ? 'undefined' : (0, _typeof3.default)(stored)));
        });
      });
    }
  }, {
    key: '_dedupeLibs',
    value: function _dedupeLibs(newLibs) {
      var _this3 = this;

      return newLibs.filter(function (nL) {
        // filter out libs that are in storage already
        var filteredCurrentLibs = _this3.libraries.filter(function (cL) {
          if (cL.name === nL.name && nL.vulnerabilitiesCount > 1) {
            if (cL.vulnerabilities.length === nL.vulnerabilities.length) {
              return true; // no new vulnerabilities
            }
            nL.vulnerabilities = nL.vulnerabilities.filter(function (nLv) {
              return cL.vulnerabilities.filter(function (cLv) {
                return cLv.title !== nLv.title;
              });
            });
            return nL.vulnerabilities.length === 0; // no new vulnerabilities
          }

          return cL.name === nL.name;
        });

        // if current libs contains the new libs return false and don't add the new lib
        return !filteredCurrentLibs[0];
      });
    }
  }, {
    key: 'removeAndSetupApplicationLibraries',
    value: function removeAndSetupApplicationLibraries() {
      if (!this.application || !this.STORED_APP_LIBS_ID) {
        throw new Error("Application and STORED_APP_LIBS_ID are not set.");
      }
      chrome.storage.local.remove(_util.CONTRAST__STORED_APP_LIBS);

      return this._setupApplicationLibraries();
    }
  }, {
    key: '_setupApplicationLibraries',
    value: function () {
      var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
        var libs;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this.getApplicationLibraries();

              case 2:
                libs = _context2.sent;

                if (!(!libs || libs.length === 0)) {
                  _context2.next = 5;
                  break;
                }

                return _context2.abrupt('return', null);

              case 5:
                return _context2.abrupt('return', this.addNewApplicationLibraries(libs));

              case 6:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function _setupApplicationLibraries() {
        return _ref2.apply(this, arguments);
      }

      return _setupApplicationLibraries;
    }()
  }]);
  return ApplicationLibrary;
}();

exports.default = ApplicationLibrary;