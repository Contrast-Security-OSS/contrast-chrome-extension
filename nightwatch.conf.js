module.exports = {
  "src_folders": "test",
  "selenium": {
    "cli_args": {
      "webdriver.chrome.driver": "/usr/local/bin/chromedriver"
    }
  },

  "test_settings": {
    "default": {
      "launch_url": "chrome-extension://pcjjnlfcfafhomibohnelgcjnbnlhopn/test/tests.html",
      "selenium_port": 4444,
      "selenium_host": "localhost",
      "silent": false
    },

    "chrome": {
      "desiredCapabilities": {
        "browserName": "chrome",
        "javascriptEnabled": true,
        "chromeOptions": {
          "args": [
            `load-extension=${__dirname}`,
            "allow-running-insecure-content",
            "disable-gpu",
            "no-sandbox"
          ]
        }
      }
    }
  }
}
