document.addEventListener('DOMContentLoaded', function() {
  ContrastFetch("/ng/e264d365-25e4-409e-a129-ec4c684c9d50/events", function() { return function(e) {
    xhr = e.currentTarget
    if (xhr.readyState == 4) {
      json = JSON.parse(xhr.responseText)
      //console.log(json["activities"])

      activities = json["activities"]
      $.each(activities, function(idx, activity){
        console.log(activity)
        var text = activity["description"]["text"]
        var desc = text.substring(text.indexOf("$$LINK_DELIM$$") + 14, text.lastIndexOf("$$LINK_DELIM$$"))
        var li = $('<li/>')
          .addClass('list-group-item')
          .appendTo($("#contrast-events"));

        li.append($('<h6/>').append(activity["type"].replace(/_/g, " ")))
        li.append($('<div/>').append(desc))

        var date = new Date(null);
        date.setMilliseconds(activity["timestamp"]) // specify value for SECONDS here
        dateVal = date.toString()


        li.append($('<h6/>').append(dateVal))

      })
    }
  }})

}, false);