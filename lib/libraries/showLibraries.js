'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.renderVulnerableLibraries = undefined;

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

var getLibrariesFromStorage = function getLibrariesFromStorage(tab, application) {
  return new _promise2.default(function (resolve, reject) {
    var appKey = "APP_LIBS__ID_" + application.domain;
    chrome.storage.local.get(_util.CONTRAST__STORED_APP_LIBS, function (result) {
      if ((0, _util.isEmptyObject)(result)) {
        resolve(null);
      } else {
        var libraries = result[_util.CONTRAST__STORED_APP_LIBS][appKey];
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
    var tabAndApp, libraries, container, ul, listItemTexts, i, len, lib, j, vulnObj, name;
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
            container = document.getElementById('libs-vulnerabilities-found-on-page');
            ul = document.getElementById('libs-vulnerabilities-found-on-page-list');


            libraries = libraries.sort(function (a, b) {
              if (!a.severity && b.severity) {
                return 1;
              } else if (a.severity && !b.severity) {
                return -1;
              } else if (!a.severity && !b.severity) {
                return 0;
              }
              return _util.SEVERITY[b.severity.titleize()] - _util.SEVERITY[a.severity.titleize()];
            });

            listItemTexts = [];
            i = 0, len = libraries.length;

          case 16:
            if (!(i < len)) {
              _context2.next = 34;
              break;
            }

            lib = libraries[i];

            if (lib) {
              _context2.next = 20;
              break;
            }

            return _context2.abrupt('continue', 31);

          case 20:
            j = 0;

          case 21:
            if (!(j < lib.vulnerabilitiesCount)) {
              _context2.next = 31;
              break;
            }

            if (lib.vulnerabilities) {
              _context2.next = 24;
              break;
            }

            return _context2.abrupt('continue', 28);

          case 24:
            vulnObj = lib.vulnerabilities[j];

            vulnObj.title = _vulnObjTitle(vulnObj);
            // vulnObj.version = _setVulnerabilityVersion(vulnObj);
            name = vulnObj.name || lib.name;

            if (!listItemTexts.includes(vulnObj.title + name)) {
              _createVulnerabilityListItem(ul, lib.name, vulnObj);
              listItemTexts.push(vulnObj.title + name);
            }

          case 28:
            j++;
            _context2.next = 21;
            break;

          case 31:
            i++;
            _context2.next = 16;
            break;

          case 34:

            container.classList.remove('hidden');
            container.classList.add('visible');

          case 36:
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

var _vulnObjTitle = function _vulnObjTitle(vulnObj) {
  var title = vulnObj.title;
  if (!title) {
    title = vulnObj.identifiers;
    if (typeof title !== 'string') {
      return title.summary;
    }
    return title;
  }
  return title;
};

// NOTE: Leave for now, not sure if version should be included
//
// const versionTypes = {
//   atOrAbove: ">=",
//   atOrBelow: "<=",
//   below: "<",
//   above: ">",
// }
//
// const _setVulnerabilityVersion = (vulnObj) => {
//   let versions = vulnObj.versions || vulnObj;
//   let version  = [];
//   try {
//     let keys = Object.keys(versions);
//     let vals = Object.values(versions);
//     for (let k = keys.length, kLen = -1; k > kLen; k--) {
//       if (versionTypes[keys[k]]) {
//         version.push(
//           `${versionTypes[keys[k]]} ${vals[k]}`);
//       }
//     }
//   } catch (e) { e }
//
//   if (version.length > 1) {
//     version = version.join(" and ");
//   } else {
//     version = version[0];
//   }
//   return version;
// }

var createBadge = function createBadge(severity, li) {
  var parent = document.createElement('div');
  parent.classList.add('parent-badge');

  var child = document.createElement('div');
  child.classList.add('child-badge');
  child.innerText = severity;
  child.style.color = _util.SEVERITY_TEXT_COLORS[severity];

  parent.style.backgroundColor = _util.SEVERITY_BACKGROUND_COLORS[severity];

  parent.appendChild(child);
  li.appendChild(parent);
};

var _createVulnerabilityListItem = function _createVulnerabilityListItem(ul, libName, vulnObj) {
  var name = vulnObj.name,
      severity = vulnObj.severity,
      title = vulnObj.title,
      link = vulnObj.link;

  if (!name) {
    name = libName;
    name = name.titleize();
  }

  var li = document.createElement('li');
  li.classList.add('list-group-item');
  li.classList.add('no-border');
  li.classList.add('vulnerability-li');

  switch (severity.toLowerCase()) {
    case _util.SEVERITY_LOW.toLowerCase():
      {
        createBadge(_util.SEVERITY_LOW, li);
        break;
      }
    case _util.SEVERITY_MEDIUM.toLowerCase():
      {
        createBadge(_util.SEVERITY_MEDIUM, li);
        break;
      }
    case _util.SEVERITY_HIGH.toLowerCase():
      {
        createBadge(_util.SEVERITY_HIGH, li);
        break;
      }
    default:
      break;
  }

  name = name.replace('Jquery', 'JQuery');

  var anchor = document.createElement('a');
  anchor.classList.add('vulnerability-link');
  anchor.classList.add('vulnerability-rule-name');
  anchor.innerText = name + ":  " + (0, _util.capitalize)(title.trim()); // + version
  anchor.onclick = function () {
    chrome.tabs.create({
      url: link,
      active: false
    });
  };
  li.appendChild(anchor);

  ul.appendChild(li);
};

exports.renderVulnerableLibraries = renderVulnerableLibraries;