'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _util = require('./util.js');

var _Vulnerability = require('./models/Vulnerability.js');

var _Vulnerability2 = _interopRequireDefault(_Vulnerability);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
var Queue = function () {
  function Queue() {
    (0, _classCallCheck3.default)(this, Queue);

    this.xhrRequests = [];
    this.gatheredForms = [];
    this.traceIDs = [];
    this.xhrReady = false;
    this.formsReady = false;
    this.isCredentialed = false;
    this.tab = null;
    this.application = null;
    this.tabUrl = "";
    this.executionCount = 0;
  }

  (0, _createClass3.default)(Queue, [{
    key: 'addXHRequests',
    value: function addXHRequests(requests, xhrReady) {
      this.xhrReady = xhrReady;
      this.xhrRequests = this.xhrRequests.concat(requests);
    }
  }, {
    key: 'addForms',
    value: function addForms(forms, formsReady) {
      this.formsReady = formsReady;
      this.gatheredForms = this.gatheredForms.concat(forms);
    }
  }, {
    key: 'setTab',
    value: function setTab(tab) {
      if (!tab.url) throw new Error("Tab URL is falsey, received", tab.url);
      this.tab = tab;
      this.tabUrl = tab.url;
    }
  }, {
    key: 'setApplication',
    value: function setApplication(application) {
      this.application = application;
    }
  }, {
    key: 'setCredentialed',
    value: function setCredentialed(credentialed) {
      this.isCredentialed = credentialed;
    }
  }, {
    key: '_increaseExecutionCount',
    value: function _increaseExecutionCount() {
      this.executionCount += 1;
    }
  }, {
    key: 'resetExecutionCount',
    value: function resetExecutionCount() {
      this.executionCount = 0;
    }

    /**
     * NOTE: Not using, doesn't reset *this*, only resets instance
     */
    // resetQueue() {
    // 	this.xhrRequests    = [];
    //   this.gatheredForms  = [];
    //   this.traceIDs       = [];
    //   this.xhrReady       = false;
    //   this.formsReady     = false;
    //   this.isCredentialed = false;
    //   this.tab            = null;
    //   this.application    = null;
    //   this.tabUrl         = "";
    //   this.executionCount = 0;
    // 	console.log("Queue Reset");
    // }

  }, {
    key: '_highLightVulnerableForms',
    value: function _highLightVulnerableForms(formTraces) {
      console.log("In queue, highlighting forms");
      var highlightActions = formTraces.map(function (ft) {
        if (ft.traces && ft.traces.length > 0) {
          return ft.action;
        }
        return false;
      }).filter(Boolean);
      _Vulnerability2.default.highlightForms(this.tab, highlightActions);
    }
  }, {
    key: '_evaluateForms',
    value: function _evaluateForms() {
      return _Vulnerability2.default.evaluateFormActions(this.gatheredForms, this.tab, this.application);
    }
  }, {
    key: 'executeQueue',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(resetXHRRequests) {
        var url, conditions, formTraces, traceUrls;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                console.log("executing queue", this);
                // NOTE: At start loading badge still true

                // If tab URL is blacklisted, don't process anything
                url = this.tabUrl || this.tab.url;

                if (!(0, _util.isBlacklisted)(url)) {
                  _context.next = 5;
                  break;
                }

                (0, _util.removeLoadingBadge)(this.tab);
                return _context.abrupt('return');

              case 5:
                conditions = [this.xhrReady, this.formsReady, this.tab, this.tabUrl, this.isCredentialed, this.application];

                if (conditions.every(Boolean)) {
                  _context.next = 8;
                  break;
                }

                throw new Error("Queue not ready to execute!", conditions);

              case 8:

                console.log("In queue, removing vulnerabilities");
                _context.next = 11;
                return _Vulnerability2.default.removeVulnerabilitiesFromStorage(this.tab);

              case 11:
                //eslint-disable-line

                // NOTE: In order to highlight vulnerable forms, form actions must be evaluated separately
                console.log("In queue, evaluating forms");
                _context.next = 14;
                return this._evaluateForms();

              case 14:
                formTraces = _context.sent;


                console.log("FORM TRACES", formTraces);

                if (formTraces && formTraces.length > 0) {
                  this._highLightVulnerableForms(formTraces);
                }

                traceUrls = this.xhrRequests.concat([this.tabUrl]);

                traceUrls = traceUrls.filter(function (tu) {
                  return !(0, _util.isBlacklisted)(tu);
                });
                traceUrls = traceUrls.map(function (trace) {
                  return new URL(trace).pathname;
                });

                console.log("evaluating urls from page in queue");

                _Vulnerability2.default.evaluateVulnerabilities(this.isCredentialed, // if credentialed already
                this.tab, // current tab
                (0, _util.deDupeArray)(traceUrls), // gathered xhr requests from page load
                this.application, // current app
                formTraces ? formTraces.map(function (f) {
                  return f.traces;
                }).flatten() : [], resetXHRRequests);

                this._increaseExecutionCount();
                // NOTE: At end, badge is number of vulnerabilities

              case 23:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function executeQueue(_x) {
        return _ref.apply(this, arguments);
      }

      return executeQueue;
    }()
  }]);
  return Queue;
}();

exports.default = Queue;

/**
 * 1. Check that application for tab URL has been connected
 * 2. Check that user has configured and has credentials
 * 3. Wait for page to load
 * 3a. Capture XHR Requests
 * 4. Scrape for forms
 * 5. Execute on stored XHR, forms and tab url
 * 6. Continuously evaluate XHR
 */