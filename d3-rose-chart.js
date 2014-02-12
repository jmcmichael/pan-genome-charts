/**
 * Created by jmcmicha on 2/11/14.
 */

var width = 950,
    height = 950,
    radius = Math.min(width, height) / 2 - 50,
    innerRadius = 20,
    numTicks = 5,
    sdat = [];

//var color = d3.scale.ordinal()
//    .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

var color = d3.scale.category20();

var ageRange = d3.scale.linear()
    .domain([0, 100])
    .range([innerRadius, radius])


var arc = d3.svg.arc()
    .outerRadius(function(d) {
        var oRad = ageRange(d.data.AGE);
        return oRad;
    })
    .innerRadius(innerRadius);

var pie = d3.layout.pie()
    .sort(null)
    .value(function(d) { return d.NORMAL_VAF; });

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

for (i=0; i<=numTicks; i++) {
    sdat[i] = innerRadius + (((radius - innerRadius)/numTicks) * i);
}

console.log(["sdat:", sdat].join(" "));

d3.csv("calibration-data.csv", function(error, data) {
    data = _.map(_.sortBy(data, ["GENE", "AGE"], _.values));
    var g = svg.selectAll(".arc")
        .data(pie(data))
        .enter().append("g")
        .attr("data-legend",function(d) { return d.GENE})
        .attr("class", "arc");

    g.append("path")
        .attr("d", arc)
        .style("fill", function(d) { return color(d.data.GENE); });

    g.append("text")
        .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
        .attr("dy", ".35em")
        .style("text-anchor", "middle")
        .text(function(d) { return d.data.GENE; });

    addCircleAxes();
   //  addLegend();
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
        .style("stroke", "#333")
        .style("opacity", 0.5)
        .style("fill", "none");

    circleAxes.append("svg:text")
        .attr("text-anchor", "center")
        .attr("dy", function(d) { return d - 5 })
        .style("fill", "#333")
        .text(function(d,i) { return i * (100/numTicks) });

};

addLegend = function() {
    legend = svg.append("g")
        .attr("class","legend")
        .attr("transform","translate(50,30)")
        .style("font-size","12px")
        .call(d3.legend);
};