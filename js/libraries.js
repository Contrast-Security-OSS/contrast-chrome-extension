/*global
	chrome,
*/

import { Helpers } from './helpers/helpers-module.js';

const {
  GATHER_SCRIPTS,
  CONTRAST__STORED_APP_LIBS,
} = Helpers;

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
  getApplicationLibraries(tab)
  .then(libraries => {
    console.log("application libraries", libraries);
    if (!libraries || libraries.length === 0) return result;

    let libsObject = result[CONTRAST__STORED_APP_LIBS];

    console.log("CONTRAST__STORED_APP_LIBS before", libsObject);
    libsObject[storedAppLibsId].libraries = libsObject[storedAppLibsId].libraries.concat(libraries);
    console.log("CONTRAST__STORED_APP_LIBS after", libsObject);

    chrome.storage.local.set(libsObject, () => {
      chrome.storage.local.get(CONTRAST__STORED_APP_LIBS, (getted) => {
        console.log("application libraries were updated", getted);
      })
    });
    console.log("updated result obj", result[CONTRAST__STORED_APP_LIBS][storedAppLibsId]);
    return resolve(result[CONTRAST__STORED_APP_LIBS][storedAppLibsId]);
  })
  .catch(() => new Error("Error updating stored tab"));
}


export function getApplicationLibraries(tab) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tab.id, { action: GATHER_SCRIPTS }, (response) => {
      if (!response) return;
      let { sharedLibraries } = response;

      const libraries = sharedLibraries.map(lib => _createVersionedLib(tab, lib));

      return Promise.all(libraries) // eslint-disable-line consistent-return
      .then(libResult => {
        const vulnerableApplicationLibs = libResult.map(l => {
          let vulnObj = _isCorrectVersion(l.vulnerabilities, l.version);
          console.log("vulnObj", vulnObj);
          if (l && l.vulnerabilities && l.version && vulnObj) {
            l.severity = vulnObj.severity;
            l.title = vulnObj.identifiers.summary;
            l.link = vulnObj.info[0];
            delete l.vulnerabilities;
            delete l.extractors;
            return l;
          }
          return false;
        }).filter(Boolean);
        return resolve(vulnerableApplicationLibs);
      })
      .catch(error => { // eslint-disable-line consistent-return
        reject(error);
        console.log("error processing libResult", error)
      });
    });
  });
}

