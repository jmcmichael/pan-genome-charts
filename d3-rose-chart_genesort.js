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

var labelArc = d3.svg.arc()
    .outerRadius(radius + 10)
    .innerRadius(radius);

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
    .value(function(d) { return 1
    });

var pieGroups = d3.layout.pie()
    .sort(null)
    .value(function(d) {
        return d.length;
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

// set up tick positions (this can probably be done more elegantly...)
for (i=0; i<=numTicksAge; i++) {
    sdat[i] = ageInnerRadius + (((radius - ageInnerRadius)/numTicksAge) * i);
}

for (i=0; i<=numTicksVaf; i++) {
    sdatVaf[i] = vafInnerRadius + (((ageInnerRadius - vafInnerRadius)/numTicksVaf) * i);
}

d3.csv("samples-data-5.csv", function(error, data) {
    var dataGroups;

    // groupBy gene name (using notAML as the gene name for genes in the notAML group)
    dataGroups = _.groupBy(data, function (sample) {
        if (sample.GROUP == "AML") {
            return sample.GENE;
        } else {
            return "notAML";
        }
    });

    // sort dataGroups by sample count in each group, descending
    dataGroups = _.sortBy(dataGroups, function(group) { return group.length; }).reverse();

    // sort each group by age
    dataGroups = _.map(dataGroups, function(group){
        return _.sortBy(group, "AGE");
    });

    // move singletons to their own group
    var singletonGroupArray = _.remove(dataGroups, function(group) {
        return group.length == 1;
    });

    // convert from array of arrays of objects to array of objects
    var singletonGroup = [];
    _.forEach(singletonGroupArray, function(array) {
        singletonGroup.push(array[0]);
    });

    singletonGroup = _.sortBy(singletonGroup, "AGE");
    dataGroups.push(singletonGroup);

    // move notAML group to the end
    var notAMLgroup = _.remove(dataGroups, function(group) {
        if (_.every(group, function(sample) { return sample.GROUP == "notAML"; })) {
            return true;
        }
    });
    dataGroups.push(notAMLgroup[0]);
    
    // get a list of non-aml genes for use in constructing the key
    console.log("notAML group:" );
    console.log(_.map(notAMLgroup[0], function(s) { return s.GENE }).sort().join(" "));

    // concat all groups into one data array
    data = data.concat.apply([], dataGroups);

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
                return "#EFEFEF";
            } else {
                return ageColor(d.data.GENE);
            }
        })
        .style("stroke", function(d) {

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

    // draw gene group label arcs
    var gLabels= svg.append("g")
        .attr("id", "gLabels");

    var gl = gLabels.selectAll(".arc")
        .data(pieGroups(dataGroups))
        .enter().append("g");

    gl.append("path")
        .attr("d", labelArc)
        .style("fill", function(d) {
            return ageColor(d.data[0].GENE)
        })
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
};
