exports['tests the popup index.html file for changes renders a table of applications 1'] = `

    <p id="connected-domain-message" class="hidden"></p>
    <div id="applications-heading-container" style="display: none;">
      <h5 id="applications-heading">Your Applications</h5>
      <h5 id="applications-arrow">
        <svg fill="currentColor" preserveAspectRatio="xMidYMid meet" height="22" width="22" class="cs-react-icon css-1ovp8yv e1db9b1o0" viewBox="0 0 1024 1024" style="vertical-align: middle;"><g><path d="M826.2 654.6l-3.6-4.2-272-313c-9.2-10.6-23-17.2-38.4-17.2s-29.2 6.8-38.4 17.2L197.4 655c-3.4 5-5.4 11-5.4 17.4 0 17.4 14.8 31.6 33.2 31.6h573.6c18.4 0 33.2-14.2 33.2-31.6 0-6.6-2.2-12.8-5.8-17.8z"></path></g></svg>
      </h5>
    </div>
    <div id="table-container" class="collapsed">
      <table class="table table-responsive" id="application-table">
        <tbody id="application-table-body">
        <tr><td></td><td></td></tr></tbody>
      </table>
    </div>
  
`

exports['tests the popup index.html file for changes takes a snapshot of the base index.html file 1'] = `
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css" integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous">
  <link rel="stylesheet" href="../style.css">
  <link href="https://fonts.googleapis.com/css?family=Lato" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet">
  <script type="module" src="../js/util.js"></script>
  <script type="module" src="../js/popupMethods.js" charset="utf-8"></script>
  <script type="module" src="../js/popup.js"></script>
  <script type="module" src="../js/index.js"></script>
</head>

<body>
  <section class="headers-section section">
    <div id="configuration-header" class="flex-row header-row flex-row-head">
      <img src="../icon.png" alt="" class="logo-icon flex-row-item">
      <div id="header-text" class="flex-row-item">
        <h5>
          <strong>Contrast</strong>
        </h5>
        <p id="config-header-text" class="no-margin scalable-subtext">Set Up Configuration</p>
      </div>
    </div>
    <div id="vulnerabilities-header" class="flex-row header-row">
      <img src="../icon.png" alt="" class="logo-icon flex-row-item">
      <div id="header-text" class="flex-row-item">
        <h5>
          <strong>Contrast</strong>
        </h5>
        <p id="vulns-header-text" class="no-margin scalable-subtext">Vulnerabilities</p>
      </div>
      <div class="flex-row-item">
        <div class="flex-row">
          <img id="libs-loading" class="loading-icon" src="/img/ring-alt.gif" alt="loading">
          <span id="scan-libs-text" class="scalable-subtext">Scan Libraries</span>
        </div>
      </div>
    </div>
  </section>

  <section id="vulnerabilities-section" class="panel panel-default section">
    <div class="color-gray panel-body" id="no-vulnerabilities-found">
      <h5>No vulnerabilities were found.</h5>
    </div>

    <div id="vulnerabilities-found-on-page" class="panel-body">
      <div class="app-vulnerabilities-div">
        <ul class="list-group" id="vulnerabilities-found-on-page-list">
        </ul>
      </div>
      <div class="app-libraries-div">
        <div class="hidden" id="libs-vulnerabilities-found-on-page">
          <ul class="list-group" id="libs-vulnerabilities-found-on-page-list">
          </ul>
        </div>

        <h4 id="found-libs-message" class="hidden"></h4>
      </div>
    </div>
  </section>

  <div id="application-table-container-div">
    <p id="connected-domain-message" class="hidden"></p>
    <div id="applications-heading-container">
      <h5 id="applications-heading">Your Applications</h5>
      <h5 id="applications-arrow">
        <svg fill="currentColor" preserveAspectRatio="xMidYMid meet" height="22" width="22" class="cs-react-icon css-1ovp8yv e1db9b1o0" viewBox="0 0 1024 1024" style="vertical-align: middle;"><g><path d="M826.2 654.6l-3.6-4.2-272-313c-9.2-10.6-23-17.2-38.4-17.2s-29.2 6.8-38.4 17.2L197.4 655c-3.4 5-5.4 11-5.4 17.4 0 17.4 14.8 31.6 33.2 31.6h573.6c18.4 0 33.2-14.2 33.2-31.6 0-6.6-2.2-12.8-5.8-17.8z"></path></g></svg>
      </h5>
    </div>
    <div id="table-container" class="collapsed">
      <table class="table table-responsive" id="application-table">
        <tbody id="application-table-body">
        </tbody>
      </table>
    </div>
  </div>

  <section id="configuration-section" class="section">
    <div class="container color-gray panel-body" id="configure-extension">
      <form>
        <div class="form-group">
          <label id="contrast-url-input-label" for="contrast-url-input">Contrast URL</label>
          <input readonly="" placeholder="https://<domain>.contrastsecurity.com" class="form-control user-inputs" type="text" name="" value="" id="contrast-url-input">
        </div>
        <div class="form-group">
          <input id="contrast-service-key-input" readonly="" placeholder="Service Key" class="form-control user-inputs" type="text" name="" value="">
          <input id="contrast-username-input" readonly="" placeholder="Username" class="form-control user-inputs" type="text" name="" value="">
          <input id="contrast-api-key-input" readonly="" placeholder="API Key" class="form-control user-inputs" type="text" name="" value="">
          <button class="btn btn-primary btn-xs btn-contrast-plugin" type="button" name="button" id="configure-extension-button">Configure</button>
        </div>
      </form>
      <h5 id="config-success" class="configure-message hidden">
        <span id="success-check">
          <svg fill="currentColor" preserveAspectRatio="xMidYMid meet" height="22" width="22" class="cs-react-icon css-1ovp8yv e1db9b1o0" viewBox="0 0 1024 1024" style="vertical-align: middle;"><g><path d="M954.857 332.572q0 22.857-16 38.857L447.428 862.858q-16 16-38.857 16t-38.857-16L85.143 578.287q-16-16-16-38.857t16-38.857l77.714-77.714q16-16 38.857-16t38.857 16l168 168.571 374.857-375.429q16-16 38.857-16t38.857 16l77.714 77.714q16 16 16 38.857z"></path></g></svg>
        </span>
        Successfully Configured!
      </h5>
      <h5 id="config-failure" class="configure-message hidden">
        <span id="error-x">
          <svg fill="currentColor" preserveAspectRatio="xMidYMid meet" height="22" width="22" class="cs-react-icon css-1ovp8yv e1db9b1o0" viewBox="0 0 1024 1024" style="vertical-align: middle;"><g><path d="M640 512l327.111-327.111-128-128L512 384 184.889 56.889l-128 128L384 512 56.889 839.111l128 128L512 640l327.111 327.111 128-128L640 512z"></path></g></svg>
        </span>Error Configuring, try reloading the page.
      </h5>
    </div>
  </section>

  <section class="footers-section section">
    <div id="configuration-footer" class="flex-row footer-row">
      <div>
        <p id="config-footer-text" class="color-gray wide-lines scalable-subtext">Let's get you started. To configure the Contrast extension for Chrome, <a class="contrast-green" href="#">log into Contrast</a> and go to Your Account so we can grab your keys.</p>
      </div>
    </div>
    <div id="configured-footer" class="flex-row footer-row flex-row-foot">
      <div class="color-gray" id="user-email"></div>
      <div id="gear-container">
        <svg id="configure-gear" fill="currentColor" preserveAspectRatio="xMidYMid meet" height="25px" width="25px" class="configure-gear" viewBox="0 0 1024 1024"><g><path d="M585.143 521.143q0-60.571-42.857-103.429t-103.429-42.857-103.429 42.857-42.857 103.429 42.857 103.429 103.429 42.857 103.429-42.857 42.857-103.429zm292.571-62.286v126.857q0 6.857-4.571 13.143t-11.429 7.429l-105.714 16q-10.857 30.857-22.286 52 20 28.571 61.143 78.857 5.714 6.857 5.714 14.286t-5.143 13.143q-15.429 21.143-56.571 61.714t-53.714 40.571q-6.857 0-14.857-5.143L591.429 816q-25.143 13.143-52 21.714-9.143 77.714-16.571 106.286-4 16-20.571 16H375.43q-8 0-14-4.857t-6.571-12.286l-16-105.143q-28-9.143-51.429-21.143l-80.571 61.143q-5.714 5.143-14.286 5.143-8 0-14.286-6.286-72-65.143-94.286-96-4-5.714-4-13.143 0-6.857 4.571-13.143 8.571-12 29.143-38t30.857-40.286q-15.429-28.571-23.429-56.571L16.572 603.999q-7.429-1.143-12-7.143T.001 583.427V456.57q0-6.857 4.571-13.143t10.857-7.429l106.286-16q8-26.286 22.286-52.571-22.857-32.571-61.143-78.857-5.714-6.857-5.714-13.714 0-5.714 5.143-13.143 14.857-20.571 56.286-61.429t54-40.857q7.429 0 14.857 5.714l78.857 61.143q25.143-13.143 52-21.714 9.143-77.714 16.571-106.286 4-16 20.571-16h126.857q8 0 14 4.857t6.571 12.286l16 105.143q28 9.143 51.429 21.143l81.143-61.143q5.143-5.143 13.714-5.143 7.429 0 14.286 5.714 73.714 68 94.286 97.143 4 4.571 4 12.571 0 6.857-4.571 13.143-8.571 12-29.143 38t-30.857 40.286q14.857 28.571 23.429 56l104.571 16q7.429 1.143 12 7.143t4.571 13.429z"></path></g></svg>
      </div>
      <!-- <img id="configure-gear" class="configure-gear" src="/img/glyphicons-cog.png" alt="gear"> -->
    </div>
  </section>




</body>
`

