player-comparer
===============

A player stat comparer app written in D3.js

running at:
[https://player-comparer.5apps.com/](https://player-comparer.5apps.com/)

### Screenshot:
![screenshot](https://raw.githubusercontent.com/pickle27/ocua-parity-league/master/player-comparer/screenshot.png)

Notes:
------

* The url needed for the spread sheet is not the same as the sharing one. You need to go to file -> publish to web and use that url.
* Tabletop.js has issues with more complicated spreadsheets so the top row needs to be the column headings for the data and nothing more or it will mess it up
* Its also a bit tricky to publish just a sub spread sheet to the web - the default is the whole doc so make sure you do this right

Building:
---------

Run:

```
npm run build
```

Running locally:
----------------

```
npm run server
```

Then the app is available at localhost:8080

Deploying to 5apps:

git push style deploy (only using a subtree):

```
 git subtree push --prefix player-comparer 5apps master
 ```

Deploying to Google AppScript:
  run `npm run deploy`

  which will execute the `bin/deploy_to_google.js` script. Note to use this you will need to create a Google API Client in the [Google Developers Console](https://console.developers.google.com) with type `Other`. Click the button to download the client as JSON and save it as `client_secret.json` in the directory (you should also ignore this file in source control).
