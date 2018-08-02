class Library {
  constructor(tab, library) {
    this.GET_LIB_VERSION = "GET_LIB_VERSION";
    this.tab       = tab;
    this.library   = library;
    this.extractor = null;
  }

  _setExtrator(extractor) {
    this.extractor = extractor;
  }

  _setLibraryVersion(version) {
    this.library.version = version;
  }

  createVersionedLibrary() {
    if (this.library.extractors && this.library.extractors.func) {
      this._setExtrator(this.library.extractors.func[0]);
      return this._extractLibraryVersion(); // is a promise
    }
    return new Promise(resolve => resolve(this.library));
  }

  _extractLibraryVersion() {
    return new Promise((resolve, reject) => {
      const { library, tab } = this;
      this._executeExtractionScript()
      .then(executed => { // eslint-disable-line no-unused-vars
        chrome.tabs.sendMessage(tab.id, {
          action: this.GET_LIB_VERSION,
          library,
        }, (version) => {
          console.log("VERSION RECEIVED", version);
          if (version) {
            this._setLibraryVersion(version);
            console.log("Resolving0", library);
            resolve(library)
          } else {
            this._setLibraryVersion(
              this._getVersionFromFileName(library.jsFileName));
            console.log("Resolving1", library);
            resolve(library)
          }
          console.log("Resolving2", library);
          resolve(library);
        })
      })
      .catch(error => {
        console.log("Error in _extractLibraryVersion", error);
        reject(error);
      });
    })
  }

  _getVersionFromFileName(jsFileName) {
    const version = jsFileName.match(/\b\d+(?:\.\d+)*\b/);
    if (version) {
      return version[0];
    }
    return null;
  }

  _executeExtractionScript() {
    return new Promise((resolve) => {
      const { extractor, library, tab } = this;
      const details = {
        code: this._generateScriptTags({ extractor, library })
      };
      chrome.tabs.executeScript(tab.id, details, (result) => {
        resolve(!!result);
      });
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
  _generateScriptTags() {
    console.log("EXTRACTOR AND LIBS", this.extractor, this.library);
    const { extractor } = this;
    if (!this.library.parsedLibName || !extractor) {
      return null;
    }
  	const library = this.library.parsedLibName.replace('-', '_');
  	const script  = `
  	try {
  		var _c_res${library} = ${extractor};
  		var __docRes${library} = document.getElementById('__script_res_${library}');
  		__docRes${library}.innerText = _c_res${library};
  	} catch (e) {
      console.log(e)
    }`

  	return (
  		`try {
  			var script${library} = document.createElement('script');
  			var scriptRes${library} = document.createElement('span');
        script${library}.innerHTML = \`${script}\`;
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
}

export default Library;