exports['tests the popup index.html file for changes takes a snapshot of the contrastConfigured index.html file 1'] = `
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css" integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous">
  <link rel="stylesheet" href="../style.css">
  <link href="https://fonts.googleapis.com/css?family=Lato" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet">
  <script type="module" src="../js/util.js"></script>
  <script type="module" src="../js/popupMethods.js" charset="utf-8"></script>
  <script type="module" src="../js/popup.js"></script>
  <script type="module" src="../js/index.js"></script>
</head>

<body>
  <section class="headers-section section">
    <div id="configuration-header" class="flex-row header-row flex-row-head" style="display: none;">
      <img src="../icon.png" alt="" class="logo-icon flex-row-item">
      <div id="header-text" class="flex-row-item">
        <h5>
          <strong>Contrast</strong>
        </h5>
        <p id="config-header-text" class="no-margin scalable-subtext">Set Up Configuration</p>
      </div>
    </div>
    <div id="vulnerabilities-header" class="flex-row header-row flex-row-head" style="display: flex;">
      <img src="../icon.png" alt="" class="logo-icon flex-row-item">
      <div id="header-text" class="flex-row-item">
        <h5>
          <strong>Contrast</strong>
        </h5>
        <p id="vulns-header-text" class="no-margin scalable-subtext">Vulnerabilities</p>
      </div>
      <div class="flex-row-item">
        <div class="flex-row">
          <img id="libs-loading" class="loading-icon" src="/img/ring-alt.gif" alt="loading">
          <span id="scan-libs-text" class="scalable-subtext" style="display: none;">Scan Libraries</span>
        </div>
      </div>
    </div>
  </section>

  <section id="vulnerabilities-section" class="panel panel-default section" style="display: none;">
    <div class="color-gray panel-body" id="no-vulnerabilities-found">
      <h5>No vulnerabilities were found.</h5>
    </div>

    <div id="vulnerabilities-found-on-page" class="panel-body">
      <div class="app-vulnerabilities-div">
        <ul class="list-group" id="vulnerabilities-found-on-page-list">
        </ul>
      </div>
      <div class="app-libraries-div">
        <div class="hidden" id="libs-vulnerabilities-found-on-page">
          <ul class="list-group" id="libs-vulnerabilities-found-on-page-list">
          </ul>
        </div>

        <h4 id="found-libs-message" class="hidden"></h4>
      </div>
    </div>
  </section>

  <div id="application-table-container-div" style="display: none;">
    <p id="connected-domain-message" class="hidden"></p>
    <div id="applications-heading-container">
      <h5 id="applications-heading">Your Applications</h5>
      <h5 id="applications-arrow">
        <svg fill="currentColor" preserveAspectRatio="xMidYMid meet" height="22" width="22" class="cs-react-icon css-1ovp8yv e1db9b1o0" viewBox="0 0 1024 1024" style="vertical-align: middle;"><g><path d="M826.2 654.6l-3.6-4.2-272-313c-9.2-10.6-23-17.2-38.4-17.2s-29.2 6.8-38.4 17.2L197.4 655c-3.4 5-5.4 11-5.4 17.4 0 17.4 14.8 31.6 33.2 31.6h573.6c18.4 0 33.2-14.2 33.2-31.6 0-6.6-2.2-12.8-5.8-17.8z"></path></g></svg>
      </h5>
    </div>
    <div id="table-container" class="collapsed">
      <table class="table table-responsive" id="application-table">
        <tbody id="application-table-body">
        </tbody>
      </table>
    </div>
  </div>

  <section id="configuration-section" class="section collapsed" style="display: block;">
    <div class="container color-gray panel-body" id="configure-extension" style="display: block;">
      <form>
        <div class="form-group">
          <label id="contrast-url-input-label" for="contrast-url-input">Contrast URL</label>
          <input readonly="" placeholder="https://<domain>.contrastsecurity.com" class="form-control user-inputs" type="text" name="" value="" id="contrast-url-input">
        </div>
        <div class="form-group">
          <input id="contrast-service-key-input" readonly="" placeholder="Service Key" class="form-control user-inputs" type="text" name="" value="">
          <input id="contrast-username-input" readonly="" placeholder="Username" class="form-control user-inputs" type="text" name="" value="">
          <input id="contrast-api-key-input" readonly="" placeholder="API Key" class="form-control user-inputs" type="text" name="" value="">
          <button class="btn btn-primary btn-xs btn-contrast-plugin" type="button" name="button" id="configure-extension-button" style="display: none;">Configure</button>
        </div>
      </form>
      <h5 id="config-success" class="configure-message hidden">
        <span id="success-check">
          <svg fill="currentColor" preserveAspectRatio="xMidYMid meet" height="22" width="22" class="cs-react-icon css-1ovp8yv e1db9b1o0" viewBox="0 0 1024 1024" style="vertical-align: middle;"><g><path d="M954.857 332.572q0 22.857-16 38.857L447.428 862.858q-16 16-38.857 16t-38.857-16L85.143 578.287q-16-16-16-38.857t16-38.857l77.714-77.714q16-16 38.857-16t38.857 16l168 168.571 374.857-375.429q16-16 38.857-16t38.857 16l77.714 77.714q16 16 16 38.857z"></path></g></svg>
        </span>
        Successfully Configured!
      </h5>
      <h5 id="config-failure" class="configure-message hidden">
        <span id="error-x">
          <svg fill="currentColor" preserveAspectRatio="xMidYMid meet" height="22" width="22" class="cs-react-icon css-1ovp8yv e1db9b1o0" viewBox="0 0 1024 1024" style="vertical-align: middle;"><g><path d="M640 512l327.111-327.111-128-128L512 384 184.889 56.889l-128 128L384 512 56.889 839.111l128 128L512 640l327.111 327.111 128-128L640 512z"></path></g></svg>
        </span>Error Configuring, try reloading the page.
      </h5>
    </div>
  </section>

  <section class="footers-section section">
    <div id="configuration-footer" class="flex-row footer-row" style="display: none;">
      <div>
        <p id="config-footer-text" class="color-gray wide-lines scalable-subtext">Let's get you started. To configure the Contrast extension for Chrome, <a class="contrast-green" href="#">log into Contrast</a> and go to Your Account so we can grab your keys.</p>
      </div>
    </div>
    <div id="configured-footer" class="flex-row footer-row flex-row-foot" style="display: flex;">
      <div class="color-gray" id="user-email" style="display: block;"></div>
      <div id="gear-container">
        <svg id="configure-gear" fill="currentColor" preserveAspectRatio="xMidYMid meet" height="25px" width="25px" class="configure-gear" viewBox="0 0 1024 1024" style="display: block;"><g><path d="M585.143 521.143q0-60.571-42.857-103.429t-103.429-42.857-103.429 42.857-42.857 103.429 42.857 103.429 103.429 42.857 103.429-42.857 42.857-103.429zm292.571-62.286v126.857q0 6.857-4.571 13.143t-11.429 7.429l-105.714 16q-10.857 30.857-22.286 52 20 28.571 61.143 78.857 5.714 6.857 5.714 14.286t-5.143 13.143q-15.429 21.143-56.571 61.714t-53.714 40.571q-6.857 0-14.857-5.143L591.429 816q-25.143 13.143-52 21.714-9.143 77.714-16.571 106.286-4 16-20.571 16H375.43q-8 0-14-4.857t-6.571-12.286l-16-105.143q-28-9.143-51.429-21.143l-80.571 61.143q-5.714 5.143-14.286 5.143-8 0-14.286-6.286-72-65.143-94.286-96-4-5.714-4-13.143 0-6.857 4.571-13.143 8.571-12 29.143-38t30.857-40.286q-15.429-28.571-23.429-56.571L16.572 603.999q-7.429-1.143-12-7.143T.001 583.427V456.57q0-6.857 4.571-13.143t10.857-7.429l106.286-16q8-26.286 22.286-52.571-22.857-32.571-61.143-78.857-5.714-6.857-5.714-13.714 0-5.714 5.143-13.143 14.857-20.571 56.286-61.429t54-40.857q7.429 0 14.857 5.714l78.857 61.143q25.143-13.143 52-21.714 9.143-77.714 16.571-106.286 4-16 20.571-16h126.857q8 0 14 4.857t6.571 12.286l16 105.143q28 9.143 51.429 21.143l81.143-61.143q5.143-5.143 13.714-5.143 7.429 0 14.286 5.714 73.714 68 94.286 97.143 4 4.571 4 12.571 0 6.857-4.571 13.143-8.571 12-29.143 38t-30.857 40.286q14.857 28.571 23.429 56l104.571 16q7.429 1.143 12 7.143t4.571 13.429z"></path></g></svg>
      </div>
      <!-- <img id="configure-gear" class="configure-gear" src="/img/glyphicons-cog.png" alt="gear"> -->
    </div>
  </section>




</body>
`

