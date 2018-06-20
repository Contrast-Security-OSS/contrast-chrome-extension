const ApplicationModel = require('../lib/models/Application.js');
const Application = ApplicationModel.default;

const returnShortTraceData = {
  success: true,
  messages: [
    "Vulnerability short loaded successfully"
  ],
  trace: {
    app_id: "d834de81-3069-499a-9ddc-eeb30375fdbf",
    first_time_seen: 1522342751785,
    impact: "High",
    license: "Licensed",
    likelihood: "High",
    ruleName: "SQL Injection",
    severity: "Critical",
    status: "Reported",
    uuid: "7HC2-TYLR-VATF-Z2ZO",
    visible: true
  },
  links: []
}

const application = new Application("http://localhost:8080/WebGoat", {
  app_id: "webgoat-id-123", name: "webgoat"
})

const traceUrls = [
  "http://localhost:8080/WebGoat/trace1",
  "http://localhost:8080/WebGoat/trace2",
  "http://localhost:8080/WebGoat/trace3",
  "http://localhost:8080/WebGoat/trace4",
]

const returnShortTraceDataLowSeverity = {
  success: true,
  messages: [
    "Vulnerability short loaded successfully"
  ],
  trace: {
    app_id: "d834de81-3069-499a-9ddc-eeb30375fdbf",
    first_time_seen: 1522342751785,
    impact: "High",
    license: "Licensed",
    likelihood: "High",
    ruleName: "SQL Injection",
    severity: "Low",
    status: "Reported",
    uuid: "7HC2-TYLR-VATF-Z2ZO",
    visible: true
  },
  links: []
}

const returnVulnerabilityIdData = {
  success: true,
  messages: [
    "Vulnerabilities UUIDs loaded successfully"
  ],
  traces: [
    "6RJL-ZJPZ-YYV8-8ETX",
    "N6DH-05XP-G5C3-AF1K",
    "7HC2-TYLR-VATF-Z2ZO",
    "252W-P884-GB4B-TJF7"
  ]
}

