player-comparer
===============

A player stat comparer app written in D3.js

Notes:

* The url needed for the spread sheet is not the same as the sharing one. You need to go to file -> publish to web and use that url.
* Tabletop.js has issues with more complicated spreadsheets so the top row needs to be the column headings for the data and nothing more or it will mess it up
* Its also a bit tricky to publish just a sub spread sheet to the web - the default is the whole doc so make sure you do this right

Running locally:

```
python -m SimpleHTTPServer 8000
```

Then the app is available at localhost:8000/index.html
