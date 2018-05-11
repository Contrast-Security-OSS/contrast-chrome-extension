const {Builder, By, Key, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

(async function example() {
  let driver = await new Builder().forBrowser('chrome').build();
  try {
    await driver.get('./tests.html');
    await driver.findElement(By.class('jasmine-overall-result'))
    await driver.wait(until.titleIs('webdriver - Google Search'), 1000);
  } finally {
    await driver.quit();
  }
})();
