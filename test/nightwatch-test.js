module.exports = {
  'contrast' : function (browser) {
   browser.url(browser.launch_url)
          .pause(10000)
          .useCss()
          .waitForElementVisible('.jasmine-bar', 1000)
          .assert.containsText(".jasmine-bar", "0 failures")
          .end();
    }
}