exports['tests the popup index.html file for changes takes a snapshot of the contrastNotConfigured index.html file 1'] = `
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css" integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous">
  <link rel="stylesheet" href="../style.css">
  <link href="https://fonts.googleapis.com/css?family=Lato" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet">
  <script type="module" src="../js/util.js"></script>
  <script type="module" src="../js/popupMethods.js" charset="utf-8"></script>
  <script type="module" src="../js/popup.js"></script>
  <script type="module" src="../js/index.js"></script>
</head>

<body>
  <section class="headers-section section">
    <div id="configuration-header" class="flex-row header-row flex-row-head" style="display: flex;">
      <img src="../icon.png" alt="" class="logo-icon flex-row-item">
      <div id="header-text" class="flex-row-item">
        <h5>
          <strong>Contrast</strong>
        </h5>
        <p id="config-header-text" class="no-margin scalable-subtext">Set Up Configuration</p>
      </div>
    </div>
    <div id="vulnerabilities-header" class="flex-row header-row" style="display: none;">
      <img src="../icon.png" alt="" class="logo-icon flex-row-item">
      <div id="header-text" class="flex-row-item">
        <h5>
          <strong>Contrast</strong>
        </h5>
        <p id="vulns-header-text" class="no-margin scalable-subtext">Vulnerabilities</p>
      </div>
      <div class="flex-row-item">
        <div class="flex-row">
          <img id="libs-loading" class="loading-icon" src="/img/ring-alt.gif" alt="loading">
          <span id="scan-libs-text" class="scalable-subtext" style="display: none;">Scan Libraries</span>
        </div>
      </div>
    </div>
  </section>

  <section id="vulnerabilities-section" class="panel panel-default section" style="display: none;">
    <div class="color-gray panel-body" id="no-vulnerabilities-found">
      <h5>No vulnerabilities were found.</h5>
    </div>

    <div id="vulnerabilities-found-on-page" class="panel-body">
      <div class="app-vulnerabilities-div">
        <ul class="list-group" id="vulnerabilities-found-on-page-list">
        </ul>
      </div>
      <div class="app-libraries-div">
        <div class="hidden" id="libs-vulnerabilities-found-on-page">
          <ul class="list-group" id="libs-vulnerabilities-found-on-page-list">
          </ul>
        </div>

        <h4 id="found-libs-message" class="hidden"></h4>
      </div>
    </div>
  </section>

  <div id="application-table-container-div" style="display: none;">
    <p id="connected-domain-message" class="hidden"></p>
    <div id="applications-heading-container">
      <h5 id="applications-heading">Your Applications</h5>
      <h5 id="applications-arrow">
        <svg fill="currentColor" preserveAspectRatio="xMidYMid meet" height="22" width="22" class="cs-react-icon css-1ovp8yv e1db9b1o0" viewBox="0 0 1024 1024" style="vertical-align: middle;"><g><path d="M826.2 654.6l-3.6-4.2-272-313c-9.2-10.6-23-17.2-38.4-17.2s-29.2 6.8-38.4 17.2L197.4 655c-3.4 5-5.4 11-5.4 17.4 0 17.4 14.8 31.6 33.2 31.6h573.6c18.4 0 33.2-14.2 33.2-31.6 0-6.6-2.2-12.8-5.8-17.8z"></path></g></svg>
      </h5>
    </div>
    <div id="table-container" class="collapsed">
      <table class="table table-responsive" id="application-table">
        <tbody id="application-table-body">
        </tbody>
      </table>
    </div>
  </div>

  <section id="configuration-section" class="section">
    <div class="container color-gray panel-body" id="configure-extension" style="display: block;">
      <form>
        <div class="form-group">
          <label id="contrast-url-input-label" for="contrast-url-input">Contrast URL</label>
          <input readonly="" placeholder="https://<domain>.contrastsecurity.com" class="form-control user-inputs" type="text" name="" value="" id="contrast-url-input">
        </div>
        <div class="form-group">
          <input id="contrast-service-key-input" readonly="" placeholder="Service Key" class="form-control user-inputs" type="text" name="" value="">
          <input id="contrast-username-input" readonly="" placeholder="Username" class="form-control user-inputs" type="text" name="" value="">
          <input id="contrast-api-key-input" readonly="" placeholder="API Key" class="form-control user-inputs" type="text" name="" value="">
          <button class="btn btn-primary btn-xs btn-contrast-plugin" type="button" name="button" id="configure-extension-button" style="display: none;">Configure</button>
        </div>
      </form>
      <h5 id="config-success" class="configure-message hidden">
        <span id="success-check">
          <svg fill="currentColor" preserveAspectRatio="xMidYMid meet" height="22" width="22" class="cs-react-icon css-1ovp8yv e1db9b1o0" viewBox="0 0 1024 1024" style="vertical-align: middle;"><g><path d="M954.857 332.572q0 22.857-16 38.857L447.428 862.858q-16 16-38.857 16t-38.857-16L85.143 578.287q-16-16-16-38.857t16-38.857l77.714-77.714q16-16 38.857-16t38.857 16l168 168.571 374.857-375.429q16-16 38.857-16t38.857 16l77.714 77.714q16 16 16 38.857z"></path></g></svg>
        </span>
        Successfully Configured!
      </h5>
      <h5 id="config-failure" class="configure-message hidden">
        <span id="error-x">
          <svg fill="currentColor" preserveAspectRatio="xMidYMid meet" height="22" width="22" class="cs-react-icon css-1ovp8yv e1db9b1o0" viewBox="0 0 1024 1024" style="vertical-align: middle;"><g><path d="M640 512l327.111-327.111-128-128L512 384 184.889 56.889l-128 128L384 512 56.889 839.111l128 128L512 640l327.111 327.111 128-128L640 512z"></path></g></svg>
        </span>Error Configuring, try reloading the page.
      </h5>
    </div>
  </section>

  <section class="footers-section section">
    <div id="configuration-footer" class="flex-row footer-row" style="display: block;">
      <div>
        <p id="config-footer-text" class="color-gray wide-lines scalable-subtext">Let's get you started. To configure the Contrast extension for Chrome, <a class="contrast-green" href="#">log into Contrast</a> and go to Your Account so we can grab your keys.</p>
      </div>
    </div>
    <div id="configured-footer" class="flex-row footer-row flex-row-foot" style="display: none;">
      <div class="color-gray" id="user-email"></div>
      <div id="gear-container">
        <svg id="configure-gear" fill="currentColor" preserveAspectRatio="xMidYMid meet" height="25px" width="25px" class="configure-gear" viewBox="0 0 1024 1024" style="display: block;"><g><path d="M585.143 521.143q0-60.571-42.857-103.429t-103.429-42.857-103.429 42.857-42.857 103.429 42.857 103.429 103.429 42.857 103.429-42.857 42.857-103.429zm292.571-62.286v126.857q0 6.857-4.571 13.143t-11.429 7.429l-105.714 16q-10.857 30.857-22.286 52 20 28.571 61.143 78.857 5.714 6.857 5.714 14.286t-5.143 13.143q-15.429 21.143-56.571 61.714t-53.714 40.571q-6.857 0-14.857-5.143L591.429 816q-25.143 13.143-52 21.714-9.143 77.714-16.571 106.286-4 16-20.571 16H375.43q-8 0-14-4.857t-6.571-12.286l-16-105.143q-28-9.143-51.429-21.143l-80.571 61.143q-5.714 5.143-14.286 5.143-8 0-14.286-6.286-72-65.143-94.286-96-4-5.714-4-13.143 0-6.857 4.571-13.143 8.571-12 29.143-38t30.857-40.286q-15.429-28.571-23.429-56.571L16.572 603.999q-7.429-1.143-12-7.143T.001 583.427V456.57q0-6.857 4.571-13.143t10.857-7.429l106.286-16q8-26.286 22.286-52.571-22.857-32.571-61.143-78.857-5.714-6.857-5.714-13.714 0-5.714 5.143-13.143 14.857-20.571 56.286-61.429t54-40.857q7.429 0 14.857 5.714l78.857 61.143q25.143-13.143 52-21.714 9.143-77.714 16.571-106.286 4-16 20.571-16h126.857q8 0 14 4.857t6.571 12.286l16 105.143q28 9.143 51.429 21.143l81.143-61.143q5.143-5.143 13.714-5.143 7.429 0 14.286 5.714 73.714 68 94.286 97.143 4 4.571 4 12.571 0 6.857-4.571 13.143-8.571 12-29.143 38t-30.857 40.286q14.857 28.571 23.429 56l104.571 16q7.429 1.143 12 7.143t4.571 13.429z"></path></g></svg>
      </div>
      <!-- <img id="configure-gear" class="configure-gear" src="/img/glyphicons-cog.png" alt="gear"> -->
    </div>
  </section>




</body>
`

