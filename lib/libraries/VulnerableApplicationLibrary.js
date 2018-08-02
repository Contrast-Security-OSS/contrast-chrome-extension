'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var VulnerableApplicationLibrary = function () {
  function VulnerableApplicationLibrary(vulnerableLibrary) {
    (0, _classCallCheck3.default)(this, VulnerableApplicationLibrary);

    this.name = vulnerableLibrary.name || vulnerableLibrary.parsedLibName;
    this.vulnerabilities = vulnerableLibrary.vulnerabilities;
    this.vulnerabilitiesCount = vulnerableLibrary.vulnerabilities.length;
  }

  (0, _createClass3.default)(VulnerableApplicationLibrary, [{
    key: 'lowConfidenceVulnerabilities',
    value: function lowConfidenceVulnerabilities() {
      return {
        name: this.name,
        confidenceIsCorrectLibrary: 'LOW',
        vulnerabilitiesCount: this.vulnerabilitiesCount,
        vulnerabilities: this.vulnerabilities.map(function (v) {
          var versions = {};
          v.atOrAbove ? versions.atOrAbove = v.atOrAbove : null;
          v.atOrBelow ? versions.atOrBelow = v.atOrBelow : null;
          v.above ? versions.above = v.above : null;
          v.below ? versions.below = v.below : null;
          return {
            title: v.identifiers.summary,
            link: v.info[0],
            severity: v.severity,
            versions: versions
          };
        })
      };
    }
  }, {
    key: 'highConfidenceVulnerability',
    value: function highConfidenceVulnerability() {
      console.log("THIS VulnerableApplicationLibrary", this);
      var vulnObj = this._isCorrectVersion(this.vulnerabilities, this.version);
      return {
        name: this.name,
        severity: vulnObj.severity,
        title: vulnObj.identifiers.summary,
        link: vulnObj.info[0],
        confidenceIsCorrectLibrary: 'HIGH',
        vulnerabilitiesCount: this.vulnerabilitiesCount
      };
    }
  }, {
    key: '_isCorrectVersion',
    value: function _isCorrectVersion(vulnerabilityObjects, libVersion) {
      if (!vulnerabilityObjects || !libVersion) return false;

      // console.log("####");
      // console.log(vulnerabilityObjects, docScripts, libName);

      for (var i = 0, len = vulnerabilityObjects.length; i < len; i++) {
        var vuln = vulnerabilityObjects[i];
        var below = vuln.below,
            atOrAbove = vuln.atOrAbove,
            above = vuln.above;

        if (below) {
          below = this._parseVersionNumber(below);
        }
        if (atOrAbove) {
          atOrAbove = this._parseVersionNumber(atOrAbove);
        }
        if (above) {
          above = this._parseVersionNumber(above);
        }

        if (this._hasVulnerableVersion(below, atOrAbove, above, libVersion)) {
          return vuln;
        }

        // get script obj that has matching bowername
        // compare script vuln version to vulnObj versions
        // true if is correct version
      }
      return null;
    }
  }, {
    key: '_hasVulnerableVersion',
    value: function _hasVulnerableVersion(below, atOrAbove, above, libVersion) {
      if (below && atOrAbove) {
        if (libVersion < below && libVersion >= atOrAbove) {
          return true;
        }
      } else if (below && above) {
        if (libVersion < below && libVersion > above) {
          return true;
        }
      } else if (below && libVersion < below) {
        return true;
      } else if (atOrAbove && libVersion >= atOrAbove) {
        return true;
      } else if (above && libVersion > above) {
        return true;
      }
      return false;
    }
  }, {
    key: '_parseVersionNumber',
    value: function _parseVersionNumber(string) {
      return string.split("-")[0].split(/[a-zA-Z]/)[0];
    }
  }]);
  return VulnerableApplicationLibrary;
}();

exports.default = VulnerableApplicationLibrary;