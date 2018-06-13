/*global
	chrome,
	Helpers,
*/

const {
  GATHER_SCRIPTS,
  CONTRAST__STORED_APP_LIBS,
} = Helpers;

import {
  setupApplicationLibraries,
} from './tabStorage.js'

export function getApplicationLibraries(tab) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tab.id, { action: GATHER_SCRIPTS }, (response) => {
      if (!response) return;
      let { sharedLibraries } = response;

      const libraries = sharedLibraries.map(lib => _createVersionedLib(tab, lib));

      return Promise.all(libraries)
      .then(libResult => {
        console.log("libResult", libResult);
        const vulnerableApplicationLibs = libResult.map(l => {
          if (l && l.vulnerabilities && l.version && _isCorrectVersion(l.vulnerabilities, l.version)) {
            return l;
          }
        }).filter(Boolean);
        resolve(vulnerableApplicationLibs);
      })
      .catch(error => console.log("error processing libResult", error));
    });
  });
}

function _isCorrectVersion(vulnerabilityObjects, libVersion) {
  if (!vulnerabilityObjects || !libVersion) return false;

  // console.log("####");
  // console.log(vulnerabilityObjects, docScripts, libName);

  for (let i = 0, len = vulnerabilityObjects.length; i < len; i++) {
    let vuln = vulnerabilityObjects[i];
    let { below, atOrAbove, above } = vuln;
    if (below) {
      below = below.split("-")[0];
      below = below.split(/[a-zA-Z]/)[0];
    }
    if (atOrAbove) {
      atOrAbove = atOrAbove.split("-")[0];
      atOrAbove = atOrAbove.split(/[a-zA-Z]/)[0];
    }
    if (above) {
      above = above.split("-")[0];
      above = above.split(/[a-zA-Z]/)[0];
    }

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
    // get script obj that has matching bowername
    // compare script vuln version to vulnObj versions
    // true if is correct version
  }
  return false
}

export function getStoredApplicationLibraries(application, tab) {
  chrome.storage.local.remove(CONTRAST__STORED_APP_LIBS)
  if (!application) return;
  const appHost = Object.keys(application)[0];
  if (!appHost) return;
  const appKey  = "APP_LIBS__ID_" + appHost;
  if (!appKey) return;

  chrome.storage.local.get(CONTRAST__STORED_APP_LIBS, (result) => {
    console.log("result", result);
    if (!result ||
        Object.keys(result).length === 0 ||
        !result[CONTRAST__STORED_APP_LIBS][appKey] ||
        !result[CONTRAST__STORED_APP_LIBS][appKey].application ||
        !result[CONTRAST__STORED_APP_LIBS][appKey].libraries ||
        result[CONTRAST__STORED_APP_LIBS][appKey].libraries.length === 0)
    {
      console.log("setting up application from getStoredApplicationLibraries");
      setupApplicationLibraries(application, tab)
    }
    console.log("#####");
    console.log("result of get stored application libs", result);
    console.log("#####");
    return true;
  })
}

function _createVersionedLib(tab, library) {
  if (library.extractors && library.extractors.func) {
    const extractor = library.extractors.func[0];
    return _extractLibraryVersion(tab, extractor, library);
  } else {
    return new Promise((resolve) => resolve(library));
  }
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
    .then(executed => {
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
      })
    })
    .catch(error => {
      console.log("Error in _extractLibraryVersion", error);
    });
  })
}

function _executeExtractionScript(tab, extractor, library) {
  return new Promise((resolve, reject) => {
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

	return(
		`try {
			var script${library} = document.createElement('script');
			var scriptRes${library} = document.createElement('span');
		} catch (e) {}
		script${library}.innerHTML = \`${newScript}\`;
    const elId_${library} = '__script_res_${library}'
    const el_${library} = document.getElementById(elId_${library});
    if (!el_${library}) {
      scriptRes${library}.setAttribute('id', elId_${library});
  		document.body.appendChild(scriptRes${library});
  		document.body.appendChild(script${library});
  		scriptRes${library}.style.display = 'none';
    }`
	);
}
