window.onload = function() { load() };

var googleAppScriptServer = 'https://script.google.com/macros/s/AKfycbwYbHBx-RV90v0-cHVAMGi7e9ra3dEDy5rRBGvPut8A/dev';

function load(){
  $.ajax({
    type: 'GET',
    dataType: 'jsonp',
    url: googleAppScriptServer
  }).done(function(response){
    debugger;
  });
}
