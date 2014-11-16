window.onload = function() { load() };

var ocua_spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1IWfE1OPS7yT9teBp80gcAOJ67CTUiocwB0kfTRa9iDI/pubhtml?gid=1421681096&single=true'
var spreadsheetData; // global var where the spreadsheet data will be stored after it is fetched

var teamNames; // globabl var containing all team names
var teamPlayers = []; // globabl var containing the players of the current team
var otherPlayers = []; // global var of all the players not on the current team
var trades = []; // global var holding all the trades
var salaryCap = 7692003; // W3

/**
 * Pie Chart Config
 */
var pieWidth = 920,
    pieHeight = 480,
    radius = Math.min(pieWidth, pieHeight) / 2;

var arc = d3.svg.arc()
    .outerRadius(radius - 10)
    .innerRadius(0);

var pie = d3.layout.pie()
    .sort(null)
    .value(function(d) { return d.salary; });

var pieChart = d3.select(".pie-chart")
    .attr("width", pieWidth)
    .attr("height", pieHeight)
  .append("g")
    .attr("transform", "translate(" + pieWidth / 2 + "," + pieHeight / 2 + ")")


/**
 * Bar Chart Config
 */
var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 1100 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var x = d3.scale.ordinal()
    .rangeRoundBands([0, width], .1);

var y = d3.scale.linear()
    .rangeRound([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .tickFormat(d3.format(".2s"));

var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
      return "<p>" + d.name + "</p> <p>" + salaryString(d.salary) + "</p>";
    });

var chart = d3.select(".chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

chart.call(tip);

function load(){
  Tabletop.init({ key: ocua_spreadsheet_url,
                  callback: init,
                  simpleSheet: true })
}

function init(data, tabletop){
  // set global vars
  spreadsheetData = data;
  transformSalary(); // adds a new field 'salary' that is numeric

  teamNames = _.uniq(_.pluck(spreadsheetData, 'currentteam'));
  teamNames = _.reject(teamNames, function(teamName){ return teamName == 'Substitute' || teamName == '(sub inc)' });

  // toggle loading state
  $("div#app > div#loading").hide();
  $("div#app > div#loaded").show();

  initTeamDropdown(teamNames);
  reRenderForTeam(teamNames[0]);

  graphTeams();
}

function transformSalary(){
  spreadsheetData.forEach(function(player){
    player.salary = +player.nextweekssalary.replace(/\D/g,'');
  });
}

function playersFromTeam(teamName){
  return _.where(spreadsheetData, {currentteam: teamName});
}

function playersNotFromTeam(teamName){
  otherTeams = _.reject(teamNames, function(name){ return name == teamName});
  return _.filter(spreadsheetData, function(player){ return _.contains(otherTeams, player.currentteam); });
}

function sortPlayersBySalary(players){
  return _.sortBy(players, function(player){ return player.salary; });
}

function salaryString(salary){
  return '$ ' + salary.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

function initTeamDropdown(teamNames){
  var node = $('#teamDropdown > ul.dropdown-menu ');
  teamNames.reverse().forEach(function(teamName){
    li = "\
      <li>\
        <a href='#'>\
        " + teamName + "\
        </a>\
      </li>\
    ";
    node.append(li);
  });

  /*
   * Team Changed Handler
   */
  $("#teamDropdown li a").click(function(event){
    teamName = $(event.target).text().trim();
    if (trades.length > 0){
      if(confirm("Changing teams will clear trades") == true) {
        trades = [];
        renderTrades(trades);
        reRenderForTeam(teamName);
      }
    } else {
      reRenderForTeam(teamName);
    }

    event.preventDefault();
  });
}

/*
 * Trade Handler
 */
$('#tradeForm').on('submit', function(event){
  node = $(event.target)

  var tradedPlayerName = node.find('#tradedPlayer').val();
  var receivedPlayerName = node.find('#receivedPlayer').val();

  var tradedPlayer = _.find(teamPlayers, function(player){ return player.playersname == tradedPlayerName; })
  var receivedPlayer = _.find(otherPlayers, function(player){ return player.playersname == receivedPlayerName; })

  if(tradedPlayer && receivedPlayer) {
    var trade = {tradedPlayer: tradedPlayer, receivedPlayer: receivedPlayer};
    trades.push(trade);
    applyTrade(trade);
    event.target.reset();
  } else {
    alert("Invalid Trade!");
  }

  event.preventDefault();
});

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
    playersNames = _.pluck(otherPlayers, 'playersname');
    $.each(playersNames, function(i, str) {
      if (substrRegex.test(str)) {
        // the typeahead jQuery plugin expects suggestions to a
        // JavaScript object, refer to typeahead docs for more info
        matches.push({ value: str });
      }
    });

    cb(matches);
  };
}

$('input.typeahead').typeahead({
  hint: true,
  highlight: true,
  minLength: 1
},
{
  name: 'players',
  displayKey: 'value',
  source: playerNameMatcher()
});

function reRenderForTeam(teamName){
  $('#teamDropdown #btn-text').text(teamName);

  teamPlayers = playersFromTeam(teamName);
  teamPlayers = sortPlayersBySalary(teamPlayers);

  renderTradeDropdown(teamPlayers);

  otherPlayers = playersNotFromTeam(teamName);

  graphTeamSalary(teamPlayers);
  renderPlayerTable(teamPlayers);
}

function renderTradeDropdown(players){
  var node = $('select#tradedPlayer');
  $(node).empty();
  players.forEach(function(player){
    opt = "<option>" + player.playersname + "</option>"
    node.append(opt);
  });
}

