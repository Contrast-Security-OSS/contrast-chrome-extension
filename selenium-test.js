const { Builder, By, until } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')

async function allTestsSuccessful() {
  const options = new chrome.Options()
  options.addArguments(
    "load-extension=.",
    "window-size=2560,1440",
    "allow-running-insecure-content",
  )
  // options.windowSize({ height: 2560, width: 1440 })

  let driver = await new Builder().forBrowser('chrome')
                                  .setChromeOptions(options)
                                  .build()
  try {
    await driver.get('chrome-extension://pcjjnlfcfafhomibohnelgcjnbnlhopn/test/tests.html')
    await driver.sleep(10000)
    let testBar
    try {
      console.log(By.className('jasmine-bar'));
      testBar = await driver.findElement(By.className('jasmine-bar'))
    } catch (e) {
      testBar = await driver.findElement(By.xpath("//span[contains(@class, 'jasmine-bar')]"))
    }
    const testBarText = await testBar.getText()
    return testBarText.includes("0 failures")
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
