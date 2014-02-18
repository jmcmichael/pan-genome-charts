/**
 * Created by jmcmicha on 2/11/14.
 */

var width = 950,
    height = 950,
    radius = Math.min(width, height) / 2 - 50,
    ageInnerRadius = 150,
    vafInnerRadius = 70,
    numTicksAge = 5,
    numTicksVaf = 5,
    avgAge = Number(),
    sdat = [],
    sdatVaf = [];

var ageColor = d3.scale.category20();

var vafColor = d3.scale.category10();

var vafRange = d3.scale.linear()
    .domain([0,100])
    .range([vafInnerRadius, ageInnerRadius]);

var vafArc = d3.svg.arc()
    .outerRadius(function(d) { return vafRange(d.data.NORMAL_VAF); })
    .innerRadius(vafInnerRadius);

var vafArcBg = d3.svg.arc()
    .outerRadius(ageInnerRadius)
    .innerRadius(vafInnerRadius);

var ageRange = d3.scale.linear()
    .domain([0, 100])
    .range([ageInnerRadius, radius]);

var ageArc = d3.svg.arc()
    .outerRadius(function(d) {
        var age = d.data.AGE == "null" ? avgAge : d.data.AGE;
        return ageRange(age);
    })
    .innerRadius(ageInnerRadius);

var pie = d3.layout.pie()
    .sort(null)
    .value(function(d) {
//        if (d.CASE.substr(-3) == "dbl") {
//            return 0.5;
//        } else {
            return 1
//        }
    });

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");


// set up tooltips
var tipAge = d3.tip()
    .attr('class', 'd3-tip')
    .direction("center")
    .html(function(d) {
        return "<strong>CASE:</strong> <span style='color:red'>" + d.data.CASE + "</span><br/>" +
            "<strong>AGE:</strong> <span style='color: red;'>" + d.data.AGE + "</span><br/>" +
            "<strong>NORMAL VAF:</strong> <span style='color: red;'>" + d.data.NORMAL_VAF + "</span><br/>" +
            "<strong>GENE:</strong> <span style='color: red;'>" + d.data.GENE + "</span>";
    });

svg.call(tipAge);

// set up tick positions (this looks like a kludge)
for (i=0; i<=numTicksAge; i++) {
    sdat[i] = ageInnerRadius + (((radius - ageInnerRadius)/numTicksAge) * i);
}

for (i=0; i<=numTicksVaf; i++) {
    sdatVaf[i] = vafInnerRadius + (((ageInnerRadius - vafInnerRadius)/numTicksVaf) * i);
}

d3.csv("samples-data-5.csv", function(error, data) {
    // filter AML groups, singles, and doubles

    var notAMLsamples = _.filter(data, function(d) {
        return d.GROUP == "notAML";
    });

    var AMLsamples = _.reject(data, function(d) {
        return d.GROUP == "notAML";
    });

    var singles = _.reject(AMLsamples, function(d) {
        return d.CASE.substr(-3) == "dbl"
    });

    var doubles = _.filter(AMLsamples, function(d) {
        return d.CASE.substr(-3) == "dbl"
    });

    notAMLsamples = _.map(_.sortBy(notAMLsamples, ["AGE"], _.values));
    singles = _.map(_.sortBy(singles, ["GENE", "AGE"], _.values));
    doubles = _.map(_.sortBy(doubles, ["GENE", "AGE", "CASE"], _.values));


    var data = doubles.concat(singles, notAMLsamples);

    // var data = _.map(_.sortBy(data, ["AGE", "CASE", "GENE"], _.values));

    var legendItems = _.uniq(_.pluck(data, "GENE")).sort();

    avgAge = Math.round(d3.mean(_.pluck(data, "AGE")));
    console.log("avgAge: " + avgAge);

    // draw age rose chart
    var gAge = svg.append("g")
        .attr("id", "gAge");

    var ga = gAge.selectAll(".arc")
        .data(pie(data))
        .enter().append("g");

    ga.append("path")
        .attr("d", ageArc)
        .attr("data-legend", function(d) {
            if (d.data.GROUP == "notAML") {
                return "notAML"
            } else {
                return d.data.GENE
            }
        })
        .attr("data-legend-pos", function(d) { return legendItems.indexOf(d.data.GENE)})
        .style("fill", function(d) {
            if (d.data.GROUP == "notAML") {
                return "#333";
            } else {
                return ageColor(d.data.GENE);
            }
        })
        .style("stroke", function(d) {
            console.log(["CASE:", d.data.CASE].join(" "));
            if (d.data.CASE.substr(-3) == "dbl") {
                return "#0F0";
            } else if (d.data.AGE == "null") {
                return "#00F";
            } else {
                return "#FFF";
            }
        })
        .style("stroke-width", function(d) {
            return d.data.AGE == "null" ? 1 : 1;
        })
        .on('mouseover', tipAge.show)
        .on('mouseout', tipAge.hide);

    // draw VAF rose chart
    var gVaf = svg.append("g")
        .attr("id", "gVaf");

    var gVaf1 = svg.append("g")
        .attr("id", "gVaf1");

    var gVaf2 = svg.append("g")
        .attr("id", "gVaf2");

    // vaf pie bg
    var gvbg = gVaf1.selectAll(".arc")
        .data(pie(data))
        .enter().append("g");

    gvbg.append("path")
        .attr("d", vafArcBg)
        .style("fill", "#EEE")
        .style("stroke", "#FFF")
        .style("stroke-width", 1);

    // vaf pie
    var gv = gVaf2.selectAll(".arc")
        .data(pie(data))
        .enter().append("g");

    gv.append("path")
        .attr("d", vafArc)
        .style("fill", "#AAC")
        .style("stroke", "#FFF")
        .style("stroke-width", 1);

    addAgeCircleAxes();
    addVafCircleAxes();
    addLegend();
});

addAgeCircleAxes = function() {
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
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .attr("dy", function(d) { return d + 15 })
        .style("fill", "#333")
        .text(function(d,i) { return i * (100/numTicksAge) });
};

addVafCircleAxes = function() {
    var circleAxes, i;

    svg.selectAll('.circle-ticks-vaf').remove();

    circleAxes = svg.selectAll('.circle-ticks-vaf')
        .data(sdatVaf)
        .enter().append('svg:g')
        .attr("class", "circle-ticks-vaf");

    circleAxes.append("svg:circle")
        .attr("r", String)
        .attr("class", "circle")
        .style("stroke", "#333")
        .style("opacity", 0.5)
        .style("fill", "none");

    circleAxes.append("svg:text")
        .attr("text-anchor", "center")
        .attr("font-size", "8px")
        .attr("font-weight", "normal")
        .attr("dy", function(d) { return d -5 })
        .style("fill", "#333")
        .text(function(d,i) { return i * (100/numTicksVaf) });
};

addLegend = function() {
    svg.append("g")
        .attr("class","legend")
        .attr("transform","translate(400,225)")
        .style("font-size","12px")
        .call(d3.legend);
}