exports['tests the popup index.html file for changes takes a snapshot of the contrastYourAccountConfigured index.html file 1'] = `
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css" integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous">
  <link rel="stylesheet" href="../style.css">
  <link href="https://fonts.googleapis.com/css?family=Lato" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet">
  <script type="module" src="../js/util.js"></script>
  <script type="module" src="../js/popupMethods.js" charset="utf-8"></script>
  <script type="module" src="../js/popup.js"></script>
  <script type="module" src="../js/index.js"></script>
</head>

<body>
  <section class="headers-section section">
    <div id="configuration-header" class="flex-row header-row flex-row-head" style="display: none;">
      <img src="../icon.png" alt="" class="logo-icon flex-row-item">
      <div id="header-text" class="flex-row-item">
        <h5>
          <strong>Contrast</strong>
        </h5>
        <p id="config-header-text" class="no-margin scalable-subtext">Set Up Configuration</p>
      </div>
    </div>
    <div id="vulnerabilities-header" class="flex-row header-row flex-row-head" style="display: flex;">
      <img src="../icon.png" alt="" class="logo-icon flex-row-item">
      <div id="header-text" class="flex-row-item">
        <h5>
          <strong>Contrast</strong>
        </h5>
        <p id="vulns-header-text" class="no-margin scalable-subtext">Vulnerabilities</p>
      </div>
      <div class="flex-row-item">
        <div class="flex-row">
          <img id="libs-loading" class="loading-icon" src="/img/ring-alt.gif" alt="loading">
          <span id="scan-libs-text" class="scalable-subtext" style="display: none;">Scan Libraries</span>
        </div>
      </div>
    </div>
  </section>

  <section id="vulnerabilities-section" class="panel panel-default section" style="display: none;">
    <div class="color-gray panel-body" id="no-vulnerabilities-found">
      <h5>No vulnerabilities were found.</h5>
    </div>

    <div id="vulnerabilities-found-on-page" class="panel-body">
      <div class="app-vulnerabilities-div">
        <ul class="list-group" id="vulnerabilities-found-on-page-list">
        </ul>
      </div>
      <div class="app-libraries-div">
        <div class="hidden" id="libs-vulnerabilities-found-on-page">
          <ul class="list-group" id="libs-vulnerabilities-found-on-page-list">
          </ul>
        </div>

        <h4 id="found-libs-message" class="hidden"></h4>
      </div>
    </div>
  </section>

  <div id="application-table-container-div" style="display: none;">
    <p id="connected-domain-message" class="hidden"></p>
    <div id="applications-heading-container">
      <h5 id="applications-heading">Your Applications</h5>
      <h5 id="applications-arrow">
        <svg fill="currentColor" preserveAspectRatio="xMidYMid meet" height="22" width="22" class="cs-react-icon css-1ovp8yv e1db9b1o0" viewBox="0 0 1024 1024" style="vertical-align: middle;"><g><path d="M826.2 654.6l-3.6-4.2-272-313c-9.2-10.6-23-17.2-38.4-17.2s-29.2 6.8-38.4 17.2L197.4 655c-3.4 5-5.4 11-5.4 17.4 0 17.4 14.8 31.6 33.2 31.6h573.6c18.4 0 33.2-14.2 33.2-31.6 0-6.6-2.2-12.8-5.8-17.8z"></path></g></svg>
      </h5>
    </div>
    <div id="table-container" class="collapsed">
      <table class="table table-responsive" id="application-table">
        <tbody id="application-table-body">
        </tbody>
      </table>
    </div>
  </div>

  <section id="configuration-section" class="section" style="display: block;">
    <div class="container color-gray panel-body" id="configure-extension" style="display: block;">
      <form>
        <div class="form-group">
          <label id="contrast-url-input-label" for="contrast-url-input">Contrast URL</label>
          <input readonly="" placeholder="https://<domain>.contrastsecurity.com" class="form-control user-inputs" type="text" name="" value="" id="contrast-url-input">
        </div>
        <div class="form-group">
          <input id="contrast-service-key-input" readonly="" placeholder="Service Key" class="form-control user-inputs" type="text" name="" value="">
          <input id="contrast-username-input" readonly="" placeholder="Username" class="form-control user-inputs" type="text" name="" value="">
          <input id="contrast-api-key-input" readonly="" placeholder="API Key" class="form-control user-inputs" type="text" name="" value="">
          <button class="btn btn-primary btn-xs btn-contrast-plugin" type="button" name="button" id="configure-extension-button" style="display: block;">Configure</button>
        </div>
      </form>
      <h5 id="config-success" class="configure-message hidden">
        <span id="success-check">
          <svg fill="currentColor" preserveAspectRatio="xMidYMid meet" height="22" width="22" class="cs-react-icon css-1ovp8yv e1db9b1o0" viewBox="0 0 1024 1024" style="vertical-align: middle;"><g><path d="M954.857 332.572q0 22.857-16 38.857L447.428 862.858q-16 16-38.857 16t-38.857-16L85.143 578.287q-16-16-16-38.857t16-38.857l77.714-77.714q16-16 38.857-16t38.857 16l168 168.571 374.857-375.429q16-16 38.857-16t38.857 16l77.714 77.714q16 16 16 38.857z"></path></g></svg>
        </span>
        Successfully Configured!
      </h5>
      <h5 id="config-failure" class="configure-message hidden">
        <span id="error-x">
          <svg fill="currentColor" preserveAspectRatio="xMidYMid meet" height="22" width="22" class="cs-react-icon css-1ovp8yv e1db9b1o0" viewBox="0 0 1024 1024" style="vertical-align: middle;"><g><path d="M640 512l327.111-327.111-128-128L512 384 184.889 56.889l-128 128L384 512 56.889 839.111l128 128L512 640l327.111 327.111 128-128L640 512z"></path></g></svg>
        </span>Error Configuring, try reloading the page.
      </h5>
    </div>
  </section>

  <section class="footers-section section">
    <div id="configuration-footer" class="flex-row footer-row" style="display: none;">
      <div>
        <p id="config-footer-text" class="color-gray wide-lines scalable-subtext">Let's get you started. To configure the Contrast extension for Chrome, <a class="contrast-green" href="#">log into Contrast</a> and go to Your Account so we can grab your keys.</p>
      </div>
    </div>
    <div id="configured-footer" class="flex-row footer-row flex-row-foot" style="display: flex;">
      <div class="color-gray" id="user-email" style="display: block;"></div>
      <div id="gear-container">
        <svg id="configure-gear" fill="currentColor" preserveAspectRatio="xMidYMid meet" height="25px" width="25px" class="configure-gear" viewBox="0 0 1024 1024" style="display: block;"><g><path d="M585.143 521.143q0-60.571-42.857-103.429t-103.429-42.857-103.429 42.857-42.857 103.429 42.857 103.429 103.429 42.857 103.429-42.857 42.857-103.429zm292.571-62.286v126.857q0 6.857-4.571 13.143t-11.429 7.429l-105.714 16q-10.857 30.857-22.286 52 20 28.571 61.143 78.857 5.714 6.857 5.714 14.286t-5.143 13.143q-15.429 21.143-56.571 61.714t-53.714 40.571q-6.857 0-14.857-5.143L591.429 816q-25.143 13.143-52 21.714-9.143 77.714-16.571 106.286-4 16-20.571 16H375.43q-8 0-14-4.857t-6.571-12.286l-16-105.143q-28-9.143-51.429-21.143l-80.571 61.143q-5.714 5.143-14.286 5.143-8 0-14.286-6.286-72-65.143-94.286-96-4-5.714-4-13.143 0-6.857 4.571-13.143 8.571-12 29.143-38t30.857-40.286q-15.429-28.571-23.429-56.571L16.572 603.999q-7.429-1.143-12-7.143T.001 583.427V456.57q0-6.857 4.571-13.143t10.857-7.429l106.286-16q8-26.286 22.286-52.571-22.857-32.571-61.143-78.857-5.714-6.857-5.714-13.714 0-5.714 5.143-13.143 14.857-20.571 56.286-61.429t54-40.857q7.429 0 14.857 5.714l78.857 61.143q25.143-13.143 52-21.714 9.143-77.714 16.571-106.286 4-16 20.571-16h126.857q8 0 14 4.857t6.571 12.286l16 105.143q28 9.143 51.429 21.143l81.143-61.143q5.143-5.143 13.714-5.143 7.429 0 14.286 5.714 73.714 68 94.286 97.143 4 4.571 4 12.571 0 6.857-4.571 13.143-8.571 12-29.143 38t-30.857 40.286q14.857 28.571 23.429 56l104.571 16q7.429 1.143 12 7.143t4.571 13.429z"></path></g></svg>
      </div>
      <!-- <img id="configure-gear" class="configure-gear" src="/img/glyphicons-cog.png" alt="gear"> -->
    </div>
  </section>




</body>
`

