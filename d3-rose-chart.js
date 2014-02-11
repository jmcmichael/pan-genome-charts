/**
 * Created by jmcmicha on 2/11/14.
 */

var width = 768,
    height = 768,
    radius = Math.min(width, height) / 2 - 50,
    numTicks = 5,
    sdat = [];

//var color = d3.scale.ordinal()
//    .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

var color = d3.scale.category20();


var arc = d3.svg.arc()
    .outerRadius(function(d) {
        var oRad = 50 + (radius - 50) * d.data.percent / 100;
        console.log(["radius:", radius].join(" "));
        console.log(["outerRadius:", oRad].join(" "));
        return oRad;
    })
    .innerRadius(20);

var pie = d3.layout.pie()
    .sort(null)
    .value(function(d) { return d.population; });

var grid = d3.svg.area.radial()
    .radius(150);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

for (i=0; i<=numTicks; i++) {
    sdat[i] = 20 + ((radius/numTicks) * i);
}

console.log(["sdat:", sdat].join(" "));

d3.csv("data.csv", function(error, data) {

    var g = svg.selectAll(".arc")
        .data(pie(data))
        .enter().append("g")
        .attr("class", "arc");

    g.append("path")
        .attr("d", arc)
        .style("fill", function(d) { return color(d.data.age); });

    g.append("text")
        .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
        .attr("dy", ".35em")
        .style("text-anchor", "middle")
        .text(function(d) { return d.data.age; });

    addCircleAxes();
});

addCircleAxes = function() {
    var circleAxes, i;

    svg.selectAll('.circle-ticks').remove();

    circleAxes = svg.selectAll('.circle-ticks')
        .data(sdat)
        .enter().append('svg:g')
        .attr("class", "circle-ticks");

    circleAxes.append("svg:circle")
        .attr("r", String)
        .attr("class", "circle")
        .style("stroke", "#CCC")
        .style("opacity", 0.5)
        .style("fill", "none");

    circleAxes.append("svg:text")
        .attr("text-anchor", "center")
        .attr("dy", function(d) { return d - 5 })
        .style("fill", "#fff")
        .text(function(d,i) { return i * (100/numTicks) });

};