const returnFilterTraceData = {
  success: true,
  messages: [
    "Trace loaded successfully"
  ],
  trace: {
    app_version_tags: [],
    application: {
      master: false,
      child: false,
      roles: [
        "ROLE_EDIT",
        "ROLE_RULES_ADMIN",
        "ROLE_ADMIN",
        "ROLE_VIEW"
      ],
      importance: 2,
      licenseServiceLevel: null,
      app_id: "d834de81-3069-499a-9ddc-eeb30375fdbf",
      name: "webgoat-server",
      parent_app_id: null,
      total_modules: 1,
      language: "Java",
      context_path: "/WebGoat",
      last_seen: 1525971780000,
      license_level: "Licensed"
    },
    bugtracker_tickets: [],
    category: "Injection",
    closed_time: null,
    confidence: "High",
    default_severity: "CRITICAL",
    events: [
      {
        eventId: 17,
        type: "Creation",
        codeContext: null
      },
      {
        eventId: 18,
        type: "P2O",
        codeContext: null
      },
      {
        eventId: 19,
        type: "O2R",
        codeContext: null
      },
      {
        eventId: 20,
        type: "Trigger",
        codeContext: null
      }
    ],
    evidence: null,
    first_time_seen: 1522342751785,
    hasParentApp: false,
    impact: "High",
    language: "Java",
    last_time_seen: 1525791240000,
    license: "Licensed",
    likelihood: "High",
    links: [
      {
        rel: "self",
        href: "http://localhost:19090/Contrast/api/ng/04bfd6c5-b24e-4610-b8b9-bcbde09f8e15/traces/d834de81-3069-499a-9ddc-eeb30375fdbf/trace/7HC2-TYLR-VATF-Z2ZO",
        method: "GET"
      },
      {
        rel: "story",
        href: "http://localhost:19090/Contrast/api/ng/04bfd6c5-b24e-4610-b8b9-bcbde09f8e15/traces/7HC2-TYLR-VATF-Z2ZO/story",
        method: "GET"
      },
      {
        rel: "http-request",
        href: "http://localhost:19090/Contrast/api/ng/04bfd6c5-b24e-4610-b8b9-bcbde09f8e15/traces/7HC2-TYLR-VATF-Z2ZO/httprequest",
        method: "GET"
      },
      {
        rel: "recommendation",
        href: "http://localhost:19090/Contrast/api/ng/04bfd6c5-b24e-4610-b8b9-bcbde09f8e15/traces/7HC2-TYLR-VATF-Z2ZO/recommendation",
        method: "GET"
      },
      {
        rel: "add-note",
        href: "http://localhost:19090/Contrast/api/ng/04bfd6c5-b24e-4610-b8b9-bcbde09f8e15/applications/d834de81-3069-499a-9ddc-eeb30375fdbf/traces/7HC2-TYLR-VATF-Z2ZO/notes",
        method: "POST"
      }
    ],
    organization_name: "Contrast Security",
    reported_to_bug_tracker: false,
    reported_to_bug_tracker_time: null,
    request: {
      protocol: "http",
      version: "1.0",
      uri: "/WebGoat/SqlInjection/attack5a",
      queryString: "",
      method: "POST",
      port: 0,
      headers: [
        {
          name: "Content-length",
          value: "14"
        },
        {
          name: "Referer",
          value: "http://localhost:8080/WebGoat/start.mvc"
        },
        {
          name: "Accept-language",
          value: "en-US,en;q=0.9"
        },
        {
          name: "Cookie",
          value: "JSESSIONID=8C186213A1683EF545C41B69571EE26F; cookieconsent_status=dismiss; continueCode=vpKNbox7RVD3ryMlABQujhat5ckIbUBtmTYC3rtpZfL709kWOg4PE5wmJLaY; io=vPr-Lkb-xZksvSIEAAAT; _railsgoat_session=VVJTTDJzZTRzb0k3Z0tlKzRZUGwzUUw1RWVUVkJ0aTZaOStKSzlicE9PYXZGeTFYcmhxSDhLbnpMLzgvVGhFVXN4TFFCZGlVTitIZDc0OHR6UWNPa29rQTFLaW5LUWlXM0NqNEcrdS9YUG1pdmc1Q1A5Mk1PS3M2YXkvU1Nad012dEdhaE1wR29WNndxK3FoVTlLTEJJYmQvbkZZMGQ3NWIxTGx4eFB5Uzd5UWgrMklXeVBKaXZhRGNFNnU3T25xLS1IVXh0ZGJmSC8vMUg5R2JEdW1CRldBPT0%3D--7cd81c5be95256fd1fd5813d3c7276a7a78e33aa"
        },
        {
          name: "Origin",
          value: "http://localhost:8080"
        },
        {
          name: "Host",
          value: "localhost:8080"
        },
        {
          name: "X-requested-with",
          value: "XMLHttpRequest"
        },
        {
          name: "User-Agent",
          value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36"
        },
        {
          name: "Connection",
          value: "keep-alive"
        },
        {
          name: "Content-type",
          value: "application/x-www-form-urlencoded; charset=UTF-8"
        },
        {
          name: "Accept-encoding",
          value: "gzip, deflate, br"
        },
        {
          name: "Accept",
          value: "*/*"
        }
      ],
      parameters: [
        {
          name: "account",
          value: "dcordz"
        }
      ]
    },
    rule_name: "sql-injection",
    servers: [
      {
        server_id: 3,
        name: "dangerzone",
        hostname: "dangerzone",
        path: "/Users/dcorderman/java/",
        environment: "DEVELOPMENT"
      },
      {
        server_id: 9,
        name: "dangerzone",
        hostname: "dangerzone",
        path: "/Users/dcorderman/java/WebGoat/",
        environment: "DEVELOPMENT"
      },
      {
        server_id: 556,
        name: "WebGoat12",
        hostname: "WebGoat12",
        path: "/Users/dcorderman/java/",
        environment: "DEVELOPMENT"
      }
    ],
    severity: "Critical",
    status: "Reported",
    sub_status: "",
    sub_title: "from \"account\" Parameter on \"/WebGoat/SqlInjection/attack5a\" page",
    title: "SQL Injection from \"account\" Parameter on \"/WebGoat/SqlInjection/attack5a\" page",
    total_traces_received: 119,
    uuid: "7HC2-TYLR-VATF-Z2ZO",
    visible: true
  }
}

const organizationApps = [
  {
    "name": "bhima",
    "app_id": "c05a5016-6440-40ad-b91f-33610515d130"
  },
  {
    "name": "cloudcmd",
    "app_id": "fe177fe8-73f3-4ec9-8e27-43892f62f0b3"
  },
  {
    "name": "contrast",
    "app_id": "ab832755-e062-4564-832c-63fba8a02c7e"
  },
  {
    "name": "DimitriMikadze",
    "app_id": "e7d23295-0d02-4e59-8ab5-392d79f8669c"
  },
  {
    "name": "juice-shop",
    "app_id": "d1829729-83b5-4050-bff2-71bc4bfb2571"
  },
  {
    "name": "juice-shop-angular",
    "app_id": "f51a3a32-fbfb-4a7f-9d4a-9b0537ef573f"
  },
  {
    "name": "LegismeApi",
    "app_id": "a51c4303-7a6d-4578-9dde-d89a37fae50c"
  },
  {
    "name": "openmct",
    "app_id": "46e84cbf-77f7-4450-aaad-6d1b5cf55a27"
  },
  {
    "name": "pokedex-go",
    "app_id": "da5d96c3-d9c3-43d3-9659-77e73dd447b3"
  },
  {
    "name": "test-project",
    "app_id": "426b042f-0f54-4324-bddb-09e5a9746e94"
  },
  {
    "name": "webgoat-server",
    "app_id": "d834de81-3069-499a-9ddc-eeb30375fdbf"
  },
  {
    "name": "WebGoatDocker",
    "app_id": "db3dd379-fb83-4f9b-89cf-9f7867541581"
  }
];

module.exports = {
  traceUrls,
  returnShortTraceData,
  returnShortTraceDataLowSeverity,
  returnVulnerabilityIdData,
  returnFilterTraceData,
  application,
  organizationApps,
}
