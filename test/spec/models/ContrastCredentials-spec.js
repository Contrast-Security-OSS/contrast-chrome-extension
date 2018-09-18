const chai       = require("chai");
const { expect } = chai;
const util       = require('../../../lib/util.js');
const ContrastCredentials = require('../../../lib/models/ContrastCredentials.js').default;

const {
  CONTRAST_USERNAME,
  CONTRAST_SERVICE_KEY,
  CONTRAST_API_KEY,
  CONTRAST_ORG_UUID,
  TEAMSERVER_URL,
} = util;

describe('test ContrastCredentials', function() {

  const correctObj = {
    [CONTRAST_USERNAME]: "userMcUserson",
    [CONTRAST_SERVICE_KEY]: "serviceKey123",
    [CONTRAST_API_KEY]: "apiKey123",
    [CONTRAST_ORG_UUID]: "820b994a-c848-4e50-9f9c-23b6305a8b24",
    [TEAMSERVER_URL]: "http://localhost:19090/Contrast/api",
  }

  it('returns an incorrect credential object', function() {
    let creds = new ContrastCredentials({
      apiKey: "userMcUserson",
      orgUuid: "serviceKey123",
      teamServerUrl: "apiKey123",
      serviceKey: "820b994a-c848-4e50-9f9c-23b6305a8b24",
      profileEmail: "http://localhost:19090/Contrast/api",
    });
    expect(creds).to.not.deep.equal(correctObj);
  });

  it('returns a correct credential object', function() {
    let creds = new ContrastCredentials({
      apiKey: "apiKey123",
      orgUuid: "820b994a-c848-4e50-9f9c-23b6305a8b24",
      teamServerUrl: "http://localhost:19090/Contrast/api",
      serviceKey: "serviceKey123",
      profileEmail: "userMcUserson",
    });
    expect(creds).to.deep.equal(correctObj);
  });
});
