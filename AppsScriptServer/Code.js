var spreadsheetID = '1npfSZDQJjFPCFce9LQO9xbjvxHhZJQXma92XhOIsMkI';

function doGet(request){
  var output = ContentService.createTextOutput();
  var resource = request.parameter.resource;
  data = getResource(resource);

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

/*
 * get the requested resource and return it as json
 */
function getResource(resource){
  switch(resource) {

    // default is to fetch the whole sheet
    case 'Sheet1':
      return _readData({sheetname: 'Sheet1'});
      break;

    // the data in Sheet2 of interest starts in row 13
    case 'Sheet2':
      return _readData({sheetname: 'Sheet2', firstRow: 13});
      break;

    // the data in Sheet3 of interest starts in row 2 and is between col 2 and 5
    case 'Sheet3':
      return _readData({sheetname: 'Sheet3', firstRow: 2, firstCol: 2, lastCol: 5});
      break;

    default:
      return {};
  }
}

/*
 * fetches the data from the specified sheet at the given location
 * assumes the data has a header in the first row of the data.
 * the location of the data in the sheet can be passed in options
 * otherwise defaults will be used. The function also skips blank rows
 * in the data.
 */
function _readData(options) {
  var spreadSheet = SpreadsheetApp.openById(spreadsheetID);
  var sheet = spreadSheet.getSheetByName(options.sheetname);

  // options or defaults
  options.firstRow = options.firstRow || 1;
  options.lastRow  = options.lastRow  || sheet.getLastRow();
  options.firstCol = options.firstCol || 1;
  options.lastCol  = options.lastCol  || sheet.getLastColumn();

  var numRows = options.lastRow - options.firstRow;
  var numCols = options.lastCol - options.firstCol;

  // read data
  var properties = sheet.getRange(options.firstRow, options.firstCol, 1, numCols).getValues()[0];
  var rows = sheet.getRange(options.firstRow+1, options.firstCol, numRows-1, numCols).getValues();

  // format data
  var data = [];
  for (var r = 0, l = rows.length; r < l; r++) {
    var row = rows[r];
    if(_emptyRow(row)){ continue; }

    var record = {};
    for (var p in properties) {
      record[properties[p]] = _convert(row[p]);
    }
    data.push(record);
  }
  return data;
}

function _emptyRow(row){
  var isEmpty = true;
  for (var i = 0; i < row.length; i++){
    isEmpty = (row[i] == "");
  }

  return isEmpty;
}

function _convert(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}
