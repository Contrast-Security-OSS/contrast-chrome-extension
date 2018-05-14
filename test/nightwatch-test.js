module.exports = {
  'contrast' : function (browser) {
    console.log("BROWSER launch_url", browser.launch_url);
   browser.url(browser.launch_url)
          .pause(10000)
          .useCss()
          .waitForElementVisible('.jasmine-bar', 1000)
          .assert.containsText(".jasmine-bar", "0 failures")
          .end();
    }
}

// .useXpath()
// .waitForElementVisible("//span[contains(@class, 'jasmine-bar')]", 1000)
