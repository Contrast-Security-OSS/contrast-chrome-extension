#!/usr/bin/env bash
# https://gist.github.com/ziadoz/3e8ab7e944d02fe872c3454d17af31a5

# Run Chrome via Selenium Server
start-chrome() {
    xvfb-run java -Dwebdriver.chrome.driver=/usr/local/bin/chromedriver -jar /usr/local/bin/selenium-server-standalone.jar
}

start-chrome-debug() {
    xvfb-run java -Dwebdriver.chrome.driver=/usr/local/bin/chromedriver -jar /usr/local/bin/selenium-server-standalone.jar -debug
}

# Run Chrome Headless
start-chrome-headless() {
    chromedriver --url-base=/wd/hub
}

# Start
# start-chrome
# start-chrome-debug
start-chrome-headless()
