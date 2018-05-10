const returnShortTraceData = {
  "success": true,
  "messages": [
    "Vulnerability short loaded successfully"
  ],
  "trace": {
    "app_id": "d834de81-3069-499a-9ddc-eeb30375fdbf",
    "first_time_seen": 1522342751785,
    "impact": "High",
    "license": "Licensed",
    "likelihood": "High",
    "ruleName": "SQL Injection",
    "severity": "Critical",
    "status": "Reported",
    "uuid": "7HC2-TYLR-VATF-Z2ZO",
    "visible": true
  },
  "links": []
}

const returnVulnerabilityIdData = {
  "success": true,
  "messages": [
    "Vulnerabilities UUIDs loaded successfully"
  ],
  "traces": [
    "6RJL-ZJPZ-YYV8-8ETX",
    "N6DH-05XP-G5C3-AF1K",
    "7HC2-TYLR-VATF-Z2ZO",
    "252W-P884-GB4B-TJF7"
  ]
}

const returnFilterTraceData = {
  "success": true,
  "messages": [
    "Trace loaded successfully"
  ],
  "trace": {
    "app_version_tags": [],
    "application": {
      "master": false,
      "child": false,
      "roles": [
        "ROLE_EDIT",
        "ROLE_RULES_ADMIN",
        "ROLE_ADMIN",
        "ROLE_VIEW"
      ],
      "importance": 2,
      "licenseServiceLevel": null,
      "app_id": "d834de81-3069-499a-9ddc-eeb30375fdbf",
      "name": "webgoat-server",
      "parent_app_id": null,
      "total_modules": 1,
      "language": "Java",
      "context_path": "/WebGoat",
      "last_seen": 1525971780000,
      "license_level": "Licensed"
    },
    "bugtracker_tickets": [],
    "category": "Injection",
    "closed_time": null,
    "confidence": "High",
    "default_severity": "CRITICAL",
    "events": [
      {
        "eventId": 17,
        "type": "Creation",
        "codeContext": null
      },
      {
        "eventId": 18,
        "type": "P2O",
        "codeContext": null
      },
      {
        "eventId": 19,
        "type": "O2R",
        "codeContext": null
      },
      {
        "eventId": 20,
        "type": "Trigger",
        "codeContext": null
      }
    ],
    "evidence": null,
    "first_time_seen": 1522342751785,
    "hasParentApp": false,
    "impact": "High",
    "language": "Java",
    "last_time_seen": 1525791240000,
    "license": "Licensed",
    "likelihood": "High",
    "links": [
      {
        "rel": "self",
        "href": "http://localhost:19090/Contrast/api/ng/04bfd6c5-b24e-4610-b8b9-bcbde09f8e15/traces/d834de81-3069-499a-9ddc-eeb30375fdbf/trace/7HC2-TYLR-VATF-Z2ZO",
        "method": "GET"
      },
      {
        "rel": "story",
        "href": "http://localhost:19090/Contrast/api/ng/04bfd6c5-b24e-4610-b8b9-bcbde09f8e15/traces/7HC2-TYLR-VATF-Z2ZO/story",
        "method": "GET"
      },
      {
        "rel": "http-request",
        "href": "http://localhost:19090/Contrast/api/ng/04bfd6c5-b24e-4610-b8b9-bcbde09f8e15/traces/7HC2-TYLR-VATF-Z2ZO/httprequest",
        "method": "GET"
      },
      {
        "rel": "recommendation",
        "href": "http://localhost:19090/Contrast/api/ng/04bfd6c5-b24e-4610-b8b9-bcbde09f8e15/traces/7HC2-TYLR-VATF-Z2ZO/recommendation",
        "method": "GET"
      },
      {
        "rel": "add-note",
        "href": "http://localhost:19090/Contrast/api/ng/04bfd6c5-b24e-4610-b8b9-bcbde09f8e15/applications/d834de81-3069-499a-9ddc-eeb30375fdbf/traces/7HC2-TYLR-VATF-Z2ZO/notes",
        "method": "POST"
      }
    ],
    "organization_name": "Contrast Security",
    "reported_to_bug_tracker": false,
    "reported_to_bug_tracker_time": null,
    "request": {
      "protocol": "http",
      "version": "1.0",
      "uri": "/WebGoat/SqlInjection/attack5a",
      "queryString": "",
      "method": "POST",
      "port": 0,
      "headers": [
        {
          "name": "Content-length",
          "value": "14"
        },
        {
          "name": "Referer",
          "value": "http://localhost:8080/WebGoat/start.mvc"
        },
        {
          "name": "Accept-language",
          "value": "en-US,en;q=0.9"
        },
        {
          "name": "Cookie",
          "value": "JSESSIONID=8C186213A1683EF545C41B69571EE26F; cookieconsent_status=dismiss; continueCode=vpKNbox7RVD3ryMlABQujhat5ckIbUBtmTYC3rtpZfL709kWOg4PE5wmJLaY; io=vPr-Lkb-xZksvSIEAAAT; _railsgoat_session=VVJTTDJzZTRzb0k3Z0tlKzRZUGwzUUw1RWVUVkJ0aTZaOStKSzlicE9PYXZGeTFYcmhxSDhLbnpMLzgvVGhFVXN4TFFCZGlVTitIZDc0OHR6UWNPa29rQTFLaW5LUWlXM0NqNEcrdS9YUG1pdmc1Q1A5Mk1PS3M2YXkvU1Nad012dEdhaE1wR29WNndxK3FoVTlLTEJJYmQvbkZZMGQ3NWIxTGx4eFB5Uzd5UWgrMklXeVBKaXZhRGNFNnU3T25xLS1IVXh0ZGJmSC8vMUg5R2JEdW1CRldBPT0%3D--7cd81c5be95256fd1fd5813d3c7276a7a78e33aa"
        },
        {
          "name": "Origin",
          "value": "http://localhost:8080"
        },
        {
          "name": "Host",
          "value": "localhost:8080"
        },
        {
          "name": "X-requested-with",
          "value": "XMLHttpRequest"
        },
        {
          "name": "User-Agent",
          "value": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36"
        },
        {
          "name": "Connection",
          "value": "keep-alive"
        },
        {
          "name": "Content-type",
          "value": "application/x-www-form-urlencoded; charset=UTF-8"
        },
        {
          "name": "Accept-encoding",
          "value": "gzip, deflate, br"
        },
        {
          "name": "Accept",
          "value": "*/*"
        }
      ],
      "parameters": [
        {
          "name": "account",
          "value": "dcordz"
        }
      ]
    },
    "rule_name": "sql-injection",
    "servers": [
      {
        "server_id": 3,
        "name": "dangerzone",
        "hostname": "dangerzone",
        "path": "/Users/dcorderman/java/",
        "environment": "DEVELOPMENT"
      },
      {
        "server_id": 9,
        "name": "dangerzone",
        "hostname": "dangerzone",
        "path": "/Users/dcorderman/java/WebGoat/",
        "environment": "DEVELOPMENT"
      },
      {
        "server_id": 556,
        "name": "WebGoat12",
        "hostname": "WebGoat12",
        "path": "/Users/dcorderman/java/",
        "environment": "DEVELOPMENT"
      }
    ],
    "severity": "Critical",
    "status": "Reported",
    "sub_status": "",
    "sub_title": "from \"account\" Parameter on \"/WebGoat/SqlInjection/attack5a\" page",
    "title": "SQL Injection from \"account\" Parameter on \"/WebGoat/SqlInjection/attack5a\" page",
    "total_traces_received": 119,
    "uuid": "7HC2-TYLR-VATF-Z2ZO",
    "visible": true
  }
}
