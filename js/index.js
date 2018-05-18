/*global
  chrome,
  document,
  VALID_TEAMSERVER_HOSTNAMES,
  TEAMSERVER_ACCOUNT_PATH_SUFFIX,
  TEAMSERVER_INDEX_PATH_SUFFIX,
  TEAMSERVER_PROFILE_PATH_SUFFIX,
  URL,
  getStoredCredentials,
  isCredentialed
*/
"use strict";

/**
 * indexFunction - Main function that's run, renders config button if user is on TS Your Account Page, otherwise renders vulnerability feed
 *
 * @return {void}
 */
function indexFunction() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

    const tab = tabs[0]
    const url = new URL(tab.url)

    getStoredCredentials().then(items => {

      if (!isCredentialed(items)) {
        getUserCredentials(tab, url)
      } else if (isCredentialed(items) && isTeamserverAccountPage(tab, url)) {
        let configureExtensionButton = document.getElementById('configure-extension-button')
        setTextContent(configureExtensionButton, "Reconfigure")
        getUserCredentials(tab, url)
      } else {
        showActivityFeed(items)
      }

      //configure button opens up settings page in new tab
      let configureButton = document.getElementById('configure')
      configureButton.addEventListener('click', () => {
        chrome.tabs.create({ url: chromeExtensionSettingsUrl() })
      }, false)
    })
  })
}

function getUserCredentials(tab, url) {
  if (isTeamserverAccountPage(tab, url)) {

    setDisplayEmpty(document.getElementById('configure-extension'))

    let configureExtensionHost = document.getElementById('configure-extension-host');
    setTextContent(configureExtensionHost, "Make sure you trust this site: " + url.hostname);

    renderConfigButton(tab)
  } else {
    setDisplayEmpty(document.getElementById('not-configured'))
  }

  setDisplayNone(document.getElementById('vulnerabilities-found-on-page'))
}

function renderConfigButton(tab) {
  let noVulnerabilitiesFoundOnPageSection = document.getElementById('no-vulnerabilities-found-on-page')
  let configureExtensionButton = document.getElementById('configure-extension-button')

  configureExtensionButton.addEventListener('click', (e) => {
    configureExtensionButton.setAttribute('disabled', true)

    // credentials are set by sending a message to content-script
    chrome.tabs.sendMessage(tab.id, { url: tab.url, action: "INITIALIZE" }, (response) => {
      if (response === "INITIALIZED") {

        chrome.browserAction.setBadgeText({ tabId: tab.id, text: '' })
        setDisplayNone(noVulnerabilitiesFoundOnPageSection)

        // recurse on this method, credentials should have been set in content-script so this part of indexFunction will not be evaluated again
        const successMessage = document.getElementById('config-success')
        setDisplayBlock(successMessage)
        setTimeout(() => {
          configureExtensionButton.removeAttribute('disabled')
          setDisplayNone(successMessage)
          indexFunction()
        }, 1000)
      } else {
        configureExtensionButton.removeAttribute('disabled')
        const failureMessage = document.getElementById('config-failure')
        setDisplayBlock(failureMessage)
        setTimeout(() => setDisplayNone(failureMessage), 2000)
      }
      return
    })
  }, false)
}

function showActivityFeed(items) {
  const extensionId = chrome.runtime.id;

  // find sections
  let notConfiguredSection = document.getElementById('not-configured');
  let configureExtension   = document.getElementById('configure-extension');
  let vulnerabilitiesFoundOnPageSection = document.getElementById('vulnerabilities-found-on-page');

  // if you don't need credentials, hide the signin functionality
  setDisplayNone(configureExtension)
  setDisplayNone(notConfiguredSection)

  let visitOrgLink = document.getElementById('visit-org')
  let userEmail    = document.getElementById('user-email')
  setTextContent(userEmail, "User: " + items.contrast_username)

  visitOrgLink.addEventListener('click', () => {
    const contrastIndex = items.teamserver_url.indexOf("/Contrast/api")
    const teamserverUrl = items.teamserver_url.substring(0, contrastIndex)
    chrome.tabs.create({ url: teamserverUrl })
  }, false)

  let signInButtonConfigurationProblem = document.getElementById('sign-in-button-configuration-problem')

  signInButtonConfigurationProblem.addEventListener('click', () => {
    chrome.tabs.create({ url: chromeExtensionSettingsUrl() })
  }, false)
}

// --------- HELPER FUNCTIONS -------------
function setDisplayNone(element) {
  if (!element) return
  element.style.display = 'none'
}

function setDisplayEmpty(element) {
  if (!element) return
  element.style.display = ''
}

function setDisplayBlock(element) {
  if (!element) return
  element.style.display = 'block'
}

function setTextContent(element, text) {
  if (!element || (!text && text !== "")) return
  element.textContent = text
}

function chromeExtensionSettingsUrl() {
  const extensionId = chrome.runtime.id
  return 'chrome-extension://' + String(extensionId) + '/settings.html'
}

function isTeamserverAccountPage(tab, url) {
  if (!tab || !url) return

  // tab.url.startsWith("http") &&
  // VALID_TEAMSERVER_HOSTNAMES.includes(url.hostname) &&
  // tab.url.endsWith(TEAMSERVER_ACCOUNT_PATH_SUFFIX) || tab.url.endsWith(TEAMSERVER_PROFILE_PATH_SUFFIX)
  //   && tab.url.indexOf(TEAMSERVER_INDEX_PATH_SUFFIX) !== -1

  const conditions = [
    tab.url.startsWith("http"),
    VALID_TEAMSERVER_HOSTNAMES.includes(url.hostname),
    tab.url.endsWith(TEAMSERVER_ACCOUNT_PATH_SUFFIX) || tab.url.endsWith(TEAMSERVER_PROFILE_PATH_SUFFIX),
    tab.url.indexOf(TEAMSERVER_INDEX_PATH_SUFFIX) !== -1
  ]
  return conditions.every(c => !!c)
}


document.addEventListener('DOMContentLoaded', indexFunction, false);
