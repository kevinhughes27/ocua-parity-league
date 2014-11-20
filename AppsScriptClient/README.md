AppsScriptClient
================

Simple example client app for pulling data served by a Google App Script web app

Simple Google App Script server code:

```javascript
function doGet(request){
  var output = ContentService.createTextOutput();

  data = {foo: 'bar'};

  var callback = request.parameters.callback;
  if (callback == undefined) {
    output.setContent(JSON.stringify(data));
    output.setMimeType(ContentService.MimeType.JSON);
  }
  else {
    output.setContent(callback + "(" + JSON.stringify(data) + ")");
    output.setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return output;
}
```

Read more about Google App Script [here](https://developers.google.com/apps-script/)