exports['tests the popup index.html file for changes takes a snapshot of the contrastYourAccountNotConfigured index.html file 1'] = `
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css" integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous">
  <link rel="stylesheet" href="../style.css">
  <link href="https://fonts.googleapis.com/css?family=Lato" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet">
  <script type="module" src="../js/util.js"></script>
  <script type="module" src="../js/popupMethods.js" charset="utf-8"></script>
  <script type="module" src="../js/popup.js"></script>
  <script type="module" src="../js/index.js"></script>
</head>

<body>
  <section class="headers-section section">
    <div id="configuration-header" class="flex-row header-row flex-row-head" style="display: flex;">
      <img src="../icon.png" alt="" class="logo-icon flex-row-item">
      <div id="header-text" class="flex-row-item">
        <h5>
          <strong>Contrast</strong>
        </h5>
        <p id="config-header-text" class="no-margin scalable-subtext">Set Up Configuration</p>
      </div>
    </div>
    <div id="vulnerabilities-header" class="flex-row header-row" style="display: none;">
      <img src="../icon.png" alt="" class="logo-icon flex-row-item">
      <div id="header-text" class="flex-row-item">
        <h5>
          <strong>Contrast</strong>
        </h5>
        <p id="vulns-header-text" class="no-margin scalable-subtext">Vulnerabilities</p>
      </div>
      <div class="flex-row-item">
        <div class="flex-row">
          <img id="libs-loading" class="loading-icon" src="/img/ring-alt.gif" alt="loading">
          <span id="scan-libs-text" class="scalable-subtext" style="display: none;">Scan Libraries</span>
        </div>
      </div>
    </div>
  </section>

  <section id="vulnerabilities-section" class="panel panel-default section" style="display: none;">
    <div class="color-gray panel-body" id="no-vulnerabilities-found">
      <h5>No vulnerabilities were found.</h5>
    </div>

    <div id="vulnerabilities-found-on-page" class="panel-body">
      <div class="app-vulnerabilities-div">
        <ul class="list-group" id="vulnerabilities-found-on-page-list">
        </ul>
      </div>
      <div class="app-libraries-div">
        <div class="hidden" id="libs-vulnerabilities-found-on-page">
          <ul class="list-group" id="libs-vulnerabilities-found-on-page-list">
          </ul>
        </div>

        <h4 id="found-libs-message" class="hidden"></h4>
      </div>
    </div>
  </section>

  <div id="application-table-container-div" style="display: none;">
    <p id="connected-domain-message" class="hidden"></p>
    <div id="applications-heading-container">
      <h5 id="applications-heading">Your Applications</h5>
      <h5 id="applications-arrow">
        <svg fill="currentColor" preserveAspectRatio="xMidYMid meet" height="22" width="22" class="cs-react-icon css-1ovp8yv e1db9b1o0" viewBox="0 0 1024 1024" style="vertical-align: middle;"><g><path d="M826.2 654.6l-3.6-4.2-272-313c-9.2-10.6-23-17.2-38.4-17.2s-29.2 6.8-38.4 17.2L197.4 655c-3.4 5-5.4 11-5.4 17.4 0 17.4 14.8 31.6 33.2 31.6h573.6c18.4 0 33.2-14.2 33.2-31.6 0-6.6-2.2-12.8-5.8-17.8z"></path></g></svg>
      </h5>
    </div>
    <div id="table-container" class="collapsed">
      <table class="table table-responsive" id="application-table">
        <tbody id="application-table-body">
        </tbody>
      </table>
    </div>
  </div>

  <section id="configuration-section" class="section">
    <div class="container color-gray panel-body collapsed" id="configure-extension" style="display: block;">
      <form>
        <div class="form-group">
          <label id="contrast-url-input-label" for="contrast-url-input">Contrast URL</label>
          <input readonly="" placeholder="https://<domain>.contrastsecurity.com" class="form-control user-inputs" type="text" name="" value="" id="contrast-url-input">
        </div>
        <div class="form-group">
          <input id="contrast-service-key-input" readonly="" placeholder="Service Key" class="form-control user-inputs" type="text" name="" value="">
          <input id="contrast-username-input" readonly="" placeholder="Username" class="form-control user-inputs" type="text" name="" value="">
          <input id="contrast-api-key-input" readonly="" placeholder="API Key" class="form-control user-inputs" type="text" name="" value="">
          <button class="btn btn-primary btn-xs btn-contrast-plugin" type="button" name="button" id="configure-extension-button" style="display: block;">Configure</button>
        </div>
      </form>
      <h5 id="config-success" class="configure-message hidden">
        <span id="success-check">
          <svg fill="currentColor" preserveAspectRatio="xMidYMid meet" height="22" width="22" class="cs-react-icon css-1ovp8yv e1db9b1o0" viewBox="0 0 1024 1024" style="vertical-align: middle;"><g><path d="M954.857 332.572q0 22.857-16 38.857L447.428 862.858q-16 16-38.857 16t-38.857-16L85.143 578.287q-16-16-16-38.857t16-38.857l77.714-77.714q16-16 38.857-16t38.857 16l168 168.571 374.857-375.429q16-16 38.857-16t38.857 16l77.714 77.714q16 16 16 38.857z"></path></g></svg>
        </span>
        Successfully Configured!
      </h5>
      <h5 id="config-failure" class="configure-message hidden">
        <span id="error-x">
          <svg fill="currentColor" preserveAspectRatio="xMidYMid meet" height="22" width="22" class="cs-react-icon css-1ovp8yv e1db9b1o0" viewBox="0 0 1024 1024" style="vertical-align: middle;"><g><path d="M640 512l327.111-327.111-128-128L512 384 184.889 56.889l-128 128L384 512 56.889 839.111l128 128L512 640l327.111 327.111 128-128L640 512z"></path></g></svg>
        </span>Error Configuring, try reloading the page.
      </h5>
    </div>
  </section>

  <section class="footers-section section">
    <div id="configuration-footer" class="flex-row footer-row" style="display: block;">
      <div>
        <p id="config-footer-text" class="color-gray wide-lines scalable-subtext">Let's get you started. To configure the Contrast extension for Chrome, <a class="contrast-green" href="#">log into Contrast</a> and go to Your Account so we can grab your keys.</p>
      </div>
    </div>
    <div id="configured-footer" class="flex-row footer-row flex-row-foot" style="display: none;">
      <div class="color-gray" id="user-email"></div>
      <div id="gear-container">
        <svg id="configure-gear" fill="currentColor" preserveAspectRatio="xMidYMid meet" height="25px" width="25px" class="configure-gear" viewBox="0 0 1024 1024" style="display: block;"><g><path d="M585.143 521.143q0-60.571-42.857-103.429t-103.429-42.857-103.429 42.857-42.857 103.429 42.857 103.429 103.429 42.857 103.429-42.857 42.857-103.429zm292.571-62.286v126.857q0 6.857-4.571 13.143t-11.429 7.429l-105.714 16q-10.857 30.857-22.286 52 20 28.571 61.143 78.857 5.714 6.857 5.714 14.286t-5.143 13.143q-15.429 21.143-56.571 61.714t-53.714 40.571q-6.857 0-14.857-5.143L591.429 816q-25.143 13.143-52 21.714-9.143 77.714-16.571 106.286-4 16-20.571 16H375.43q-8 0-14-4.857t-6.571-12.286l-16-105.143q-28-9.143-51.429-21.143l-80.571 61.143q-5.714 5.143-14.286 5.143-8 0-14.286-6.286-72-65.143-94.286-96-4-5.714-4-13.143 0-6.857 4.571-13.143 8.571-12 29.143-38t30.857-40.286q-15.429-28.571-23.429-56.571L16.572 603.999q-7.429-1.143-12-7.143T.001 583.427V456.57q0-6.857 4.571-13.143t10.857-7.429l106.286-16q8-26.286 22.286-52.571-22.857-32.571-61.143-78.857-5.714-6.857-5.714-13.714 0-5.714 5.143-13.143 14.857-20.571 56.286-61.429t54-40.857q7.429 0 14.857 5.714l78.857 61.143q25.143-13.143 52-21.714 9.143-77.714 16.571-106.286 4-16 20.571-16h126.857q8 0 14 4.857t6.571 12.286l16 105.143q28 9.143 51.429 21.143l81.143-61.143q5.143-5.143 13.714-5.143 7.429 0 14.286 5.714 73.714 68 94.286 97.143 4 4.571 4 12.571 0 6.857-4.571 13.143-8.571 12-29.143 38t-30.857 40.286q14.857 28.571 23.429 56l104.571 16q7.429 1.143 12 7.143t4.571 13.429z"></path></g></svg>
      </div>
      <!-- <img id="configure-gear" class="configure-gear" src="/img/glyphicons-cog.png" alt="gear"> -->
    </div>
  </section>




</body>
`

