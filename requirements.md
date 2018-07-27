# Contrast Chrome Extension Requirements

* Gather traces on a given page.
- XHR requests to external resources and get/post requests to API
- Tab URL
- Form actions on page

* Show a user the number of traces
* Show a user severity and description of trace

### Get list of application in an organization
* ex. Send `http://localhost:19080/Contrast/api/ng/{orgUuid}/applications/name"`
Expect back:
```js
[
  {
    "name": "bhima",
    "app_id": "c05a5016-6440-40ad-b91f-33610515d130"
  },
  {
    "name": "juice-shop",
    "app_id": "d1829729-83b5-4050-bff2-71bc4bfb2571"
  },
  {
    "name": "LegismeApi",
    "app_id": "a51c4303-7a6d-4578-9dde-d89a37fae50c"
  },
  {
    "name": "webgoat-server",
    "app_id": "d834de81-3069-499a-9ddc-eeb30375fdbf"
  },
];
```

### Send URL, or a list of URLs to Teamserver, expect back an array of trace-ids.
`/ng/{orgUuid}/traces/{appId}/ids`
* ex. Send the following URLs:
```js
[
  "http://localhost:8080/WebGoat/start.mvc#lesson/SqlInjection.lesson/6",
  "http://localhost:8080/WebGoat/SqlInjection/attack5a",
  "http://localhost:8080/WebGoat/SqlInjection/attack5b"
]
```
Expect back:
```js
[
  "8XTN-KCOY-0ASI-4PTG",
  "O2ZH-E7WW-MXYT-4DQ2",
  "LO1G-Z49Q-JJGP-1G4H",
  "RCGK-RQR3-I1VM-34AO"
]
```

__URLs with parameters in the URL should also return traces.__
ex: Send base64 encoded URL: `http://localhost:4000/allocations/5`
Respond with a list including trace ID, even though teamserver stores the Trace Route as `/allocations/:userId`.
```js
[
   "HJH9-YWFW-TEYA-469K",
]
```

### Send a Trace ID, return a Short Trace for showing info to a user.
* ex. Send the following
```js
  `/Contrast/api/ng/{org_uuid}/traces/{app_uuid}/ids?urls={base64_url,optionally_another_base64_url}`
  `/Contrast/api/ng/04bfd6c5-b24e-4610-b8b9-bcbde09f8e15/traces/d834de81-3069-499a-9ddc-eeb30375fdbf/ids?urls=aHR0cDovL2xvY2FsaG9zdDo4MDgwL1dlYkdvYXQvc3RhcnQubXZjI2xlc3Nvbi9TcWxJbmplY3Rpb24ubGVzc29uLzY=`
```

Should return:
```js
[
  {
    "success": true,
    "messages": [
      "Vulnerability short loaded successfully"
    ],
    "trace": {
      "app_id": "d834de81-3069-499a-9ddc-eeb30375fdbf",
      "first_time_seen": 1526912769230,
      "impact": "High",
      "license": "Licensed",
      "likelihood": "High",
      "ruleName": "SQL Injection",
      "severity": "Critical",
      "status": "Reported",
      "uuid": "O2ZH-E7WW-MXYT-4DQ2",
      "visible": true
    },
    "links": []
  }
]
```
