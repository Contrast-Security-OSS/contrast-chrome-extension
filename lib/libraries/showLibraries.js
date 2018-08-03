'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.renderVulnerableLibraries = undefined;

var _values = require('babel-runtime/core-js/object/values');

var _values2 = _interopRequireDefault(_values);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _util = require('../util.js');

var _Application = require('../models/Application.js');

var _Application2 = _interopRequireDefault(_Application);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var versionTypes = {
  atOrAbove: ">=",
  atOrBelow: "<=",
  below: "<",
  above: ">"
};

var getLibrariesFromStorage = function getLibrariesFromStorage(tab, application) {
  return new _promise2.default(function (resolve, reject) {
    var appKey = "APP_LIBS__ID_" + application.domain;
    // console.log("APPKEY", appKey);
    chrome.storage.local.get(_util.CONTRAST__STORED_APP_LIBS, function (result) {
      // console.log("GOT STORED LIBS RESULT", result);
      if ((0, _util.isEmptyObject)(result)) {
        resolve(null);
      } else {
        var libraries = result[_util.CONTRAST__STORED_APP_LIBS][appKey];
        // console.log("GOT LIBRARIES IN getLibrariesFromStorage", libraries);
        resolve(libraries);
      }
      reject(new Error("result was", typeof result === 'undefined' ? 'undefined' : (0, _typeof3.default)(result)));
    });
  });
};

var _getTabAndApplication = function _getTabAndApplication() {
  return new _promise2.default(function (resolve, reject) {
    chrome.tabs.query({ active: true, currentWindow: true }, function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(tabs) {
        var tab, application;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                tab = tabs[0];

                if (tab) {
                  _context.next = 4;
                  break;
                }

                reject(new Error("Tab is null"));
                return _context.abrupt('return');

              case 4:
                _context.next = 6;
                return _Application2.default.retrieveApplicationFromStorage(tab);

              case 6:
                application = _context.sent;

                resolve({ tab: tab, application: application });

              case 8:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, undefined);
      }));

      return function (_x) {
        return _ref.apply(this, arguments);
      };
    }());
  });
};

var renderVulnerableLibraries = function () {
  var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(tab, application) {
    var tabAndApp, libraries, container, ul, i, len, lib, j, vulnObj;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            if (!(!tab || !application)) {
              _context2.next = 6;
              break;
            }

            _context2.next = 3;
            return _getTabAndApplication();

          case 3:
            tabAndApp = _context2.sent;

            tab = tabAndApp.tab;
            application = tabAndApp.application;

          case 6:
            _context2.next = 8;
            return getLibrariesFromStorage(tab, application);

          case 8:
            libraries = _context2.sent;

            if (!(!libraries || libraries.length === 0)) {
              _context2.next = 11;
              break;
            }

            return _context2.abrupt('return');

          case 11:

            document.getElementById('libs-not-configured').style.display = "none";
            document.getElementById('libs-no-vulnerabilities-found').style.display = "none";

            container = document.getElementById('libs-vulnerabilities-found-on-page');
            ul = document.getElementById('libs-vulnerabilities-found-on-page-list');


            libraries = libraries.sort(function (a, b) {
              if (!a) return b > a;
              if (!b) return a > b;
              if (!a.severity && !!b.severity) {
                return a < b;
              } else if (!!a.severity && !b.severity) {
                return b < a;
              } else if (!a.severity && !b.severity) {
                return a === b;
              }
              return _util.SEVERITY[a.severity.titleize()] < _util.SEVERITY[b.severity.titleize()];
            });

            i = 0, len = libraries.length;

          case 17:
            if (!(i < len)) {
              _context2.next = 34;
              break;
            }

            lib = libraries[i];

            if (lib) {
              _context2.next = 21;
              break;
            }

            return _context2.abrupt('continue', 31);

          case 21:
            j = 0;

          case 22:
            if (!(j < lib.vulnerabilitiesCount)) {
              _context2.next = 31;
              break;
            }

            if (lib.vulnerabilities) {
              _context2.next = 25;
              break;
            }

            return _context2.abrupt('continue', 28);

          case 25:
            vulnObj = lib.vulnerabilities[j];

            vulnObj.version = _setVulnerabilityVersion(vulnObj);
            _createVulnerabilityListItem(ul, lib.name, vulnObj);

          case 28:
            j++;
            _context2.next = 22;
            break;

          case 31:
            i++;
            _context2.next = 17;
            break;

          case 34:
            container.style.display = "block";

          case 35:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function renderVulnerableLibraries(_x2, _x3) {
    return _ref2.apply(this, arguments);
  };
}();

var _setVulnerabilityVersion = function _setVulnerabilityVersion(vulnObj) {
  var versions = vulnObj.versions || vulnObj;
  var version = [];
  try {
    var keys = (0, _keys2.default)(versions);
    var vals = (0, _values2.default)(versions);
    for (var k = 0, kLen = keys.length; k < kLen; k++) {
      if (versionTypes[keys[k]]) {
        version.push(versionTypes[keys[k]] + ' ' + vals[k]);
      }
    }
  } catch (e) {
    console.log("Error adding version to vulnObj 2", e);
  }

  if (version.length > 1) {
    version = version.join(" and ");
  } else {
    version = version[0];
  }
  return version;
};

var _createVulnerabilityListItem = function _createVulnerabilityListItem(ul, libName, vulnObj) {
  var name = vulnObj.name,
      version = vulnObj.version,
      severity = vulnObj.severity,
      title = vulnObj.title,
      link = vulnObj.link;

  if (!name) {
    name = libName;
    name = name.titleize();
  }

  if (!title) {
    title = vulnObj.identifiers;
    if (title) {
      title = title.summary;
    } else {
      title = libName;
    }
  }

  var li = document.createElement('li');
  li.classList.add('list-group-item');
  li.classList.add('no-border');
  li.classList.add('vulnerability-li');

  var img = document.createElement('img');

  switch (severity.toLowerCase()) {
    case _util.SEVERITY_LOW.toLowerCase():
      {
        img.setAttribute("src", _util.SEVERITY_LOW_ICON_PATH);
        li.classList.add("vuln-4");
        break;
      }
    case _util.SEVERITY_MEDIUM.toLowerCase():
      {
        img.setAttribute("src", _util.SEVERITY_MEDIUM_ICON_PATH);
        li.classList.add("vuln-3");
        break;
      }
    case _util.SEVERITY_HIGH.toLowerCase():
      {
        img.setAttribute("src", _util.SEVERITY_HIGH_ICON_PATH);
        li.classList.add("vuln-2");
        break;
      }
    default:
      break;
  }
  li.appendChild(img);

  var titleSpan = document.createElement('span');
  titleSpan.classList.add('vulnerability-rule-name');
  titleSpan.innerText = " " + name + " " + version + "\n";
  titleSpan.style.weight = 'bold';

  var anchor = document.createElement('a');
  anchor.classList.add('vulnerability-rule-name');
  anchor.innerText = (0, _util.capitalize)(title.trim()) + ".";
  anchor.onclick = function () {
    chrome.tabs.create({
      url: link,
      active: false
    });
  };
  li.appendChild(titleSpan);
  li.appendChild(anchor);

  ul.appendChild(li);
};

exports.renderVulnerableLibraries = renderVulnerableLibraries;