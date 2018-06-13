export default class Application {
  constructor(application, domain) {
    this.domain = domain;
    this.app    = application;
  }

  static create(host, application) {
    return { [host]: application.app_id }
  }
}
