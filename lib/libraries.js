"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getApplicationLibraries = getApplicationLibraries;
exports.getStoredApplicationLibraries = getStoredApplicationLibraries;

var _helpersModule = require("./helpers/helpers-module.js");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /*global
                                                                                                                                                                                                                  	chrome,
                                                                                                                                                                                                                  	Helpers,
                                                                                                                                                                                                                  */

var GATHER_SCRIPTS = _helpersModule.Helpers.GATHER_SCRIPTS,
    CONTRAST__STORED_APP_LIBS = _helpersModule.Helpers.CONTRAST__STORED_APP_LIBS;

/**
 * _updateAppLibsInStorage - append app libraries to current app libraries
 *
 * @param  {Object} tab             the current tab
 * @param  {Object} result          the current app storage object
 * @param  {Function} resolve       promise resolve
 * @param  {Function} reject        promise reject
 * @param  {String} storedAppLibsId the id of the stored app
 * @return {Promise}                promise of returned app libraries
 */

function _updateAppLibsInStorage(tab, result, resolve, reject, storedAppLibsId) {
  getApplicationLibraries(tab).then(function (libraries) {
    console.log("application libraries", libraries);
    if (!libraries || libraries.length === 0) return result;

    var libsObject = result[CONTRAST__STORED_APP_LIBS];

    console.log("CONTRAST__STORED_APP_LIBS before", libsObject);
    libsObject[storedAppLibsId].libraries = libsObject[storedAppLibsId].libraries.concat(libraries);
    console.log("CONTRAST__STORED_APP_LIBS after", libsObject);

    chrome.storage.local.set(libsObject, function () {
      chrome.storage.local.get(CONTRAST__STORED_APP_LIBS, function (getted) {
        console.log("application libraries were updated", getted);
      });
    });
    console.log("updated result obj", result[CONTRAST__STORED_APP_LIBS][storedAppLibsId]);
    return resolve(result[CONTRAST__STORED_APP_LIBS][storedAppLibsId]);
  }).catch(function () {
    return new Error("Error updating stored tab");
  });
}

function getApplicationLibraries(tab) {
  return new Promise(function (resolve, reject) {
    chrome.tabs.sendMessage(tab.id, { action: GATHER_SCRIPTS }, function (response) {
      if (!response) return;
      var sharedLibraries = response.sharedLibraries;


      var libraries = sharedLibraries.map(function (lib) {
        return _createVersionedLib(tab, lib);
      });

      return Promise.all(libraries) // eslint-disable-line consistent-return
      .then(function (libResult) {
        console.log("libResult", libResult);
        var vulnerableApplicationLibs = libResult.map(function (l) {
          if (l && l.vulnerabilities && l.version && _isCorrectVersion(l.vulnerabilities, l.version)) {
            return l;
          }
          return false;
        }).filter(Boolean);
        return resolve(vulnerableApplicationLibs);
      }).catch(function (error) {
        // eslint-disable-line consistent-return
        reject(error);
        console.log("error processing libResult", error);
      });
    });
  });
}

function _setupApplicationLibraries(application, tab) {
  return new Promise(function (resolve, reject) {
    chrome.storage.local.get(CONTRAST__STORED_APP_LIBS, function (result) {
      console.log("chrome storage get CONTRAST__STORED_APP_LIBS first", result);
      // no applications have been setup, first time method has been called
      if (!result || Object.keys(result).length === 0) {
        result = _defineProperty({}, CONTRAST__STORED_APP_LIBS, {});
      }

      console.log("_setupApplicationLibraries() result from get", result);

      var storedAppLibsId = "APP_LIBS__ID_" + Object.keys(application)[0];

      if (!result[CONTRAST__STORED_APP_LIBS][storedAppLibsId]) {
        console.log("adding app libs");
        _addAppLibsToStorage(tab, result, resolve, reject, storedAppLibsId, application);
      } else if (result[CONTRAST__STORED_APP_LIBS][storedAppLibsId].application && result[CONTRAST__STORED_APP_LIBS][storedAppLibsId].libraries.length === 0) {
        console.log("updating app libs");
        _updateAppLibsInStorage(tab, result, resolve, reject, storedAppLibsId);
      } else {
        resolve(result[CONTRAST__STORED_APP_LIBS][storedAppLibsId]);
      }
    });
  });
}

/**
 * _addAppLibsToStorage - add application libraries to storage
 * @param  {Object} tab             the current tab
 * @param  {Object} result          the current app storage object
 * @param  {Function} resolve       promise resolve
 * @param  {Function} reject        promise reject
 * @param  {String} storedAppLibsId the id of the stored app
 * @param  {Object} application     the application object
 * @return {Promise}                promise of returned app libraries
 */
