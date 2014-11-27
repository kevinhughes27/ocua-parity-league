AppsScriptServer
================

An example script of how to use Google Apps Script to serve certain bits of data from a spreadsheet as JSON. I created this because publishing the sheet to the live web and fetching the data via ajax or using [Tabletop.js](https://github.com/jsoma/tabletop) wasn't working well enough. Specifically if the data wasn't in the top row I wouldn't get the correct results back. Using this example you can specify where your data is and serve just what you need.

Please use responsibly! I've found the pattern of storing some simple data in a Google spreadsheet and then creating small frontend visualizations using javascript and D3 to be fun and productive but you probably shouldn't use this pattern for anything much more complicated than that.

Usage
-----

Create a new Google Spreadsheet and then click tools -> script editor from the menu bar. Then copy in the code for the server. You need to save a new version from File -> Manage versions ... before you can 'deploy' the app. After saving a new verions select Publish from the menu and chose 'Deploy as web app'. Then take your url and put it in the client example.

Thanks
------

[this](http://pipetree.com/qmacro/blog/2013/10/sheetasjson-google-spreadsheet-data-as-json/) blog post was very helpful while I was working on this.
