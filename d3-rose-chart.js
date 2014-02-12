/**
 * Created by jmcmicha on 2/11/14.
 */

var width = 950,
    height = 950,
    radius = Math.min(width, height) / 2 - 50,
    innerRadius = 20,
    numTicks = 5,
    sdat = [];

var color = d3.scale.category20();

var ageRange = d3.scale.linear()
    .domain([0, 100])
    .range([innerRadius, radius]);

var arc = d3.svg.arc()
    .outerRadius(function(d) {
        var age = d.data.AGE == 100 ? 59.9 : d.data.AGE;
        return ageRange(age);
    })
    .innerRadius(innerRadius);

var pie = d3.layout.pie()
    .sort(null)
    .value(function(d) { return 1});
//    .value(function(d) { return d.NORMAL_VAF; });

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

for (i=0; i<=numTicks; i++) {
    sdat[i] = innerRadius + (((radius - innerRadius)/numTicks) * i);
}

d3.csv("samples-data-1.csv", function(error, data) {
    data = _.map(_.sortBy(data, ["GENE", "AGE"], _.values));
    legendItems = _.uniq(_.pluck(data, "GENE"));

    var g = svg.selectAll(".arc")
        .data(pie(data))
        .enter().append("g")
        .attr("class", "arc");

    g.append("path")
        .attr("d", arc)
        .attr("data-legend", function(d) { return d.data.GENE})
        .attr("data-legend-pos", function(d) { return legendItems.indexOf(d.data.GENE)})
        .style("fill", function(d) { return color(d.data.GENE); });

//    g.append("text")
//        .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
//        .attr("dy", ".35em")
//        .style("text-anchor", "middle")
//        .text(function(d) { return d.data.GENE; });

    g.append("g")
        .attr("class","legend")
        .attr("transform","translate(400,225)")
        .style("font-size","12px")
        .call(d3.legend);

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
        .style("stroke", "#333")
        .style("opacity", 0.5)
        .style("fill", "none");

    circleAxes.append("svg:text")
        .attr("text-anchor", "center")
        .attr("dy", function(d) { return d - 5 })
        .style("fill", "#333")
        .text(function(d,i) { return i * (100/numTicks) });
};
