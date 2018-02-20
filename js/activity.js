/*global
chrome, document, getActivities, $, HTML_BODY
*/

document.addEventListener('DOMContentLoaded', function () {
  "use strict";
  chrome.storage.sync.get(["contrast_service_key", "teamserver_url"], function (items) {
    if (items.contrast_service_key !== null) {

      getActivities(function () {
        return function (e) {
          var xhr = e.currentTarget, json, activities, text, desc, li, date, dateVal, activityLink, activityLinkHtmlElement, teamserverUrl, activityLinkComplete;
          if (xhr.readyState === 4) {
            if (xhr.status === 403) {
              //Configuration problem
              $(HTML_BODY).addClass("configuration-problem");
              $("#configuration-problem").show();
            } else if (xhr.responseText === "") {
              $(HTML_BODY).addClass("no-activity");
              $("#get-started").show();
            } else {
              json = JSON.parse(xhr.responseText);
              activities = json.activities;

              if (activities === null || activities.length === 0) {
                $(HTML_BODY).addClass("no-activity");
                $("#get-started").show();
              } else {

                $.each(activities, function (ignore, activity) {
                  text = activity.description.text;
                  desc = "";

                  if (activity.type === "NEW_TRACE") {
                    desc = text.substring(text.indexOf("$$LINK_DELIM$$") + 14, text.lastIndexOf(" "));
                    desc += " " + text.substring(text.lastIndexOf("$$LINK_DELIM$$") + "$$LINK_DELIM$$".length);
                  } else {
                    desc = text.substring(text.indexOf("$$LINK_DELIM$$") + 14);
                  }


                  li = $('<li/>')
                    .addClass('list-group-item')
                    .appendTo($("#contrast-events"));

                  li.append($('<h6/>').append(activity.type.replace(/_/g, " ")));
                  li.append($('<div/>').append(desc));

                  date = new Date(null);
                  date.setMilliseconds(activity.timestamp);
                  dateVal = date.toString();
                  li.append($('<a/>').attr("href", "").addClass('activity-timestamp-header').append(dateVal));

                  activityLink = text.substring(0,
                    text.indexOf("$$LINK_DELIM$$"));
                  activityLinkHtmlElement = $('<p/>').css("display", "none").append(activityLink);

                  li.append(activityLinkHtmlElement);
                });

                $('.activity-timestamp-header').click(function (event) {
                  text = $(event.target).parent().find('p').text();
                  teamserverUrl = items.teamserver_url;
                  activityLinkComplete = teamserverUrl.substring(0, teamserverUrl.indexOf("/Contrast")) + text;
                  chrome.tabs.create({ url: activityLinkComplete });
                });
              }

            }
          }
        };
      });
    }
  });

}, false);
