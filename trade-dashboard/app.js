window.onload = function() { load() };

var ocua_spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1IWfE1OPS7yT9teBp80gcAOJ67CTUiocwB0kfTRa9iDI/pubhtml?gid=1421681096&single=true'
var spreadsheetData; // global var where the spreadsheet data will be stored after it is fetched
var teamNames; // globabl var containing all team names

var salaryCap = 7692003; // W3

var color = d3.scale.ordinal()
    .range(d3.range(15));

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
    width = 960 - margin.left - margin.right,
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

var chart = d3.select(".chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


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

function sortPlayersBySalary(players){
  return _.sortBy(players, function(player){ return player.salary; });
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

  // team changed handler
  $("#teamDropdown li a").click(function(event){
    teamName = $(event.target).text().trim();
    reRenderForTeam(teamName);
    event.preventDefault();
  });
}

function reRenderForTeam(teamName){
  $('#teamDropdown #btn-text').text(teamName);

  players = playersFromTeam(teamName);
  players = sortPlayersBySalary(players);

  graphTeamSalary(players);
  drawPlayerTable(players);
}

function drawPlayerTable(players){
  var node = $('#players-table > tbody');

  // clear data in the table
  node.find('tr').remove();

  players.reverse().forEach(function(player, index){
    tr = "\
    <tr>\
      <td>" + (index+1) + "</td>\
      <td>" + player.playersname + "</td>\
      <td>" + player.nextweekssalary + "</td>\
    </tr>\
    ";
    node.append(tr);
  });
}

function graphTeamSalary(players){
  var g = pieChart.selectAll(".arc")
      .data(pie(players))
    .enter().append("g")
      .attr("class", "arc");

  g.append("path")
      .attr("d", arc)
      .attr("class", function(d) { return "green-" + color(d.data.playersname); })

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
      .text(function(d) { return d.data.playersname; });
}

function graphTeams(){
  var data = []
  teamNames.forEach(function(teamName){
    players = playersFromTeam(teamName);
    players = sortPlayersBySalary(players);

    var salaries = [];
    var y0 = 0;
    players.forEach(function(player, index){
      salaries.push({ name: player.playersname, salaray: player.salary, pos: index,
                      y0: y0, y1: y0 += player.salary });
    });

    data.push({ team: teamName, salaries: salaries, total: salaries[salaries.length -1].y1 })
  });

  x.domain(data.map(function(d) { return d.team; }));
  y.domain([0, d3.max(data, function(d) { return d.total; })]);

  chart.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  chart.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Salary");

  var state = chart.selectAll(".team")
      .data(data)
    .enter().append("g")
      .attr("class", "g")
      .attr("transform", function(d) { return "translate(" + x(d.team) + ",0)"; });

  state.selectAll("rect")
      .data(function(d) { return d.salaries; })
    .enter().append("rect")
      .attr("transform", function(d){ return "translate(" + x.rangeBand()*0.2 + ",0)"; })
      .attr("width", x.rangeBand()*0.6)
      .attr("y", function(d) { return y(d.y1); })
      .attr("height", function(d) { return y(d.y0) - y(d.y1); })
      .attr("class", function(d) {
        if(d.y1 > salaryCap){
          return "yellow";
        }
        return "green-" + d.pos;
      })
}
