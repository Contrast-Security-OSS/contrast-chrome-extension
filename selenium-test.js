const { Builder, By, until } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')

async function allTestsSuccessful() {
  const options = new chrome.Options()
  options.addArguments(
    `load-extension=${__dirname}`,
    "window-size=1024,768",
    "allow-running-insecure-content",
  )

  let driver = await new Builder().forBrowser('chrome')
                                  .setChromeOptions(options)
                                  .build()
  try {
    await driver.get('chrome-extension://pcjjnlfcfafhomibohnelgcjnbnlhopn/test/tests.html')
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

allTestsSuccessful().then(testResult => {
  if (!testResult) {
    console.log("Tests failed, returning false");
    throw new Error("Tests Failed")
    return false
  }
  console.log("All tests passed, returning true");
  return true
})
