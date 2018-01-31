document.addEventListener('DOMContentLoaded', function () {
  chrome.storage.sync.get(["contrast_service_key"], function (items) {

    if (items["contrast_service_key"] != null) {

      getActivities(function () {
        return function (e) {
          xhr = e.currentTarget
          if (xhr.readyState == 4) {
            if (xhr.responseText == "") {
              $("body").addClass("no-activity")
              $("#get-started").show()
            } else {

              json = JSON.parse(xhr.responseText)
              //console.log(json["activities"])
              console.log(xhr.responseText);

              activities = json["activities"]
              $.each(activities, function (idx, activity) {
                console.log(activity)
                var text = activity["description"]["text"]


                var desc = ""

                if (activity["type"] == "NEW_TRACE") {
                  desc = text.substring(text.indexOf("$$LINK_DELIM$$") + 14, text.lastIndexOf("$$LINK_DELIM$$"))
                } else {
                  desc = text.substring(text.indexOf("$$LINK_DELIM$$") + 14)
                }


                var li = $('<li/>')
                  .addClass('list-group-item')
                  .appendTo($("#contrast-events"));

                li.append($('<h6/>').append(activity["type"].replace(/_/g, " ")))
                li.append($('<div/>').append(desc))

                var date = new Date(null);
                date.setMilliseconds(activity["timestamp"]) // specify value for SECONDS here
                var dateVal = date.toString();

                li.append($('<h6/>').append(dateVal));
              })

              $('#contrast-events').click(function (event) {
                var text = $(event.target).text();
                console.log(text);
              });

            }
          }
        }
      })
    }
  })

}, false);