// Generated by CoffeeScript 1.10.0
var BarChart, PieChart, applyTrade, fetchSalaries, fetchStats, getURLParameter, initApp, initSalaries, initStats, initTeamDropdown, load, playerNameMatcher, playersFromTeam, playersNotFromTeam, reRenderForTeam, renderPlayerTable, renderTradeDropdown, renderTrades, salaryString, sortPlayersBySalary, sortTeams, tradeUpdate, transformData;

window.stats_ur;

window.salary_url;

window.trades_url;

window.statsData;

window.salaryCap;

window.salaryFloor;

window.teamNames;

window.teamPlayers;

window.otherPlayers;

window.savedTrades;

window.onload = function() {
  window.stats_url = 'https://script.google.com/macros/s/AKfycbwMUwbXgU-bbMrQ8SCLBloLV9EPefKn6ira8QlsAEyKNouXCEw/exec?resource=Stats';
  window.salary_url = 'https://script.google.com/macros/s/AKfycbwMUwbXgU-bbMrQ8SCLBloLV9EPefKn6ira8QlsAEyKNouXCEw/exec?resource=Salaries';
  window.trades_url = 'https://script.google.com/macros/s/AKfycbwMUwbXgU-bbMrQ8SCLBloLV9EPefKn6ira8QlsAEyKNouXCEw/exec?resource=Trades';
  if (getURLParameter('gm') === '1') {
    window.stats_url += '&realnames=YES';
    window.trades_url += '&realnames=YES';
  }
  window.pieChart = new PieChart();
  window.barChart = new BarChart();
  return load();
};

getURLParameter = function(name) {
  var j, key, len, query, raw_vars, ref, v, val;
  query = window.location.search.substring(1);
  raw_vars = query.split("&");
  for (j = 0, len = raw_vars.length; j < len; j++) {
    v = raw_vars[j];
    ref = v.split("="), key = ref[0], val = ref[1];
    if (key === name) {
      return decodeURIComponent(val);
    }
  }
};

load = function() {
  return fetchStats();
};

fetchStats = function() {
  return $.ajax({
    url: stats_url,
    type: "GET",
    dataType: "jsonp",
    success: function(data) {
      return initStats(data);
    }
  });
};

initStats = function(data) {
  window.statsData = data.slice(1);
  transformData();
  return fetchSalaries();
};

transformData = function() {
  var nameIndex, salaryIndex, teamNameIndex;
  nameIndex = 0;
  teamNameIndex = 31;
  salaryIndex = 29;
  return window.statsData.forEach(function(player) {
    player.name = player[nameIndex];
    player.team = player[teamNameIndex];
    return player.salary = player[salaryIndex];
  });
};

fetchSalaries = function() {
  return $.ajax({
    url: salary_url,
    type: "GET",
    dataType: "jsonp",
    success: function(data) {
      return initSalaries(data);
    }
  });
};

initSalaries = function(data) {
  window.salaryCap = data[2][1];
  window.salaryFloor = data[2][2];
  return initApp();
};

initApp = function() {
  window.teamNames = _.uniq(_.pluck(window.statsData, "team"));
  window.teamNames = _.reject(window.teamNames, function(teamName) {
    return teamName === "Substitute" || teamName === "(sub inc)" || teamName === "Injury";
  });
  window.teamNames = sortTeams(window.teamNames);
  window.savedTrades = [];
  $("div#app > div#loading").hide();
  $("div#app > div#loaded").show();
  initTeamDropdown(window.teamNames);
  reRenderForTeam(window.teamNames[0]);
  return window.barChart.graph();
};

sortTeams = function(teamNames) {
  var lengthSortedNames, sortedNames;
  lengthSortedNames = _.sortBy(teamNames, function(name) {
    return name.length;
  });
  sortedNames = [];
  while (lengthSortedNames.length > 0) {
    sortedNames.push(lengthSortedNames.shift());
    sortedNames.push(lengthSortedNames.pop());
  }
  return _.compact(sortedNames);
};

playersFromTeam = function(teamName) {
  return _.where(window.statsData, {
    team: teamName
  });
};

playersNotFromTeam = function(teamName) {
  var otherTeams;
  otherTeams = _.reject(window.teamNames, function(name) {
    return name === teamName;
  });
  return _.filter(window.statsData, function(player) {
    return _.contains(otherTeams, player.team);
  });
};

sortPlayersBySalary = function(players) {
  return _.sortBy(players, function(player) {
    return player.salary;
  });
};

