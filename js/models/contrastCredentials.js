import {
  CONTRAST_USERNAME,
  CONTRAST_SERVICE_KEY,
  CONTRAST_API_KEY,
  CONTRAST_ORG_UUID,
  TEAMSERVER_URL,
} from '../util.js';

class ContrastCredentials {
  constructor(options) {
    const {
      apiKey,
      orgUuid,
      teamServerUrl,
      serviceKey,
      profileEmail,
    } = options;
    this[CONTRAST_API_KEY] = apiKey;
    this[CONTRAST_ORG_UUID] = orgUuid;
    this[TEAMSERVER_URL] = teamServerUrl;
    this[CONTRAST_SERVICE_KEY] = serviceKey;
    this[CONTRAST_USERNAME] = profileEmail;
  }
}

export default ContrastCredentials;
