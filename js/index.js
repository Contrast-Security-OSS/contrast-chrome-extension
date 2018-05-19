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
        getApplications()
        .then(json => {
          if (!json) {
            throw new Error("Error getting applications")
            return
          }
          json.applications.forEach(app => createAppTableRow(app, url))
        })
        .catch(console.log)
      } else {
        renderActivityFeed(items, url)
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

function renderActivityFeed(items, url) {
  const host = getHost(url.host.split(":").join("_"))

  chrome.storage.local.get("APPS", (result) => {

    // look in stored apps array for app tied to host
    if (!!result.APPS && !!result.APPS.filter(result => result[host])[0]) {
      showActivityFeed(items)
    } else {

      // if app is not stored, render the table with buttons to add the domain
      getApplications()
      .then(json => {
        if (!json) {
          throw new Error("Error getting applications")
          return
        }

        let applications
        if (!!result.APPS) {
          const appIds = result.APPS.map(Object.values).flatten()
          applications = json.applications.filter(app => {

            // include in applications if it's not in storage
            return !appIds.includes(app.app_id)
          })
        } else {
          applications = json.applications
        }

        // create a row for each application
        applications.forEach(app => createAppTableRow(app, url))
      })
    }
  })
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

function createAppTableRow(application, url) {
  const tableBody = document.getElementById('application-table-body')
  const row       = document.createElement('tr')
  const nameTD    = document.createElement('td')
  const appIdTD   = document.createElement('td')
  const domainTD  = document.createElement('td')

  row.setAttribute('scope', 'row')

  setTextContent(appIdTD, application.app_id)
  setDisplayNone(appIdTD)

  tableBody.appendChild(row)
  row.appendChild(nameTD)
  row.appendChild(domainTD)
  row.appendChild(appIdTD)

  const host = getHost(url.host.split(":").join("_"))

  if (!url.href.includes("Contrast")) {
    const nameBtn = document.createElement('button')
    nameBtn.setAttribute('class', 'btn btn-primary btn-contrast-plugin nameBtn')
    setTextContent(nameBtn, application.name.titleize())
    nameTD.appendChild(nameBtn)

    setDisplayBlock(document.getElementById('application-table'))

    nameBtn.addEventListener('click', (event) => {
      chrome.storage.local.set({ "APPS": [{ [host]: application.app_id }] }, () => {
        setDisplayNone(document.getElementById('application-table'))
        indexFunction()
      })
    })
  } else {
    chrome.storage.local.get("APPS", (result) => {
      const storedApp = result.APPS.filter(app => {
        return Object.values(app)[0] === application.app_id
      })[0]

      if (!!storedApp) {
        const host = Object.keys(storedApp)[0]
        setTextContent(domainTD, host)
      }
      setTextContent(nameTD, application.name)
      setDisplayBlock(document.getElementById('application-table'))
    })
  }
}

function getHost(hostname) {
  const hostArray = hostname.split(".")
  if (hostArray.length < 3) {
    return [hostArray[0]]
  } else if (hostArray.length === 3) {
    return [hostArray[1]]
  } else {
    return [hostname]
  }
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


document.addEventListener('DOMContentLoaded', indexFunction, false)
