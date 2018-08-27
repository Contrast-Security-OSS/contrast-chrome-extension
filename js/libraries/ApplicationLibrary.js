import {
  GATHER_SCRIPTS,
  CONTRAST__STORED_APP_LIBS,
  isEmptyObject,
} from '../util.js';

import Library from './Library.js';
import VulnerableApplicationLibrary from './VulnerableApplicationLibrary.js';

class ApplicationLibrary {
  constructor(tab, application) {
    this.tab                = tab;
    this.application        = application;
    this.libraries          = [];
    this.STORED_APP_LIBS_ID = "APP_LIBS__ID_" + application.domain;
  }

  _setCurrentLibs(libraries) {
    if (libraries && Array.isArray(libraries)) {
      this.libraries = libraries.filter(Boolean);
    }
  }

  getApplicationLibraries() {
    return new Promise((resolve, reject) => {
      const { tab } = this;
      chrome.tabs.sendMessage(tab.id, { action: GATHER_SCRIPTS, tab }, (response) => {
        if (!response) {
          reject(new Error("No Response to GATHER_SCRIPTS"));
          return;
        }
        // console.log("RESPONSE", response);
        const { sharedLibraries } = response;
        let libraries;
        try {
          libraries = sharedLibraries.map(lib => {
            return (new Library(tab, lib).createVersionedLibrary());
          });
        } catch (e) {
          // console.log("Error mapping sharedLibraries", e);
          return;
        }
        // console.log("LIBRARIES FROM SHARED", libraries);
        Promise.all(libraries) // eslint-disable-line consistent-return
        .then(libResult => {
          // console.log("LIB RESULT", libResult);
          const vulnerableApplicationLibs = libResult.map(l => {
            let vAL = new VulnerableApplicationLibrary(l);

            if (l && l.vulnerabilities && l.version) {
              // confident version is in app
              return vAL.highConfidenceVulnerability();
            }
            // not confident version is in app
            return vAL.lowConfidenceVulnerabilities();
          }).filter(Boolean);
          // console.log("VULNERABLE APP LIBS", vulnerableApplicationLibs);
          resolve(vulnerableApplicationLibs);
        })
        .catch(error => {
          // console.log("Error in promise.all libs", error);
        });
      });
    });
  }

  addNewApplicationLibraries(libsToAdd) {
    return new Promise(async(resolve) => {
      // console.log("ADDING NEW APPLICATION LIBS", libsToAdd);
      const { STORED_APP_LIBS_ID } = this;
      const libraries = await this._getStoredApplicationLibraries();
      // console.log("LIBS FROM STORAGE", libraries);

      // console.log("Libraries from _getStoredApplicationLibraries", libraries);

      // console.log("PREVIOUS STORED LIBS", libraries);
      // console.log(libraries[CONTRAST__STORED_APP_LIBS]);
      // console.log("APPLICATION ID", STORED_APP_LIBS_ID);

      const currentLibs = libraries[CONTRAST__STORED_APP_LIBS] ? libraries[CONTRAST__STORED_APP_LIBS][STORED_APP_LIBS_ID] : null;

      this._setCurrentLibs(currentLibs);

      if (!libraries || isEmptyObject(libraries)) {
        // console.log("LIBS EMPTY, INIT");
        libraries[CONTRAST__STORED_APP_LIBS] = {};
        libraries[CONTRAST__STORED_APP_LIBS][STORED_APP_LIBS_ID] = libsToAdd;
      }

      else if (isEmptyObject(libraries[CONTRAST__STORED_APP_LIBS])
               || !currentLibs
               || !Array.isArray(currentLibs)) {

        // console.log("LIBS NO CURRENT, 2nd", libraries[CONTRAST__STORED_APP_LIBS]);
        libraries[CONTRAST__STORED_APP_LIBS][STORED_APP_LIBS_ID] = libsToAdd;
      }

      else {
        // console.log("UPDATING LIBS");
        const deDupedNewLibs = this._dedupeLibs(libsToAdd);
        // console.log("DEDEUPTED LIBS", deDupedNewLibs);
        if (deDupedNewLibs.length === 0) {
          resolve(null);
          return;
        }

        const newLibs = currentLibs.concat(deDupedNewLibs);
        libraries[CONTRAST__STORED_APP_LIBS][STORED_APP_LIBS_ID] = newLibs;
      }
      // console.log("SETTING NEW LIBS", libraries);
      chrome.storage.local.set(libraries, function() {
        chrome.storage.local.get(CONTRAST__STORED_APP_LIBS, function(stored) {
          // console.log("NEW STORED LIBS", stored);
          resolve(stored[CONTRAST__STORED_APP_LIBS][STORED_APP_LIBS_ID]);
        });
      });
    });
  }

  _getStoredApplicationLibraries() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(CONTRAST__STORED_APP_LIBS, (stored) => {
        // console.log("application libraries in storage", stored);
        if (!stored || isEmptyObject(stored)) {
          resolve({});
        } else {
          resolve(stored);
        }
        reject(new Error("Stored Libs are", typeof stored));
      })
    });
  }

  _dedupeLibs(newLibs) {
   // console.log("NEWLIBS", newLibs);
   // console.log("CURRENT LIBRARIES", this.libraries);
   return newLibs.filter(nL => { // filter out libs that are in storage already
     let filteredCurrentLibs = this.libraries.filter(cL => {
       if (cL.name === nL.name && nL.vulnerabilitiesCount > 1) {
         if (cL.vulnerabilities.length === nL.vulnerabilities.length) {
           return true; // no new vulnerabilities
         }
         nL.vulnerabilities = nL.vulnerabilities.filter(nLv => {
           return cL.vulnerabilities.filter(cLv => cLv.title !== nLv.title);
         });
         return nL.vulnerabilities.length === 0; // no new vulnerabilities
       }

       return cL.name === nL.name;
     })

     // if current libs contains the new libs return false and don't add the new lib
     // console.log("FILTERED LIBS", filteredCurrentLibs, !!filteredCurrentLibs[0], !filteredCurrentLibs[0]);
     return !filteredCurrentLibs[0];
   });
 }

  removeAndSetupApplicationLibraries() {
    if (!this.application || !this.STORED_APP_LIBS_ID) {
      throw new Error("Application and STORED_APP_LIBS_ID are not set.");
    }
    chrome.storage.local.remove(CONTRAST__STORED_APP_LIBS);

    return this._setupApplicationLibraries();
  }

  async _setupApplicationLibraries() {
    const libs = await this.getApplicationLibraries();
    if (!libs || libs.length === 0) {
      // console.log("No Libs to Add.");
      return null;
    }

    return this.addNewApplicationLibraries(libs);
  }


}

export default ApplicationLibrary;
