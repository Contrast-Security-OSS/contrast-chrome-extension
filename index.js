document.addEventListener('DOMContentLoaded', function() {
  var inputBox = document.getElementById('contrast-input');
  var submitButton = document.getElementById('contrast-submit')
  console.log('hello world');

  submitButton.addEventListener('click', function() {
    var value = inputBox.value;
    console.log(value);
  }, false);

}, false);
