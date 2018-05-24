# Contrast Security Chrome Extension

[![Build Status](https://travis-ci.org/Contrast-Security-OSS/contrast-chrome-extension.svg?branch=master)](https://travis-ci.org/Contrast-Security-OSS/contrast-chrome-extension)

## Experimental Software

Hi! Thanks for checking out the extension. Please note that this is pre-alpha software and it is under active development. There might be bugs. We may add new features and discard other features. Feel free to let us know what you like and what you don't like through Github Issues. Thanks!

## Local Setup and Installation

1. Clone this repo
2. Navigate to chrome://extensions
3. Check the 'developer mode' checkbox in the top right corner
4. Click the 'load unpacked extension' button
5. Navigate to the clone repo and select the top level directory
6. View chrome extension in top right corner of chrome
7. Navigate to `Your Account` in Teamserver and load configuration.

## Testing

We're using QUnit: https://qunitjs.com/

### Setup

Install Git Hook that removes all `console.log`, `debugger` and `localhost` strings.
`./setup.sh`

Install QUnit for testing.
`npm install -g qunit`

### Run Tests

`qunit`

### Travis

We're running on Travis here: https://travis-ci.org/Contrast-Security-OSS/contrast-chrome-extension

### Linting
* Linting is done by node-jslint (https://github.com/reid/node-jslint). Configuration options: https://github.com/reid/node-jslint/blob/master/doc/jslint.md
* Travis build includes jslint task, so there should be no warnings for the build to succeed.
* To run jslint on all files in the js folder of the project: ``` jslint 'js/*.js' ```.
