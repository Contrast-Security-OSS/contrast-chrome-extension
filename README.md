# Contrast Security Chrome Extension

[![Build Status](https://travis-ci.org/Contrast-Security-OSS/contrast-chrome-extension.svg?branch=master)](https://travis-ci.org/Contrast-Security-OSS/contrast-chrome-extension)

## Experimental Software

Hi! Thanks for checking out the extension. Please note that this is pre-alpha software and it is under active development. There might be bugs. We may add new features and discard other features. Feel free to let us know what you like and what you don't like through Github Issues. Thanks!

## Local Setup and Installation

1. Clone this repo
2. If you want to use a local version of Contrast, add localhost to `VALID_TEAMSERVER_HOSTNAMES` in `util.js`
3. Navigate to chrome://extensions
4. Check the 'developer mode' checkbox in the top right corner
5. Click the 'load unpacked extension' button
6. Navigate to the cloned repo and select the top level directory
7. View chrome extension in top right corner of chrome
8. Navigate to `Organization Settings > API` in Teamserver and load configuration.

### Setup

Install Mocha and Babel CLI for testing and eslint for linting.
`npm install -g mocha eslint babel-cli`

Run `./setup.sh`, it installs a Git Hook which runs tests before any new commits are pushed to this repo.

### Run Tests

```
npm run bab  # transpile js files and run tests
npm run test # run tests without transpiling
```

### Travis

We're running on Travis here: https://travis-ci.org/Contrast-Security-OSS/contrast-chrome-extension

### Linting

- Linting is done by eslint (https://eslint.org/).
- Travis build includes eslint task, so there should be no warnings for the build to succeed.
- To run eslint on all files in the js folder of the project: `eslint js`.