function renderPlayerTable(players){
  var node = $('#players-table > tbody');

  // clear data in the table
  node.find('tr').remove();

  var teamSalary = 0;
  players.reverse().forEach(function(player, index){
    teamSalary += player.salary
    tr = "\
    <tr>\
      <td>" + (index+1) + "</td>\
      <td>" + player.playersname + "</td>\
      <td>" + player.nextweekssalary + "</td>\
    </tr>\
    ";
    node.append(tr);
  });

  var tr;
  if(teamSalary < salaryCap){
    tr = "<tr class='underCap'><td></td> <td>Total:</td><td>" + salaryString(teamSalary) + "</td></tr>";
  } else {
    tr = "<tr class='overCap'><td></td> <td>Total:</td><td>" + salaryString(teamSalary) + "</td></tr>";
  }

  node.append(tr);
}

function renderTrades(trades){
  var node = $('#trades');

  // clear old data
  $(node).empty();

  trades.forEach(function(trade, index){
    undo = "<button class='btn btn-sm btn-default' id='undoTrade'>Undo</button>"
    html = "\
      <div class='form-inline'>\
        <div class='form-group'>\
          <select class='form-control input-sm' disabled='true'>\
            <option>" + trade.tradedPlayer.playersname + "</option>\
            <option>" + _.max(teamPlayers, function(player){ return player.playersname.length }).playersname + "</option>\
          </select>\
        </div>\
        <span>  &nbsp;  --------&gt;  &nbsp;  </span>\
        <div class='form-group'>\
          <input type='text' class='form-control input-sm' disabled='true' value='" + trade.receivedPlayer.playersname + "'>\
        </div>\
        " + (index == trades.length-1 ? undo : '') + "\
      </div>\
      <br>\
    ";
    node.append(html);
  });

  /*
   * Undo Trade Handler
   */
  $('#undoTrade').click(function(event){
    trade = trades.pop();
    var revertedTrade = { tradedPlayer: trade.receivedPlayer, receivedPlayer: trade.tradedPlayer };
    applyTrade(revertedTrade);
  });
}

function applyTrade(trade){
  tradingTeam = trade.tradedPlayer.currentteam;
  trade.tradedPlayer.currentteam = trade.receivedPlayer.currentteam;
  trade.receivedPlayer.currentteam = tradingTeam;

  graphTeams();
  reRenderForTeam(tradingTeam);
  renderTrades(trades);
}

function graphTeamSalary(players){
  pieChart.selectAll('*').remove();

  data = [];
  players.forEach(function(player, index){
    data.push({ name: player.playersname, pos: index, salary: player.salary});
  });

  var g = pieChart.selectAll(".arc")
      .data(pie(data))
    .enter().append("g")
      .attr("class", "arc");

  g.append("path")
      .attr("d", arc)
      .attr("class", function(d) { return "green-" + d.data.pos; })

  g.append("text")
      .attr("transform", function(d) {
        var c = arc.centroid(d),
        x = c[0],
        y = c[1],
        h = Math.sqrt(x*x + y*y);
        labelr = radius - 60;
        return "translate(" + (x/h * labelr) +  ',' + (y/h * labelr) +  ")";
      })
      .attr("dy", ".35em")
      .style("text-anchor", "middle")
      .text(function(d) { return d.data.name; });
}

function graphTeams(){
  var data = []
  teamNames.forEach(function(teamName){
    players = playersFromTeam(teamName);
    players = sortPlayersBySalary(players);

    var salaries = [];
    var y0 = 0;
    players.forEach(function(player, index){
      salaries.push({ name: player.playersname, salary: player.salary, pos: index,
                      y0: y0, y1: y0 += player.salary });
    });

    data.push({ team: teamName, salaries: salaries, total: salaries[salaries.length -1].y1 })
  });

  x.domain(data.map(function(d) { return d.team; }));
  y.domain([0, d3.max(data, function(d) { return d.total; })]);

  if(chart.selectAll('*') == 0) {

    // plotting for the first time
    chart.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    chart.append("g")
        .attr("class", "y axis")
        .call(yAxis)

    // salary cap line
    chart.append("svg:line")
      .attr("x1", 0)
      .attr("x2", width-20)
      .attr("y1", y(salaryCap))
      .attr("y2", y(salaryCap))
      .style("stroke", "#000")
      .style("fill", "none")
      .style("stroke-width", 1)
      .style("shape-rendering", "crispEdges");

    var team = chart.selectAll(".team")
        .data(data)
      .enter().append("g")
        .attr("class", "g")
        .attr("transform", function(d) { return "translate(" + x(d.team) + ",0)"; });

    team.selectAll("rect")
        .data(function(d) { return d.salaries; })
      .enter().append("rect")
        .attr("transform", function(d){ return "translate(" + x.rangeBand()*0.25 + ",0)"; })
        .attr("width", x.rangeBand()*0.5)
        .attr("class", function(d) {
          if(d.y1 > salaryCap){
            return "yellow-11";
          }
          return "green-" + d.pos;
        })
        .attr("y", height)
        .attr("height", 0)
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide)
      .transition(300)
        .attr("y", function(d) { return y(d.y1); })
        .attr("height", function(d) { return y(d.y0) - y(d.y1); })

  } else {

    // updating the plot
    var flatData = [];
    data.forEach(function(d){
      flatData = flatData.concat(d.salaries);
    })

    chart.selectAll("rect")
      .data(flatData)
      .transition(300)
        .attr("y", function(d) { return y(d.y1); })
        .attr("height", function(d) { return y(d.y0) - y(d.y1); })
        .attr("class", function(d) {
          if(d.y1 > salaryCap){
            return "yellow-11";
          }
          return "green-" + d.pos;
        });
  }
}
