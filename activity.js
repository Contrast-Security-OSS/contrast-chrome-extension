document.addEventListener('DOMContentLoaded', function () {

  chrome.storage.sync.get(["contrast_service_key", "teamserver_url"], function (items) {


    if (items["contrast_service_key"] != null) {

      getActivities(function () {
        return function (e) {
          xhr = e.currentTarget
          if (xhr.readyState == 4) {
            if (xhr.status == 403) {
              //Configuration problem
              $("body").addClass("configuration-problem")
              $("#configuration-problem").show()
            } else if (xhr.responseText == "") {
              $("body").addClass("no-activity")
              $("#get-started").show()
            } else {
              json = JSON.parse(xhr.responseText)
              console.log(json["activities"])

              activities = json["activities"]

              if (activities === "undefined" || activities.length == 0) {
                $("body").addClass("no-activity")
                $("#get-started").show()
              } else {

                $.each(activities, function (idx, activity) {
                  console.log(activity)
                  var text = activity["description"]["text"]
                  var desc = ""

                  if (activity["type"] == "NEW_TRACE") {
                    desc = text.substring(text.indexOf("$$LINK_DELIM$$") + 14, text.lastIndexOf(" "));
                    desc += " " + text.substring(text.lastIndexOf("$$LINK_DELIM$$") + "$$LINK_DELIM$$".length);
                  } else {
                    desc = text.substring(text.indexOf("$$LINK_DELIM$$") + 14);
                  }


                  var li = $('<li/>')
                    .addClass('list-group-item')
                    .appendTo($("#contrast-events"));

                  li.append($('<h6/>').append(activity["type"].replace(/_/g, " ")))
                  li.append($('<div/>').append(desc))

                  var date = new Date(null);
                  date.setMilliseconds(activity["timestamp"])
                  var dateVal = date.toString();
                  li.append($('<a/>').attr("href", "").addClass('activity-timestamp-header').append(dateVal));

                  var activityLink = text.substring(0, text.indexOf("$$LINK_DELIM$$"));
                  var activityLinkHtmlElement = $('<p/>').css("display", "none").append(activityLink);
                  li.append(activityLinkHtmlElement);
                })

                $('.activity-timestamp-header').click(function (event) {
                  var text = $(event.target).parent().find('p').text();
                  var teamserverUrl = items["teamserver_url"];
                  var activityLinkComplete = teamserverUrl.substring(0, teamserverUrl.indexOf("/Contrast")) + text;
                  chrome.tabs.create({ url: activityLinkComplete });
                });
              }

            }
          }
        }
      })
    }
  })

}, false);