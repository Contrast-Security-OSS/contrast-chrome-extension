/*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
import {
  CONNECTED_APP_DOMAINS,
} from '../util.js';

class DomainStorage {
  constructor() {
    const domains = this._getDomainsFromStorage();
    this.domains  = ["http://localhost:*/*"].concat(domains);
  }

  _getDomainsFromStorage() { // eslint-disable-line
    const domains = window.localStorage.getItem(CONNECTED_APP_DOMAINS);
    if (!domains) {
      return [];
    } else if (typeof domains === 'string') {
      return JSON.parse(domains);
    }
    return domains;
  }

  addDomainsToStorage(requestDomains) {
    let domains = this._getDomainsFromStorage();
    domains = domains.concat(requestDomains);
    this._setNewDomains(domains);
  }

  removeDomainsFromStorage(requestDomains) {
    let domains = this._getDomainsFromStorage();
    domains = domains.filter(d => !requestDomains.includes(d));
    this._setNewDomains(domains);
  }

  _setNewDomains(domains) {
    this.domains = domains;
    window.localStorage.setItem(CONNECTED_APP_DOMAINS, JSON.stringify(domains));
  }
}

export default DomainStorage;
