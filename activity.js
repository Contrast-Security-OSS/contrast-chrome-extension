document.addEventListener('DOMContentLoaded', function() {
  ContrastFetch("/ng/e264d365-25e4-409e-a129-ec4c684c9d50/events", function() { return function(e) {
    xhr = e.currentTarget
    if (xhr.readyState == 4) {
      json = JSON.parse(xhr.responseText)
      console.log(json["activities"][0]["description"]["formattedText"])
    }
  }})

}, false);