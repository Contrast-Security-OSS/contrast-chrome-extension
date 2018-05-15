const webdriver = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')

// const client = require('webdriverio').remote({
//     user: process.env.SAUCE_USERNAME,
//     key: process.env.SAUCE_ACCESS_KEY,
//     host: 'localhost',
//     port: 4444,
//     desiredCapabilities: {
//         browserName: 'chrome',
//         chromeOptions: {
//           args: [
//             `load-extension=${__dirname}`,
//             "window-size=1024,768",
//             "allow-running-insecure-content",
//           ]
//         }
//     }
// });

const CHROME_URL = 'chrome-extension://pcjjnlfcfafhomibohnelgcjnbnlhopn/test/tests.html'

const username = process.env.SAUCE_USERNAME
const accessKey = process.env.SAUCE_ACCESS_KEY
const hubUrl = `http://${username}:${accessKey}@ondemand.saucelabs.com:80/wd/hub`

let capabilities = {}
capabilities['browserName'] = 'chrome'
// capabilities['platform'] = 'MAC'
capabilities['platform'] = 'macOS 10.13'
capabilities['version'] = '66.0'
capabilities['javascriptEnabled'] = true

capabilities["tunnel-identifier"] = process.env.TRAVIS_JOB_NUMBER
capabilities['username'] = username
capabilities['accessKey'] = accessKey

const commandExecutor = `http://${hubUrl}/wd/hub` // SELENIUM_REMOTE_URL

const options = new chrome.Options()
options.addArguments(
  `load-extension=${__dirname}`,
  "window-size=1024,768",
  "allow-running-insecure-content",
)

async function allTestsSuccessful() {

  // try {
  //   const text = await client.init()
  //                             .url(CHROME_URL)
  //                             .pause(10000)
  //                             .getHTML('.jasmine-bar')
  //                             .getText('.jasmine-bar')
  //
  //   console.log("Text", text);
  //
  //   return text.includes("0 failures")
  // } finally {
  //   client.close()
  // }


  const driver = new webdriver.Builder()
                      .withCapabilities(capabilities)
                      .setChromeOptions(options)
                      .usingServer(hubUrl)
                      .build()

  try {
    await driver.get(CHROME_URL)
    await driver.sleep(10000)

    let testBar

    try {
      testBar = await driver.findElement(By.className('jasmine-bar'))
    } catch (e) {
      console.log("Couldn't find element by className", e);
    }
    if (!testBar) {
      try {
        testBar = await driver.findElement(By.xpath("//span[contains(@class, 'jasmine-bar')]"))
      } catch (e) {
        console.log("Couldn't find element by xpath", e);
      }
    }
    if (!testBar) {
      throw new Error("Jasmine Bar not found")
      await driver.quit()
    }
    const testBarText = await testBar.getText()
    return testBarText.includes("0 failures")
  } finally {
      await driver.quit()
  }
}

allTestsSuccessful()
.then(testResult => {
  if (!testResult) {
    console.log("Tests failed, returning false");
    throw new Error("Tests Failed")
    return false
  }
  console.log("All tests passed, returning true");
  return true
})
