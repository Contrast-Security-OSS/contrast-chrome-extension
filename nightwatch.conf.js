function encode(file) {
    var stream = require('fs').readFileSync(file);
    return new Buffer(stream).toString('base64');
}

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
            "load-extension=/Users/dcorderman/js/contrast-chrome-extension",
            "allow-running-insecure-content"
          ]
        }
      }
    }
  }
}
