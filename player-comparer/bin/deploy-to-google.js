/**
 * This script allows you to do a partial deploy to a Google App Script project.
 * It will update (overwrite) the specified file in the project but leave other
 * files in tact.
 */

var fileId = '1RBAmoNayey8VaxEcOML3JDJVYhktBpfhyryiQSA3c212r7Z9SnEJkUGg';
var remoteFileName = 'index_js'
var localFilePath = 'player-comparer.js'

var _  = require('underscore'),
    fs = require('fs'),
    request = require('sync-request'),
    google = require('googleapis'),
    PersitedGoogleAuth = require('./utils/persisted_google_auth');

PersitedGoogleAuth.authenticate(
  ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/drive.scripts'],
  deploy
);

function deploy(auth) {
  project = fetchProject(auth);
  project = updateProject(project);
  saveProject(auth, project);
}

/**
 * Fetch the project from Google Drive and parse the response
 */
function fetchProject(auth) {
  console.log('Fetching the project ...');

  var response = request('GET',
    'https://script.google.com/feeds/download/export?format=json&id=' + fileId,
    {
      qs :{ 'access_token' : auth.credentials.access_token }
    }
  )

  //console.log(response.body.toString());
  var project = JSON.parse(response.body);

  if (!project.files) {
    console.log('No files in the Project');
    return;
  }

  return project
}

/**
 * Find the file to be replaced and then update its source to match the local file
 */
function updateProject(project) {
  console.log('Updating project ...');

  var parserFileIdx = _.findIndex(project.files, function(file){ return file.name == remoteFileName });

  if(parserFileIdx == -1) {
    console.log("Could not find index of file: " + remoteFileName + " in " + _.map(project.files, function(f){ return f.name }).join(', '))
  }

  var newSource = "<script>" + fs.readFileSync(localFilePath).toString(); + "<\/script>"

  project.files[parserFileIdx].source = newSource;
  return project;
}

/**
 * Save the project back to Google Drive
 */
function saveProject(auth, project) {
  console.log('Saving project ...');
  var service = google.drive('v2');
  var options = {
    auth: auth,
    fileId: fileId,
    newRevision: true,
    media: {
      mimeType: 'application/vnd.google-apps.script+json',
      body: JSON.stringify({ files: project.files })
    }
  };

  service.files.update(options, function(err, response) {

    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }

    console.log('Deploy successful.');
    return;
  });
}