function _setupApplicationLibraries(application, tab) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(CONTRAST__STORED_APP_LIBS, (result) => {
      console.log("chrome storage get CONTRAST__STORED_APP_LIBS first", result);
      // no applications have been setup, first time method has been called
      if (!result || Object.keys(result).length === 0) {
        result = { [CONTRAST__STORED_APP_LIBS]: {} };
      }

      console.log("_setupApplicationLibraries() result from get", result);

      const storedAppLibsId = "APP_LIBS__ID_" + Object.keys(application)[0];

      if (!result[CONTRAST__STORED_APP_LIBS][storedAppLibsId]) {
        console.log("adding app libs");
        _addAppLibsToStorage(tab, result, resolve, reject, storedAppLibsId, application);
      }

      else if (result[CONTRAST__STORED_APP_LIBS][storedAppLibsId].application && result[CONTRAST__STORED_APP_LIBS][storedAppLibsId].libraries.length === 0) {
        console.log("updating app libs");
        _updateAppLibsInStorage(tab, result, resolve, reject, storedAppLibsId);
      } else {
        resolve(result[CONTRAST__STORED_APP_LIBS][storedAppLibsId])
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
  getApplicationLibraries(tab)
  .then(libraries => {
    if (!libraries || libraries.length === 0) return;

    console.log("ADDING LIBS TO STORAGE RESULT BEFORE", result);

    result[CONTRAST__STORED_APP_LIBS][storedAppLibsId] = {
      application,
      libraries,
    }

    console.log("ADDING LIBS TO STORAGE RESULT AFTER", result);

    chrome.storage.local.set(result, () => {
      chrome.storage.local.get(CONTRAST__STORED_APP_LIBS, (stored) => {
        console.log("application libraries stored", stored);
        if (stored) {
          resolve(result[CONTRAST__STORED_APP_LIBS][storedAppLibsId]);
        }
      })
    });
  })
  .catch(error => new Error(error));
}

function _isCorrectVersion(vulnerabilityObjects, libVersion) {
  if (!vulnerabilityObjects || !libVersion) return false;

  // console.log("####");
  // console.log(vulnerabilityObjects, docScripts, libName);

  for (let i = 0, len = vulnerabilityObjects.length; i < len; i++) {
    let vuln = vulnerabilityObjects[i];
    let { below, atOrAbove, above } = vuln;
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
      return vuln;
    }

    // get script obj that has matching bowername
    // compare script vuln version to vulnObj versions
    // true if is correct version
  }
  return null;
}

function _hasVulnerableVersion(below, atOrAbove, above, libVersion) {
  if (below && atOrAbove) {
    if (libVersion < below && libVersion >= atOrAbove) {
      return true
    }
  } else if (below && above) {
    if (libVersion < below && libVersion > above) {
      return true
    }
  } else if (below && libVersion < below) {
    return true
  } else if (atOrAbove && libVersion >= atOrAbove) {
    return true
  } else if (above && libVersion > above) {
    return true
  }
  return false
}

function _parseVersionNumber(string) {
  return string.split("-")[0].split(/[a-zA-Z]/)[0];
}

export function getStoredApplicationLibraries(application, tab) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(CONTRAST__STORED_APP_LIBS);
    if (!application) return;
    const appHost = Object.keys(application)[0];
    if (!appHost) return;
    const appKey  = "APP_LIBS__ID_" + appHost;
    if (!appKey) return;

    _setupApplicationLibraries(application, tab)
    .then(libraries => {
      console.log("libraries from setup", libraries.libraries);
      if (libraries && libraries.libraries && libraries.libraries.length > 0) {
        resolve(libraries.libraries);
      } else {
        resolve([]);
      }
    })
    .catch(error => reject(error));
  });
}

function _createVersionedLib(tab, library) {
  if (library.extractors && library.extractors.func) {
    const extractor = library.extractors.func[0];
    return _extractLibraryVersion(tab, extractor, library);
  }
  return new Promise((resolve) => resolve(library));
}

function _getVersionFromFileName(jsFileName) {
  const version = jsFileName.match(/\b\d+(?:\.\d+)*\b/);
  if (version) {
    return version[0];
  }
  return null
}

function _extractLibraryVersion(tab, extractor, library) {
  return new Promise((resolve, reject) => {
    _executeExtractionScript(tab, extractor, library)
    .then(executed => { // eslint-disable-line no-unused-vars
      chrome.tabs.sendMessage(tab.id, {
        action: "GET_LIB_VERSION",
        library,
      }, (version) => {
        if (version) {
          library.version = version;
          resolve(library)
        } else {
          console.log(library.jsFileName);
          version = _getVersionFromFileName(library.jsFileName)
          library.version = version;
          resolve(library)
        }
        return resolve(library);
      })
    })
    .catch(error => {
      console.log("Error in _extractLibraryVersion", error);
      reject(error);
    });
  })
}

function _executeExtractionScript(tab, extractor, library) {
  return new Promise((resolve) => {
    const details = { code: _generateScriptTags({ extractor, library }) }
    chrome.tabs.executeScript(tab.id, details, (result) => {
      resolve(!!result);
    })
  })
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
	const library = options.library.parsedLibName.replace('-', '_');
	let newScript = `
	try {
		var _c_res${library} = ${options.extractor};
		var __docRes${library} = document.getElementById('__script_res_${library}');
		__docRes${library}.innerText = _c_res${library};
	} catch (e) {
    console.log(e)
  }`

	return (
		`try {
			var script${library} = document.createElement('script');
			var scriptRes${library} = document.createElement('span');
      script${library}.innerHTML = \`${newScript}\`;
      const elId_${library} = '__script_res_${library}'
      const el_${library} = document.getElementById(elId_${library});
      if (!el_${library}) {
        scriptRes${library}.setAttribute('id', elId_${library});
    		document.body.appendChild(scriptRes${library});
    		document.body.appendChild(script${library});
    		scriptRes${library}.style.display = 'none';
      }
		} catch (e) {}`
	);
}