salaryString = function(salary) {
  return "$ " + salary.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

initTeamDropdown = function(teamNames) {
  var node;
  node = $("#teamDropdown > ul.dropdown-menu");
  teamNames.reverse().forEach(function(teamName) {
    var li;
    li = "<li> <a href='#'>" + teamName + "</a> </li>";
    return node.append(li);
  });
  return $("#teamDropdown li a").click((function(_this) {
    return function(event) {
      var teamName;
      event.preventDefault();
      teamName = $(event.target).text().trim();
      if (window.savedTrades.length > 0) {
        if (confirm("Changing teams will clear trades") === true) {
          window.savedTrades = [];
          renderTrades(window.savedTrades);
          return reRenderForTeam(teamName);
        }
      } else {
        return reRenderForTeam(teamName);
      }
    };
  })(this));
};

$("#tradeForm").on("submit", function(event) {
  var node, receivedPlayer, receivedPlayerName, trade, tradedPlayer, tradedPlayerName;
  event.preventDefault();
  node = $(event.target);
  tradedPlayerName = node.find("#tradedPlayer").val();
  receivedPlayerName = node.find("#receivedPlayer").val();
  tradedPlayer = _.find(window.teamPlayers, function(player) {
    return player.name === tradedPlayerName;
  });
  receivedPlayer = _.find(window.otherPlayers, function(player) {
    return player.name === receivedPlayerName;
  });
  if (tradedPlayer && receivedPlayer) {
    trade = {
      tradedPlayer: tradedPlayer,
      receivedPlayer: receivedPlayer
    };
    savedTrades.push(trade);
    applyTrade(trade);
    event.target.reset();
    return _.defer(tradeUpdate);
  } else {
    return alert("Invalid Trade!");
  }
});

$("select#tradedPlayer").change(function(event) {
  return tradeUpdate(event);
});

$("input#receivedPlayer").on("typeahead:closed", function(event) {
  return tradeUpdate(event);
});

$("input#receivedPlayer").on("blur", function(event) {
  return tradeUpdate(event);
});

tradeUpdate = function(event) {
  var receivedPlayer, receivedPlayerName, trade, tradedPlayer, tradedPlayerName, url;
  tradedPlayerName = $("#tradedPlayer").val();
  receivedPlayerName = $("#receivedPlayer").val();
  url = "https://player-comparer.5apps.com/?playerA=" + tradedPlayerName + "&playerB=" + receivedPlayerName;
  $("a#compare").attr("href", url);
  tradedPlayer = _.find(window.teamPlayers, function(player) {
    return player.name === tradedPlayerName;
  });
  receivedPlayer = _.find(window.otherPlayers, function(player) {
    return player.name === receivedPlayerName;
  });
  if (tradedPlayer && receivedPlayer) {
    trade = {
      tradedPlayer: tradedPlayer,
      receivedPlayer: receivedPlayer
    };
    return window.barChart.graph(trade);
  }
};

playerNameMatcher = function() {
  var findMatches;
  return findMatches = function(q, cb) {
    var j, len, matches, name, ref, substrRegex;
    matches = [];
    substrRegex = new RegExp(q, "i");
    ref = _.pluck(window.otherPlayers, 'name');
    for (j = 0, len = ref.length; j < len; j++) {
      name = ref[j];
      if (substrRegex.test(name)) {
        matches.push({
          value: name
        });
      }
    }
    cb(matches);
  };
};

$('input.typeahead').typeahead({
  hint: true,
  highlight: true,
  minLength: 1
}, {
  name: 'players',
  displayKey: 'value',
  source: playerNameMatcher()
});

reRenderForTeam = function(teamName) {
  $("#teamDropdown #btn-text").text(teamName);
  window.teamPlayers = playersFromTeam(teamName);
  window.teamPlayers = sortPlayersBySalary(window.teamPlayers);
  renderTradeDropdown(window.teamPlayers);
  window.otherPlayers = playersNotFromTeam(teamName);
  window.pieChart.graph(window.teamPlayers);
  return renderPlayerTable(window.teamPlayers);
};

renderTradeDropdown = function(players) {
  var node;
  node = $("select#tradedPlayer");
  $(node).empty();
  return players.forEach(function(player) {
    var opt;
    opt = "<option>" + player.name + "</option>";
    return node.append(opt);
  });
};

renderPlayerTable = function(players) {
  var node, teamSalary, tr;
  node = $("#players-table > tbody");
  node.find("tr").remove();
  teamSalary = 0;
  players.reverse().forEach(function(player, index) {
    var tr;
    teamSalary += player.salary;
    tr = "<tr>\n  <td>" + (index + 1) + "</td>\n  <td>" + player.name + "</td>\n  <td>" + (salaryString(player.salary)) + "</td>\n</tr>";
    return node.append(tr);
  });
  tr = '';
  if (teamSalary < window.salaryCap) {
    tr = "<tr class='underCap'><td></td> <td>Total:</td><td>" + (salaryString(teamSalary)) + "</td></tr>";
  } else {
    tr = "<tr class='overCap'><td></td> <td>Total:</td><td>" + (salaryString(teamSalary)) + "</td></tr>";
  }
  return node.append(tr);
};

renderTrades = function(trades) {
  var node;
  node = $("#trades");
  $(node).empty();
  savedTrades.forEach(function(trade, index) {
    var html, undo;
    undo = "<button class='btn btn-sm btn-default' id='undoTrade'>Undo</button>";
    html = "<div class='form-inline'>\n  <div class='form-group'>\n    <select class='form-control input-sm' disabled='true'>\n      <option>" + trade.tradedPlayer.name + "</option>\n      <option>" + (_.max(teamPlayers, function(player) {
      return player.name.length;
    }).name) + "</option>\n    </select>\n  </div>\n  <span>  &nbsp;  --------&gt;  &nbsp;  </span>\n  <div class='form-group'>\n    <input type='text' class='form-control input-sm' disabled='true' value='" + trade.receivedPlayer.name + "'>\n  </div>\n  " + (index === savedTrades.length - 1 ? undo : "") + "\n</div>\n<br>";
    return node.append(html);
  });
  return $("#undoTrade").click(function(event) {
    var revertedTrade, trade;
    trade = window.savedTrades.pop();
    revertedTrade = {
      tradedPlayer: trade.receivedPlayer,
      receivedPlayer: trade.tradedPlayer
    };
    return applyTrade(revertedTrade);
  });
};

applyTrade = function(trade) {
  var tradingTeam;
  tradingTeam = trade.tradedPlayer.team;
  trade.tradedPlayer.team = trade.receivedPlayer.team;
  trade.receivedPlayer.team = tradingTeam;
  window.barChart.graph();
  reRenderForTeam(tradingTeam);
  return renderTrades(window.savedTrades);
};

PieChart = (function() {
  function PieChart() {
    this.width = 920;
    this.height = 480;
    this.radius = Math.min(this.width, this.height) / 2;
    this.arc = d3.svg.arc().outerRadius(this.radius - 10).innerRadius(0);
    this.pie = d3.layout.pie().sort(null).value(function(d) {
      return d.salary;
    });
    this.chart = d3.select(".pie-chart").attr("width", this.width).attr("height", this.height).append("g").attr("transform", "translate(" + this.width / 2 + "," + this.height / 2 + ")");
  }

  PieChart.prototype.graph = function(players) {
    var data;
    data = [];
    players.forEach(function(player, index) {
      return data.push({
        name: player.name,
        pos: index,
        salary: player.salary
      });
    });
    if (this.chart.selectAll("*")[0].length === 0) {
      return this._initPlot(data);
    } else {
      return this._updatePlot(data);
    }
  };

  PieChart.prototype._initPlot = function(data) {
    var g;
    g = this.chart.selectAll(".arc").data(this.pie(data)).enter().append("g").attr("class", "arc");
    g.append("path").attr("d", this.arc).attr("class", function(d) {
      return "green-" + d.data.pos;
    }).each(function(d) {
      return this._current = d;
    });
    return g.append("text").attr("transform", (function(_this) {
      return function(d) {
        var c, h, labelr, x, y;
        c = _this.arc.centroid(d);
        x = c[0];
        y = c[1];
        h = Math.sqrt(x * x + y * y);
        labelr = _this.radius - 60;
        return "translate(" + (x / h * labelr) + "," + (y / h * labelr) + ")";
      };
    })(this)).attr("dy", ".35em").style("text-anchor", "middle").text(function(d) {
      return d.data.name;
    });
  };

  PieChart.prototype._arcTween = function(a) {
    var i;
    i = d3.interpolate(this._current, a);
    this._current = i(0);
    return function(t) {
      return window.pieChart.arc(i(t));
    };
  };

  PieChart.prototype._updatePlot = function(data) {
    this.chart.selectAll("text").data(this.pie(data)).transition().duration(10).attr("transform", (function(_this) {
      return function(d) {
        var c, h, labelr, x, y;
        c = _this.arc.centroid(d);
        x = c[0];
        y = c[1];
        h = Math.sqrt(x * x + y * y);
        labelr = _this.radius - 60;
        return "translate(" + (x / h * labelr) + "," + (y / h * labelr) + ")";
      };
    })(this)).text(function(d) {
      return d.data.name;
    });
    return this.chart.selectAll("path").data(this.pie(data)).transition().duration(10).attrTween("d", this._arcTween);
  };

  return PieChart;

})();

BarChart = (function() {
  function BarChart() {
    this.margin = {
      top: 20,
      right: 20,
      bottom: 30,
      left: 40
    };
    this.width = 1100 - this.margin.left - this.margin.right;
    this.height = 500 - this.margin.top - this.margin.bottom;
    this.x = d3.scale.ordinal().rangeRoundBands([0, this.width], .1);
    this.y = d3.scale.linear().rangeRound([this.height, 0]);
    this.xAxis = d3.svg.axis().scale(this.x).orient("bottom");
    this.yAxis = d3.svg.axis().scale(this.y).orient("left").tickFormat(d3.format(".2s"));
    this.chart = d3.select(".chart").attr("width", this.width + this.margin.left + this.margin.right).attr("height", this.height + this.margin.top + this.margin.bottom).append("g").attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
  }

  BarChart.prototype.graph = function(trade) {
    var data, j, len, players, ref, salaries, teamName, y0;
    data = [];
    ref = window.teamNames;
    for (j = 0, len = ref.length; j < len; j++) {
      teamName = ref[j];
      players = playersFromTeam(teamName);
      if (trade) {
        this._performTrade(players, trade);
      }
      players = sortPlayersBySalary(players);
      salaries = [];
      y0 = 0;
      players.forEach(function(player, index) {
        return salaries.push({
          name: player.name,
          salary: player.salary,
          pos: index,
          y0: y0,
          y1: y0 += player.salary
        });
      });
      data.push({
        team: teamName,
        salaries: salaries,
        total: salaries[salaries.length - 1].y1
      });
    }
    this.x.domain(data.map(function(d) {
      return d.team;
    }));
    this.y.domain([
      0, d3.max(data, function(d) {
        return d.total;
      })
    ]);
    if (this.chart.selectAll("*")[0].length === 0) {
      return this._initPlot(data);
    } else {
      return this._updatePlot(data);
    }
  };

  BarChart.prototype._performTrade = function(players, trade) {
    var index, j, len, player, results;
    results = [];
    for (index = j = 0, len = players.length; j < len; index = ++j) {
      player = players[index];
      if (player === trade.tradedPlayer) {
        results.push(players[index] = trade.receivedPlayer);
      } else if (player === trade.receivedPlayer) {
        results.push(players[index] = trade.tradedPlayer);
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  BarChart.prototype._initPlot = function(data) {
    var team;
    this.chart.append("g").attr("class", "x axis").attr("transform", "translate(0," + this.height + ")").call(this.xAxis);
    this.chart.append("g").attr("class", "y axis").call(this.yAxis);
    this.chart.append("svg:line").attr("x1", 0).attr("x2", this.width - 20).attr("y1", this.y(window.salaryCap)).attr("y2", this.y(window.salaryCap)).style("stroke", "#000").style("fill", "none").style("stroke-width", 1).style("shape-rendering", "crispEdges");
    this.chart.append("svg:line").attr("x1", 0).attr("x2", this.width - 20).attr("y1", this.y(window.salaryFloor)).attr("y2", this.y(window.salaryFloor)).style("stroke", "#238B45").style("fill", "none").style("stroke-width", 1).style("shape-rendering", "crispEdges");
    this.tip = d3.tip().attr("class", "d3-tip").offset([-10, 0]).html(function(d) {
      return "<p>" + d.name + "</p> <p>" + (salaryString(d.salary)) + "</p>";
    });
    this.chart.call(this.tip);
    team = this.chart.selectAll(".team").data(data).enter().append("g").attr("class", "g").attr("transform", (function(_this) {
      return function(d) {
        return "translate(" + _this.x(d.team) + ",0)";
      };
    })(this));
    return team.selectAll("rect").data(function(d) {
      return d.salaries;
    }).enter().append("rect").attr("transform", (function(_this) {
      return function(d) {
        return "translate(" + _this.x.rangeBand() * 0.25 + ",0)";
      };
    })(this)).attr("width", this.x.rangeBand() * 0.5).attr("class", function(d) {
      if (d.y1 > window.salaryCap) {
        return "yellow-11";
      } else {
        return "green-" + d.pos;
      }
    }).attr("y", this.height).attr("height", 0).on("mouseover", this.tip.show).on("mouseout", this.tip.hide).transition(300).attr("y", (function(_this) {
      return function(d) {
        return _this.y(d.y1);
      };
    })(this)).attr("height", (function(_this) {
      return function(d) {
        return _this.y(d.y0) - _this.y(d.y1);
      };
    })(this));
  };

  BarChart.prototype._updatePlot = function(data) {
    var flatData;
    flatData = [];
    data.forEach(function(d) {
      return flatData = flatData.concat(d.salaries);
    });
    return this.chart.selectAll("rect").data(flatData).transition(300).attr("y", (function(_this) {
      return function(d) {
        return _this.y(d.y1);
      };
    })(this)).attr("height", (function(_this) {
      return function(d) {
        return _this.y(d.y0) - _this.y(d.y1);
      };
    })(this)).attr("class", function(d) {
      if (d.y1 > window.salaryCap) {
        return "yellow-11";
      } else {
        return "green-" + d.pos;
      }
    });
  };

  return BarChart;

})();