function _addAppLibsToStorage(tab, result, resolve, reject, storedAppLibsId, application) {
  getApplicationLibraries(tab).then(function (libraries) {
    if (!libraries || libraries.length === 0) return;

    console.log("ADDING LIBS TO STORAGE RESULT BEFORE", result);

    result[CONTRAST__STORED_APP_LIBS][storedAppLibsId] = {
      application: application,
      libraries: libraries
    };

    console.log("ADDING LIBS TO STORAGE RESULT AFTER", result);

    chrome.storage.local.set(result, function () {
      chrome.storage.local.get(CONTRAST__STORED_APP_LIBS, function (stored) {
        console.log("application libraries stored", stored);
        if (stored) {
          resolve(result[CONTRAST__STORED_APP_LIBS][storedAppLibsId]);
        }
      });
    });
  }).catch(function (error) {
    return new Error(error);
  });
}

function _isCorrectVersion(vulnerabilityObjects, libVersion) {
  if (!vulnerabilityObjects || !libVersion) return false;

  // console.log("####");
  // console.log(vulnerabilityObjects, docScripts, libName);

  for (var i = 0, len = vulnerabilityObjects.length; i < len; i++) {
    var vuln = vulnerabilityObjects[i];
    var below = vuln.below,
        atOrAbove = vuln.atOrAbove,
        above = vuln.above;

    if (below) {
      below = _parseVersionNumber(below);
    }
    if (atOrAbove) {
      atOrAbove = _parseVersionNumber(atOrAbove);
    }
    if (above) {
      above = _parseVersionNumber(above);
    }

    if (_hasVulnerableVersion(below, atOrAbove, above, libVersion)) {
      return true;
    }

    // get script obj that has matching bowername
    // compare script vuln version to vulnObj versions
    // true if is correct version
  }
  return false;
}

function _hasVulnerableVersion(below, atOrAbove, above, libVersion) {
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

function _parseVersionNumber(string) {
  return string.split("-")[0].split(/[a-zA-Z]/)[0];
}

function getStoredApplicationLibraries(application, tab) {
  chrome.storage.local.remove(CONTRAST__STORED_APP_LIBS);
  if (!application) return;
  var appHost = Object.keys(application)[0];
  if (!appHost) return;
  var appKey = "APP_LIBS__ID_" + appHost;
  if (!appKey) return;

  chrome.storage.local.get(CONTRAST__STORED_APP_LIBS, function (result) {
    console.log("result", result);
    if (!result || Object.keys(result).length === 0 || !result[CONTRAST__STORED_APP_LIBS][appKey] || !result[CONTRAST__STORED_APP_LIBS][appKey].application || !result[CONTRAST__STORED_APP_LIBS][appKey].libraries || result[CONTRAST__STORED_APP_LIBS][appKey].libraries.length === 0) {
      console.log("setting up application from getStoredApplicationLibraries");
      _setupApplicationLibraries(application, tab);
    }
    console.log("#####");
    console.log("result of get stored application libs", result);
    console.log("#####");
    return true;
  });
}

function _createVersionedLib(tab, library) {
  if (library.extractors && library.extractors.func) {
    var extractor = library.extractors.func[0];
    return _extractLibraryVersion(tab, extractor, library);
  }
  return new Promise(function (resolve) {
    return resolve(library);
  });
}

function _getVersionFromFileName(jsFileName) {
  var version = jsFileName.match(/\b\d+(?:\.\d+)*\b/);
  if (version) {
    return version[0];
  }
  return null;
}

function _extractLibraryVersion(tab, extractor, library) {
  return new Promise(function (resolve, reject) {
    _executeExtractionScript(tab, extractor, library).then(function (executed) {
      // eslint-disable-line no-unused-vars
      chrome.tabs.sendMessage(tab.id, {
        action: "GET_LIB_VERSION",
        library: library
      }, function (version) {
        if (version) {
          library.version = version;
          resolve(library);
        } else {
          console.log(library.jsFileName);
          version = _getVersionFromFileName(library.jsFileName);
          library.version = version;
          resolve(library);
        }
        return resolve(library);
      });
    }).catch(function (error) {
      console.log("Error in _extractLibraryVersion", error);
      reject(error);
    });
  });
}

function _executeExtractionScript(tab, extractor, library) {
  return new Promise(function (resolve) {
    var details = { code: _generateScriptTags({ extractor: extractor, library: library }) };
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
function _generateScriptTags(options) {
  var library = options.library.parsedLibName.replace('-', '_');
  var newScript = "\n\ttry {\n\t\tvar _c_res" + library + " = " + options.extractor + ";\n\t\tvar __docRes" + library + " = document.getElementById('__script_res_" + library + "');\n\t\t__docRes" + library + ".innerText = _c_res" + library + ";\n\t} catch (e) {\n    console.log(e)\n  }";

  return "try {\n\t\t\tvar script" + library + " = document.createElement('script');\n\t\t\tvar scriptRes" + library + " = document.createElement('span');\n      script" + library + ".innerHTML = `" + newScript + "`;\n      const elId_" + library + " = '__script_res_" + library + "'\n      const el_" + library + " = document.getElementById(elId_" + library + ");\n      if (!el_" + library + ") {\n        scriptRes" + library + ".setAttribute('id', elId_" + library + ");\n    \t\tdocument.body.appendChild(scriptRes" + library + ");\n    \t\tdocument.body.appendChild(script" + library + ");\n    \t\tscriptRes" + library + ".style.display = 'none';\n      }\n\t\t} catch (e) {}";
}