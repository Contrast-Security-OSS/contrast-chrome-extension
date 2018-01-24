function modifyString(value) {
  return 'better ' + value;
}

document.addEventListener('DOMContentLoaded', function() {
  console.log('hello world');
  var inputBox = document.getElementById('contrast-input');
  var submitButton = document.getElementById('contrast-submit');

  submitButton.addEventListener('click', function() {
    value = inputBox.value;
    newValue = modifyString(value);
    console.log(newValue);
  }, false);

}, false);
