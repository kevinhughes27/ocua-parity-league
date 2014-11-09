window.onload = function() { init() };

var ocua_spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1IWfE1OPS7yT9teBp80gcAOJ67CTUiocwB0kfTRa9iDI/pubhtml?gid=1816341719&single=true';
var spreadsheetData; // global var where the spreadsheet data will be stored after it is fetched
var playerNames; // global var containing all the player names for autocomplete

/**
 * Global Chart Config
 */
var margin = {top: 20, right: 30, bottom: 30, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var x = d3.scale.ordinal()
    .rangeRoundBands([0, width], .1);

var y = d3.scale.linear()
    .range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

var chart = d3.select(".chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");



function init(){
  Tabletop.init({ key: ocua_spreadsheet_url,
                  callback: main,
                  simpleSheet: true })
}


function main(data, tabletop){
  // set global vars
  spreadsheetData = data;
  playerNames = _.pluck(spreadsheetData, 'playersname');

  // toggle loading state
  $("div#app > div#loading").hide();
  $("div#app > div#loaded").show();

  // grab the first player
  var playerName = spreadsheetData[0].playersname;
  var playerData = transformPlayerData(spreadsheetData[0]);

  // graph and set the input state
  graphPlayer(playerData);
  $('input#player').typeahead('val', playerName);
}


/*
 * typeahead.js matcher
 */
var playerNameMatcher = function(){
  return function findMatches(q, cb) {
    var matches, substrRegex;

    // an array that will be populated with substring matches
    matches = [];

    // regex used to determine if a string contains the substring `q`
    substrRegex = new RegExp(q, 'i');

    // iterate through the pool of strings and for any string that
    // contains the substring `q`, add it to the `matches` array
    $.each(playerNames, function(i, str) {
      if (substrRegex.test(str)) {
        // the typeahead jQuery plugin expects suggestions to a
        // JavaScript object, refer to typeahead docs for more info
        matches.push({ value: str });
      }
    });

    cb(matches);
  };
};


$("input#player").on("focus", function(event){
  $(event.target).val('');
});


$('input#player').typeahead({
  hint: true,
  highlight: true,
  minLength: 1
},
{
  name: 'players',
  displayKey: 'value',
  source: playerNameMatcher()
});


$("input#player").on("typeahead:closed", function(event){
  var playerName = $(event.target).val();
  var playerData = _.find(spreadsheetData, function(player){ return player.playersname == playerName});
  if(playerName){
    playerData = transformPlayerData(playerData);
    updateGraph(playerData);
  }
});


function transformPlayerData(data){
  return [
    {name: "G", value: +data.g},
    {name: "A", value: +data.a},
    {name: "2A", value: +data.a_2},
    {name: "3A", value: +data.a_3},
    {name: "4A", value: +data.a_4},
    {name: "5A", value: +data.a_5},
    {name: "D", value: +data.d},
    {name: "2A", value: +data.a_2},
    {name: "Comp.", value: +data['comp.']},
    {name: "TA", value: +data.ta},
    //{name: "Threw Drop", value: +data.threwDrop},
    //{name: "Throwing %", value: +data.throwing},
    {name: "Catch", value: +data.catch},
    {name: "Drop", value: +data.drop},
    //{name: "Catching %", value: +data.catching},
    {name: "Points For", value: +data.pointsfor},
    {name: "Points Against", value: +data.pointsagainst}
    //{name: "Previous Salaray", value: +data.previoussalary},
    //{name: "Next Week's Salaray", value: +data.nextweekssalary}
  ];
}


function graphPlayer(data){
  // scale
  x.domain(data.map(function(d) { return d.name; }));
  y.domain([0, d3.max(data, function(d) { return d.value; })]);

  //create the x axis
  chart.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  //create the y axis
  chart.append("g")
    .attr("class", "y axis")
    .call(yAxis);

  //create the rectangles
  chart.selectAll(".bar")
    .data(data)
    .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(d.name); })
      .attr("y", height )
      .attr("width", x.rangeBand())
      .attr("height", 0)
    .transition()
      .duration(200)
      .attr("y", function(d) { return y(d.value); })
      .attr("height", function(d) { return height - y(d.value); });
}


function updateGraph(data){
  chart.selectAll(".bar")
    .data(data)
    .transition()
      .duration(200)
      .attr("y", function(d) { return y(d.value); })
      .attr("height", function(d) { return height - y(d.value); });
}
