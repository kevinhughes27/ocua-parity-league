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

Create a new Google Spreadsheet and then click tools -> script editor from the menu bar. Then copy in the code for the server. You need to save a new version from File -> Manage versions ... before you can 'deploy' the app. After saving a new verions select Publish from the menu and chose 'Deploy as web app'. Then take your url and put it in the client example.

Read more about Google App Script [here](https://developers.google.com/apps-script/). I also found [this](http://pipetree.com/qmacro/blog/2013/10/sheetasjson-google-spreadsheet-data-as-json/) blog post very helpful.
