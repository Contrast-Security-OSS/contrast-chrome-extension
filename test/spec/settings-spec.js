// describe('setting the initial credentials for the extension from teamserver', () => {
//
//   const dummyElement       = document.createElement('button')
//   const dummyUsername      = document.createElement('input')
//   const dummyServiceKey    = document.createElement('input')
//   const dummyApiKey        = document.createElement('input')
//   const dummyOrgUuid       = document.createElement('input')
//   const dummyTeamserverUrl = document.createElement('input')
//
//   dummyUsername.value      = "contrast_admin"
//   dummyServiceKey.value    = "demo"
//   dummyApiKey.value        = "demo"
//   dummyOrgUuid.value       = "04bfd6c5-b24e-4610-b8b9-bcbde09f8e15"
//   dummyTeamserverUrl.value = "localhost:19080"
//
//   beforeAll(() => {
//     const contrastCredentials = {
//       [CONTRAST_USERNAME]: dummyUsername.value,
//       [CONTRAST_SERVICE_KEY]: dummyServiceKey.value,
//       [CONTRAST_API_KEY]: dummyApiKey.value,
//       [CONTRAST_ORG_UUID]: dummyOrgUuid.value,
//       [TEAMSERVER_URL]: processTeamserverUrl(dummyTeamserverUrl.value),
//     }
//
//     dummyElement.click = function() {
//       chrome.storage.local.set(contrastCredentials)
//     }
//     chrome.storage.local.clear()
//   })
//
//   it('fills in empty credentials', (done) => {
//     const username      = dummyUsername.value.trim()
//     const serviceKey    = dummyServiceKey.value.trim()
//     const apiKey        = dummyApiKey.value.trim()
//     const orgUuid       = dummyOrgUuid.value.trim()
//     const teamserverUrl = processTeamserverUrl(dummyTeamserverUrl.value.trim())
//
//     expect(username).toEqual(dummyUsername.value)
//     expect(serviceKey).toEqual(dummyServiceKey.value)
//     expect(apiKey).toEqual(dummyApiKey.value)
//     expect(orgUuid).toEqual(dummyOrgUuid.value)
//     expect(teamserverUrl).toEqual("https://localhost:19080/Contrast/api")
//
//     chrome.storage.local.get([
//       CONTRAST_USERNAME,
//       CONTRAST_SERVICE_KEY,
//       CONTRAST_API_KEY,
//       CONTRAST_ORG_UUID,
//       TEAMSERVER_URL,
//     ], (items) => {
//       expect(Object.values(items).length).toEqual(0)
//       done()
//     })
//
//     dummyElement.click()
//
//     chrome.storage.local.get([
//       CONTRAST_USERNAME,
//       CONTRAST_SERVICE_KEY,
//       CONTRAST_API_KEY,
//       CONTRAST_ORG_UUID,
//       TEAMSERVER_URL,
//     ], (items) => {
//       expect(Object.values(items).length).toEqual(5)
//       done()
//     })
//   })
// })
