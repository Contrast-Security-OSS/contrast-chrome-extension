"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Library = function () {
  function Library(tab, library) {
    (0, _classCallCheck3.default)(this, Library);

    this.GET_LIB_VERSION = "GET_LIB_VERSION";
    this.tab = tab;
    this.library = library;
    this.extractor = null;
  }

  (0, _createClass3.default)(Library, [{
    key: "_setExtrator",
    value: function _setExtrator(extractor) {
      this.extractor = extractor;
    }
  }, {
    key: "_setLibraryVersion",
    value: function _setLibraryVersion(version) {
      this.library.version = version;
    }
  }, {
    key: "createVersionedLibrary",
    value: function createVersionedLibrary() {
      var _this = this;

      if (this.library.extractors && this.library.extractors.func) {
        this._setExtrator(this.library.extractors.func[0]);
        return this._extractLibraryVersion(); // is a promise
      }
      return new _promise2.default(function (resolve) {
        return resolve(_this.library);
      });
    }
  }, {
    key: "_extractLibraryVersion",
    value: function _extractLibraryVersion() {
      var _this2 = this;

      return new _promise2.default(function (resolve, reject) {
        var library = _this2.library,
            tab = _this2.tab;

        _this2._executeExtractionScript().then(function (executed) {
          // eslint-disable-line no-unused-vars
          chrome.tabs.sendMessage(tab.id, {
            action: _this2.GET_LIB_VERSION,
            library: library
          }, function (version) {
            console.log("VERSION RECEIVED", version);
            if (version) {
              _this2._setLibraryVersion(version);
              console.log("Resolving0", library);
              resolve(library);
            } else {
              _this2._setLibraryVersion(_this2._getVersionFromFileName(library.jsFileName));
              console.log("Resolving1", library);
              resolve(library);
            }
            console.log("Resolving2", library);
            resolve(library);
          });
        }).catch(function (error) {
          console.log("Error in _extractLibraryVersion", error);
          reject(error);
        });
      });
    }
  }, {
    key: "_getVersionFromFileName",
    value: function _getVersionFromFileName(jsFileName) {
      var version = jsFileName.match(/\b\d+(?:\.\d+)*\b/);
      if (version) {
        return version[0];
      }
      return null;
    }
  }, {
    key: "_executeExtractionScript",
    value: function _executeExtractionScript() {
      var _this3 = this;

      return new _promise2.default(function (resolve) {
        var extractor = _this3.extractor,
            library = _this3.library,
            tab = _this3.tab;

        var details = {
          code: _this3._generateScriptTags({ extractor: extractor, library: library })
        };
        chrome.tabs.executeScript(tab.id, details, function (result) {
          resolve(!!result);
        });
      });
    }

    /**
    * NOTE: THIS IS NUTS
    * Necessary for executing a script on the webpage directly since
    * content scripts run in an isolated world
    * chrome.tabs.executeScript injects into content-script, not the page
    *
    * _generateScriptTags - Get the library version by running an extractor
    * function provided by Retire.js on the webpage, create an element which holds that value
    *
    * @param  {Object} request request from content script
    * @return {String}        	script executed on webpage
    */

  }, {
    key: "_generateScriptTags",
    value: function _generateScriptTags() {
      console.log("EXTRACTOR AND LIBS", this.extractor, this.library);
      var extractor = this.extractor;

      if (!this.library.parsedLibName || !extractor) {
        return null;
      }
      var library = this.library.parsedLibName.replace('-', '_');
      var script = "\n      try {\n        var _c_res" + library + " = " + extractor + ";\n        var __docRes" + library + " = document.getElementById('__script_res_" + library + "');\n        __docRes" + library + ".innerText = _c_res" + library + ";\n      } catch (e) {\n        console.log(e)\n      }";

      return "try {\n          var script" + library + " = document.createElement('script');\n          var scriptRes" + library + " = document.createElement('span');\n          script" + library + ".innerHTML = `" + script + "`;\n          const elId_" + library + " = '__script_res_" + library + "'\n          const el_" + library + " = document.getElementById(elId_" + library + ");\n          if (!el_" + library + ") {\n            scriptRes" + library + ".setAttribute('id', elId_" + library + ");\n            document.body.appendChild(scriptRes" + library + ");\n            document.body.appendChild(script" + library + ");\n            scriptRes" + library + ".style.display = 'none';\n          }\n        } catch (e) {}";
    }
  }]);
  return Library;
}();

exports.default = Library;