const webdriver = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')

function encode(file) {
    var stream = require('fs').readFileSync(file);
    return new Buffer(stream).toString('base64');
}

console.log("sauce keys, user, access", process.env.SAUCE_USERNAME,
process.env.SAUCE_ACCESS_KEY);

const client = require('webdriverio').remote({
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
    host: 'localhost',
    port: 4445,
    desiredCapabilities: {
        browserName: 'chrome',
        version: '66',
        platform: 'macOS 10.13',
        chromeOptions: {
          args: [
            "window-size=1024,768",
            "allow-running-insecure-content",
            `load-extensions=${__dirname}`,
            "unlimited-storage"
          ]
        }
    }
});

// extensions: [
//   encode('./contrast-chrome-extension.crx')
// ]



const CHROME_URL = 'chrome-extension://pcjjnlfcfafhomibohnelgcjnbnlhopn/test/tests.html'

// const username = process.env.SAUCE_USERNAME
// const accessKey = process.env.SAUCE_ACCESS_KEY
// const hubUrl = `http://${username}:${accessKey}@ondemand.saucelabs.com:80/wd/hub`

// let capabilities = {}
// capabilities['browserName'] = 'chrome'
// capabilities['platform'] = 'LINUX'
// // capabilities['platform'] = 'macOS 10.13'
// capabilities['version'] = '66.0'
// capabilities['javascriptEnabled'] = true
//
// // capabilities["tunnel-identifier"] = process.env.TRAVIS_JOB_NUMBER
// capabilities['username'] = username
// capabilities['accessKey'] = accessKey

// const commandExecutor = `http://${hubUrl}/wd/hub` // SELENIUM_REMOTE_URL

// const options = new chrome.Options()
// options.addArguments(
//   `load-extension=${__dirname}`,
//   "window-size=1024,768",
//   "allow-running-insecure-content",
// )
//

async function allTestsSuccessful() {

  console.log("Building driver");

  try {
    await client.init().url(CHROME_URL).pause(10000)

    const text = await client.getText('.jasmine-bar')

    console.log("Text", text);

    return text.includes("0 failures")
  } finally {
    client.close()
  }


  // const driver = await new webdriver.Builder()
  //                     .withCapabilities(capabilities)
  //                     .setChromeOptions(options)
  //                     .usingServer(hubUrl)
  //                     .build()
  //
  // console.log("Driver built", driver);
  //
  // try {
  //   console.log("Navigating to chrome extension url");
  //
  //   await driver.get(CHROME_URL)
  //
  //   console.log("Got chrome extension url, sleeping 10");
  //
  //   await driver.sleep(10000)
  //
  //   let testBar
  //
  //   try {
  //     testBar = await driver.findElement(By.className('jasmine-bar'))
  //   } catch (e) {
  //     console.log("Couldn't find element by className", e);
  //   }
  //   if (!testBar) {
  //     try {
  //       testBar = await driver.findElement(By.xpath("//span[contains(@class, 'jasmine-bar')]"))
  //     } catch (e) {
  //       console.log("Couldn't find element by xpath", e);
  //     }
  //   }
  //   if (!testBar) {
  //     throw new Error("Jasmine Bar not found")
  //     await driver.quit()
  //   }
  //   const testBarText = await testBar.getText()
  //
  //   console.log("Got testBarText", testBarText);
  //
  //   return testBarText.includes("0 failures")
  // } finally {
  //     await driver.quit()
  // }
}

allTestsSuccessful()
.then(testResult => {
  console.log("testResult", testResult);
  if (!testResult) {
    console.log("Tests failed, returning false");
    throw new Error("Tests Failed")
    return false
  }
  console.log("All tests passed, returning true");
  return true
})
