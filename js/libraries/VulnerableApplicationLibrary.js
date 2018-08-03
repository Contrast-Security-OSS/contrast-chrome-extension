class VulnerableApplicationLibrary {
  constructor(vulnerableLibrary) {
    this.name = vulnerableLibrary.name || vulnerableLibrary.parsedLibName;
    this.vulnerabilities      = vulnerableLibrary.vulnerabilities;
    this.vulnerabilitiesCount = vulnerableLibrary.vulnerabilities.length;
    this.version              = vulnerableLibrary.version;
  }

  lowConfidenceVulnerabilities() {
    return {
      name: this.name,
      confidenceIsCorrectLibrary: 'LOW',
      vulnerabilitiesCount: this.vulnerabilitiesCount,
      vulnerabilities: this.vulnerabilities.map(v => {
        // console.log("V", v);
        let versions = {};
        v.atOrAbove ? versions.atOrAbove = v.atOrAbove : null;
        v.atOrBelow ? versions.atOrBelow = v.atOrBelow : null;
        v.above ? versions.above = v.above : null;
        v.below ? versions.below = v.below : null;
        return {
          title: v.identifiers.summary,
          link: v.info[0],
          severity: v.severity,
          versions,
        };
      }),
    };
  }

  highConfidenceVulnerability() {
    // console.log("THIS VulnerableApplicationLibrary", this);
    let vulnObj = this._isCorrectVersion(this.vulnerabilities, this.version);
    if (!vulnObj) return vulnObj;
    return {
      name: this.name,
      severity: vulnObj.severity,
      title: vulnObj.identifiers.summary,
      link: vulnObj.info[0],
      confidenceIsCorrectLibrary: 'HIGH',
      vulnerabilities: this.vulnerabilities,
      vulnerabilitiesCount: this.vulnerabilitiesCount,
    }
  }

  _isCorrectVersion(vulnerabilityObjects, libVersion) {
    if (!vulnerabilityObjects || !libVersion) return false;

    // console.log("####");
    // console.log(vulnerabilityObjects, docScripts, libName);

    for (let i = 0, len = vulnerabilityObjects.length; i < len; i++) {
      let vuln = vulnerabilityObjects[i];
      let { below, atOrAbove, above } = vuln;
      if (below) {
        below = this._parseVersionNumber(below);
      }
      if (atOrAbove) {
        atOrAbove = this._parseVersionNumber(atOrAbove);
      }
      if (above) {
        above = this._parseVersionNumber(above);
      }
      // console.log(below, atOrAbove, above, libVersion, vuln);
      if (this._hasVulnerableVersion(below, atOrAbove, above, libVersion)) {
        return vuln;
      }

      // get script obj that has matching bowername
      // compare script vuln version to vulnObj versions
      // true if is correct version
    }
    return null;
  }

  _hasVulnerableVersion(below, atOrAbove, above, libVersion) {
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

  _parseVersionNumber(string) {
    return string.split("-")[0].split(/[a-zA-Z]/)[0];
  }
}

export default VulnerableApplicationLibrary;