exports['tests the popup index.html file for changes takes a snapshot of the notContrastConfigured index.html file 1'] = `
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css" integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous">
  <link rel="stylesheet" href="../style.css">
  <link href="https://fonts.googleapis.com/css?family=Lato" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet">
  <script type="module" src="../js/util.js"></script>
  <script type="module" src="../js/popupMethods.js" charset="utf-8"></script>
  <script type="module" src="../js/popup.js"></script>
  <script type="module" src="../js/index.js"></script>
</head>

<body>
  <section class="headers-section section">
    <div id="configuration-header" class="flex-row header-row flex-row-head" style="display: none;">
      <img src="../icon.png" alt="" class="logo-icon flex-row-item">
      <div id="header-text" class="flex-row-item">
        <h5>
          <strong>Contrast</strong>
        </h5>
        <p id="config-header-text" class="no-margin scalable-subtext">Set Up Configuration</p>
      </div>
    </div>
    <div id="vulnerabilities-header" class="flex-row header-row flex-row-space-between" style="display: flex;">
      <img src="../icon.png" alt="" class="logo-icon flex-row-item">
      <div id="header-text" class="flex-row-item">
        <h5>
          <strong>Contrast</strong>
        </h5>
        <p id="vulns-header-text" class="no-margin scalable-subtext" style="font-size: 3.75vw;">Vulnerabilities</p>
      </div>
      <div class="flex-row-item">
        <div class="flex-row">
          <img id="libs-loading" class="loading-icon" src="/img/ring-alt.gif" alt="loading">
          <span id="scan-libs-text" class="scalable-subtext" style="display: none;">Scan Libraries</span>
        </div>
      </div>
    </div>
  </section>

  <section id="vulnerabilities-section" class="panel panel-default section" style="display: flex;">
    <div class="color-gray panel-body" id="no-vulnerabilities-found">
      <h5>No vulnerabilities were found.</h5>
    </div>

    <div id="vulnerabilities-found-on-page" class="panel-body">
      <div class="app-vulnerabilities-div">
        <ul class="list-group" id="vulnerabilities-found-on-page-list">
        </ul>
      </div>
      <div class="app-libraries-div">
        <div class="hidden" id="libs-vulnerabilities-found-on-page">
          <ul class="list-group" id="libs-vulnerabilities-found-on-page-list">
          </ul>
        </div>

        <h4 id="found-libs-message" class="hidden"></h4>
      </div>
    </div>
  </section>

  <div id="application-table-container-div" style="display: none;">
    <p id="connected-domain-message" class="hidden"></p>
    <div id="applications-heading-container">
      <h5 id="applications-heading">Your Applications</h5>
      <h5 id="applications-arrow">
        <svg fill="currentColor" preserveAspectRatio="xMidYMid meet" height="22" width="22" class="cs-react-icon css-1ovp8yv e1db9b1o0" viewBox="0 0 1024 1024" style="vertical-align: middle;"><g><path d="M826.2 654.6l-3.6-4.2-272-313c-9.2-10.6-23-17.2-38.4-17.2s-29.2 6.8-38.4 17.2L197.4 655c-3.4 5-5.4 11-5.4 17.4 0 17.4 14.8 31.6 33.2 31.6h573.6c18.4 0 33.2-14.2 33.2-31.6 0-6.6-2.2-12.8-5.8-17.8z"></path></g></svg>
      </h5>
    </div>
    <div id="table-container" class="collapsed">
      <table class="table table-responsive" id="application-table">
        <tbody id="application-table-body">
        </tbody>
      </table>
    </div>
  </div>

  <section id="configuration-section" class="section collapsed" style="display: block;">
    <div class="container color-gray panel-body" id="configure-extension" style="display: none;">
      <form>
        <div class="form-group">
          <label id="contrast-url-input-label" for="contrast-url-input">Contrast URL</label>
          <input readonly="" placeholder="https://<domain>.contrastsecurity.com" class="form-control user-inputs" type="text" name="" value="" id="contrast-url-input">
        </div>
        <div class="form-group">
          <input id="contrast-service-key-input" readonly="" placeholder="Service Key" class="form-control user-inputs" type="text" name="" value="">
          <input id="contrast-username-input" readonly="" placeholder="Username" class="form-control user-inputs" type="text" name="" value="">
          <input id="contrast-api-key-input" readonly="" placeholder="API Key" class="form-control user-inputs" type="text" name="" value="">
          <button class="btn btn-primary btn-xs btn-contrast-plugin" type="button" name="button" id="configure-extension-button" style="display: none;">Configure</button>
        </div>
      </form>
      <h5 id="config-success" class="configure-message hidden">
        <span id="success-check">
          <svg fill="currentColor" preserveAspectRatio="xMidYMid meet" height="22" width="22" class="cs-react-icon css-1ovp8yv e1db9b1o0" viewBox="0 0 1024 1024" style="vertical-align: middle;"><g><path d="M954.857 332.572q0 22.857-16 38.857L447.428 862.858q-16 16-38.857 16t-38.857-16L85.143 578.287q-16-16-16-38.857t16-38.857l77.714-77.714q16-16 38.857-16t38.857 16l168 168.571 374.857-375.429q16-16 38.857-16t38.857 16l77.714 77.714q16 16 16 38.857z"></path></g></svg>
        </span>
        Successfully Configured!
      </h5>
      <h5 id="config-failure" class="configure-message hidden">
        <span id="error-x">
          <svg fill="currentColor" preserveAspectRatio="xMidYMid meet" height="22" width="22" class="cs-react-icon css-1ovp8yv e1db9b1o0" viewBox="0 0 1024 1024" style="vertical-align: middle;"><g><path d="M640 512l327.111-327.111-128-128L512 384 184.889 56.889l-128 128L384 512 56.889 839.111l128 128L512 640l327.111 327.111 128-128L640 512z"></path></g></svg>
        </span>Error Configuring, try reloading the page.
      </h5>
    </div>
  </section>

  <section class="footers-section section">
    <div id="configuration-footer" class="flex-row footer-row" style="display: none;">
      <div>
        <p id="config-footer-text" class="color-gray wide-lines scalable-subtext">Let's get you started. To configure the Contrast extension for Chrome, <a class="contrast-green" href="#">log into Contrast</a> and go to Your Account so we can grab your keys.</p>
      </div>
    </div>
    <div id="configured-footer" class="flex-row footer-row flex-row-foot" style="display: flex;">
      <div class="color-gray" id="user-email" style="display: block;"></div>
      <div id="gear-container">
        <svg id="configure-gear" fill="currentColor" preserveAspectRatio="xMidYMid meet" height="25px" width="25px" class="configure-gear" viewBox="0 0 1024 1024" style="display: none;"><g><path d="M585.143 521.143q0-60.571-42.857-103.429t-103.429-42.857-103.429 42.857-42.857 103.429 42.857 103.429 103.429 42.857 103.429-42.857 42.857-103.429zm292.571-62.286v126.857q0 6.857-4.571 13.143t-11.429 7.429l-105.714 16q-10.857 30.857-22.286 52 20 28.571 61.143 78.857 5.714 6.857 5.714 14.286t-5.143 13.143q-15.429 21.143-56.571 61.714t-53.714 40.571q-6.857 0-14.857-5.143L591.429 816q-25.143 13.143-52 21.714-9.143 77.714-16.571 106.286-4 16-20.571 16H375.43q-8 0-14-4.857t-6.571-12.286l-16-105.143q-28-9.143-51.429-21.143l-80.571 61.143q-5.714 5.143-14.286 5.143-8 0-14.286-6.286-72-65.143-94.286-96-4-5.714-4-13.143 0-6.857 4.571-13.143 8.571-12 29.143-38t30.857-40.286q-15.429-28.571-23.429-56.571L16.572 603.999q-7.429-1.143-12-7.143T.001 583.427V456.57q0-6.857 4.571-13.143t10.857-7.429l106.286-16q8-26.286 22.286-52.571-22.857-32.571-61.143-78.857-5.714-6.857-5.714-13.714 0-5.714 5.143-13.143 14.857-20.571 56.286-61.429t54-40.857q7.429 0 14.857 5.714l78.857 61.143q25.143-13.143 52-21.714 9.143-77.714 16.571-106.286 4-16 20.571-16h126.857q8 0 14 4.857t6.571 12.286l16 105.143q28 9.143 51.429 21.143l81.143-61.143q5.143-5.143 13.714-5.143 7.429 0 14.286 5.714 73.714 68 94.286 97.143 4 4.571 4 12.571 0 6.857-4.571 13.143-8.571 12-29.143 38t-30.857 40.286q14.857 28.571 23.429 56l104.571 16q7.429 1.143 12 7.143t4.571 13.429z"></path></g></svg>
      </div>
      <!-- <img id="configure-gear" class="configure-gear" src="/img/glyphicons-cog.png" alt="gear"> -->
    </div>
  </section>




</body>
`

