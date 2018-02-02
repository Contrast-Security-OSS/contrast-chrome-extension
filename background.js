chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon.png',
    title: "This is a notification",
    message: "hello there!"
},
    function () { console.log("notification displayed"); }
);


// var options = {
//     type: "basic",
//     title: "Primary Title",
//     message: "Primary message to display"
// }

// chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
//     chrome.notifications.create(options);
// });

// chrome.tabs.onCreated.addListener(function (tabId, changeInfo, tab) {
//     chrome.notifications.create(options);
// });

// getOrganizationVulnerabilityesIds("/usr/updateProfile.aspx", function () {
//     return function (e) {
//       var xhr = e.currentTarget;
//       if (xhr.readyState == 4) {
//         if (xhr.responseText != "") {
//           const json = JSON.parse(xhr.responseText);
//           var traces = json["traces"];
//           console.log(traces);
//         }
//       }
//     }
//   });
