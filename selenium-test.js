const { Builder, By, until } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')

async function allTestsSuccessful() {
  const options = new chrome.Options()
  options.addArguments("load-extension=.")

  let driver = await new Builder().forBrowser('chrome')
                                  .setChromeOptions(options)
                                  .build()
  try {
    await driver.get('chrome-extension://pcjjnlfcfafhomibohnelgcjnbnlhopn/test/tests.html')
    await driver.sleep(10000)
    let testBar
    try {
      testBar = await driver.findElement(By.className('jasmine-overall-result'))
    } catch (e) {
      testBar = await driver.findElement(By.className('jasmine-bar'))
    }
    const testBarText = await testBar.getText()
    if (testBarText.includes("0 failures")) {
      return true
    }
    return false
  } finally {
      await driver.quit()
  }
}

allTestsSuccessful().then(testResult => {
  if (!testResult) {
    console.log("Tests failed, returning false");
    throw new Error("Tests Failed")
    return false
  }
  console.log("All tests passed, returning true");
  return true
})