exports['tests the popup index.html file for changes takes a snapshot of the notContrastNotConfigured index.html file 1'] = `
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css" integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous">
  <link rel="stylesheet" href="../style.css">
  <link href="https://fonts.googleapis.com/css?family=Lato" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet">
  <script type="module" src="../js/util.js"></script>
  <script type="module" src="../js/popupMethods.js" charset="utf-8"></script>
  <script type="module" src="../js/popup.js"></script>
  <script type="module" src="../js/index.js"></script>
</head>

<body>
  <section class="headers-section section">
    <div id="configuration-header" class="flex-row header-row flex-row-head" style="display: flex;">
      <img src="../icon.png" alt="" class="logo-icon flex-row-item">
      <div id="header-text" class="flex-row-item">
        <h5>
          <strong>Contrast</strong>
        </h5>
        <p id="config-header-text" class="no-margin scalable-subtext">Set Up Configuration</p>
      </div>
    </div>
    <div id="vulnerabilities-header" class="flex-row header-row" style="display: none;">
      <img src="../icon.png" alt="" class="logo-icon flex-row-item">
      <div id="header-text" class="flex-row-item">
        <h5>
          <strong>Contrast</strong>
        </h5>
        <p id="vulns-header-text" class="no-margin scalable-subtext">Vulnerabilities</p>
      </div>
      <div class="flex-row-item">
        <div class="flex-row">
          <img id="libs-loading" class="loading-icon" src="/img/ring-alt.gif" alt="loading">
          <span id="scan-libs-text" class="scalable-subtext" style="display: none;">Scan Libraries</span>
        </div>
      </div>
    </div>
  </section>

  <section id="vulnerabilities-section" class="panel panel-default section" style="display: none;">
    <div class="color-gray panel-body" id="no-vulnerabilities-found">
      <h5>No vulnerabilities were found.</h5>
    </div>

    <div id="vulnerabilities-found-on-page" class="panel-body">
      <div class="app-vulnerabilities-div">
        <ul class="list-group" id="vulnerabilities-found-on-page-list">
        </ul>
      </div>
      <div class="app-libraries-div">
        <div class="hidden" id="libs-vulnerabilities-found-on-page">
          <ul class="list-group" id="libs-vulnerabilities-found-on-page-list">
          </ul>
        </div>

        <h4 id="found-libs-message" class="hidden"></h4>
      </div>
    </div>
  </section>

  <div id="application-table-container-div" style="display: none;">
    <p id="connected-domain-message" class="hidden"></p>
    <div id="applications-heading-container">
      <h5 id="applications-heading">Your Applications</h5>
      <h5 id="applications-arrow">
        <svg fill="currentColor" preserveAspectRatio="xMidYMid meet" height="22" width="22" class="cs-react-icon css-1ovp8yv e1db9b1o0" viewBox="0 0 1024 1024" style="vertical-align: middle;"><g><path d="M826.2 654.6l-3.6-4.2-272-313c-9.2-10.6-23-17.2-38.4-17.2s-29.2 6.8-38.4 17.2L197.4 655c-3.4 5-5.4 11-5.4 17.4 0 17.4 14.8 31.6 33.2 31.6h573.6c18.4 0 33.2-14.2 33.2-31.6 0-6.6-2.2-12.8-5.8-17.8z"></path></g></svg>
      </h5>
    </div>
    <div id="table-container" class="collapsed">
      <table class="table table-responsive" id="application-table">
        <tbody id="application-table-body">
        </tbody>
      </table>
    </div>
  </div>

  <section id="configuration-section" class="section">
    <div class="container color-gray panel-body" id="configure-extension" style="display: none;">
      <form>
        <div class="form-group">
          <label id="contrast-url-input-label" for="contrast-url-input">Contrast URL</label>
          <input readonly="" placeholder="https://<domain>.contrastsecurity.com" class="form-control user-inputs" type="text" name="" value="" id="contrast-url-input">
        </div>
        <div class="form-group">
          <input id="contrast-service-key-input" readonly="" placeholder="Service Key" class="form-control user-inputs" type="text" name="" value="">
          <input id="contrast-username-input" readonly="" placeholder="Username" class="form-control user-inputs" type="text" name="" value="">
          <input id="contrast-api-key-input" readonly="" placeholder="API Key" class="form-control user-inputs" type="text" name="" value="">
          <button class="btn btn-primary btn-xs btn-contrast-plugin" type="button" name="button" id="configure-extension-button" style="display: none;">Configure</button>
        </div>
      </form>
      <h5 id="config-success" class="configure-message hidden">
        <span id="success-check">
          <svg fill="currentColor" preserveAspectRatio="xMidYMid meet" height="22" width="22" class="cs-react-icon css-1ovp8yv e1db9b1o0" viewBox="0 0 1024 1024" style="vertical-align: middle;"><g><path d="M954.857 332.572q0 22.857-16 38.857L447.428 862.858q-16 16-38.857 16t-38.857-16L85.143 578.287q-16-16-16-38.857t16-38.857l77.714-77.714q16-16 38.857-16t38.857 16l168 168.571 374.857-375.429q16-16 38.857-16t38.857 16l77.714 77.714q16 16 16 38.857z"></path></g></svg>
        </span>
        Successfully Configured!
      </h5>
      <h5 id="config-failure" class="configure-message hidden">
        <span id="error-x">
          <svg fill="currentColor" preserveAspectRatio="xMidYMid meet" height="22" width="22" class="cs-react-icon css-1ovp8yv e1db9b1o0" viewBox="0 0 1024 1024" style="vertical-align: middle;"><g><path d="M640 512l327.111-327.111-128-128L512 384 184.889 56.889l-128 128L384 512 56.889 839.111l128 128L512 640l327.111 327.111 128-128L640 512z"></path></g></svg>
        </span>Error Configuring, try reloading the page.
      </h5>
    </div>
  </section>

  <section class="footers-section section">
    <div id="configuration-footer" class="flex-row footer-row" style="display: block;">
      <div>
        <p id="config-footer-text" class="color-gray wide-lines scalable-subtext">Let's get you started. To configure the Contrast extension for Chrome, <a class="contrast-green" href="#">log into Contrast</a> and go to Your Account so we can grab your keys.</p>
      </div>
    </div>
    <div id="configured-footer" class="flex-row footer-row flex-row-foot" style="display: none;">
      <div class="color-gray" id="user-email"></div>
      <div id="gear-container">
        <svg id="configure-gear" fill="currentColor" preserveAspectRatio="xMidYMid meet" height="25px" width="25px" class="configure-gear" viewBox="0 0 1024 1024" style="display: none;"><g><path d="M585.143 521.143q0-60.571-42.857-103.429t-103.429-42.857-103.429 42.857-42.857 103.429 42.857 103.429 103.429 42.857 103.429-42.857 42.857-103.429zm292.571-62.286v126.857q0 6.857-4.571 13.143t-11.429 7.429l-105.714 16q-10.857 30.857-22.286 52 20 28.571 61.143 78.857 5.714 6.857 5.714 14.286t-5.143 13.143q-15.429 21.143-56.571 61.714t-53.714 40.571q-6.857 0-14.857-5.143L591.429 816q-25.143 13.143-52 21.714-9.143 77.714-16.571 106.286-4 16-20.571 16H375.43q-8 0-14-4.857t-6.571-12.286l-16-105.143q-28-9.143-51.429-21.143l-80.571 61.143q-5.714 5.143-14.286 5.143-8 0-14.286-6.286-72-65.143-94.286-96-4-5.714-4-13.143 0-6.857 4.571-13.143 8.571-12 29.143-38t30.857-40.286q-15.429-28.571-23.429-56.571L16.572 603.999q-7.429-1.143-12-7.143T.001 583.427V456.57q0-6.857 4.571-13.143t10.857-7.429l106.286-16q8-26.286 22.286-52.571-22.857-32.571-61.143-78.857-5.714-6.857-5.714-13.714 0-5.714 5.143-13.143 14.857-20.571 56.286-61.429t54-40.857q7.429 0 14.857 5.714l78.857 61.143q25.143-13.143 52-21.714 9.143-77.714 16.571-106.286 4-16 20.571-16h126.857q8 0 14 4.857t6.571 12.286l16 105.143q28 9.143 51.429 21.143l81.143-61.143q5.143-5.143 13.714-5.143 7.429 0 14.286 5.714 73.714 68 94.286 97.143 4 4.571 4 12.571 0 6.857-4.571 13.143-8.571 12-29.143 38t-30.857 40.286q14.857 28.571 23.429 56l104.571 16q7.429 1.143 12 7.143t4.571 13.429z"></path></g></svg>
      </div>
      <!-- <img id="configure-gear" class="configure-gear" src="/img/glyphicons-cog.png" alt="gear"> -->
    </div>
  </section>




</body>
`
