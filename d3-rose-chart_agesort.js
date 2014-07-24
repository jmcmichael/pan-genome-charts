/**
 * Created by jmcmicha on 2/11/14.
 */

var width = 950,
    height = 950,
    radius = Math.min(width, height) / 2 - 50,
    ageInnerRadius = 120,
    cancerTypeInnerRadius = 50,
    cancerTypeOuterRadius = 110,
    numTicksAge = 5,
    numTicksVaf = 5,
    avgAge = Number(),
    axisGap = .15,
    startAngle = axisGap/2,
    endAngle = 2*Math.PI - axisGap/2,
    axisStrokeColor = "#666",
    sdat = [],
    sdatVaf = [];

var vafRange = d3.scale.linear()
    .domain([0,100])
    .range([cancerTypeInnerRadius, cancerTypeOuterRadius]);

var vafArc = d3.svg.arc()
    .outerRadius(function(d) { return vafRange(d.data.NORMAL_VAF); })
    .innerRadius(cancerTypeInnerRadius);

var vafArcBg = d3.svg.arc()
    .outerRadius(cancerTypeOuterRadius)
    .innerRadius(cancerTypeInnerRadius);

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

var ageAxisArc = d3.svg.arc()
    .outerRadius(function(d) {
        return d + .5;
    })
    .innerRadius(function(d) {
        return d - .5;
    })
    .startAngle(startAngle)
    .endAngle(endAngle);

var pie = d3.layout.pie()
    .sort(null)
    .value(function(d) { return 1
    })
    .startAngle(startAngle)
    .endAngle(endAngle)

var pieGroups = d3.layout.pie()
    .sort(null)
    .value(function(d) {
        return d.count;
    })
    .startAngle(startAngle)
    .endAngle(endAngle);

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
    sdatVaf[i] = cancerTypeInnerRadius + (((cancerTypeOuterRadius- cancerTypeInnerRadius)/numTicksVaf) * i);
}

d3.csv("GP-77_samples-data-11.csv", function(error, data) {
    var dataGroups;
    var ageRanges = _.range(0, 100, 10);
    var avgAge = Math.round(d3.mean(_.pluck(data, "AGE")));
    console.log(["avg age:", avgAge].join(" "));

    // replace any null sample ages w/ avgerage age
    _.forEach(data, function(sample) { if (sample.AGE == "null") { sample.AGE = avgAge } } );

    // sort by case, this will place all doubled samples together
    data = _.sortBy(data, "CASE");

    // reject sample with CASE identical to the previous sample, thus eliminating doubles
    data = _.reject(data, function(sample, index) {
        if (index == 0) { return false; } // skip the first sample
        return sample.CASE == data[index-1].CASE;
    });

    // sort by age
    data = _.sortBy(data, 'AGE');

    // create age groups
    dataGroups = _.groupBy(data, function (sample) {
        rangeUpper = _.find(ageRanges, function(age) {
            return sample.AGE < age;
        });
        rangeLower = ageRanges[_.indexOf(ageRanges, rangeUpper) - 1];
        return String(rangeLower) + "-" + String(rangeUpper);
    });

    // sort dataGroups, count samples per group for group labels
    var ageGroupCount = [];
    var sortedSamples = [];
    _(dataGroups).keys().sort().each(function(ageRange) {
        ageGroupCount.push({"ageRange": ageRange, "count": dataGroups[ageRange].length});
        _.each(dataGroups[ageRange], function(sample) {
            sample.AGEGROUP = ageRange;
            sortedSamples.push(sample);
        });
    });

    // concat all groups into one data array
    data = sortedSamples;

    var legendItems = _.uniq(_.pluck(data, "AGEGROUP")).sort();

    // set up color palettes
    var ageGroupColor = d3.scale.ordinal()
        .domain(_.keys(dataGroups))
        .range(["#91A0A9","#D7DEE5"]);
    var cancerTypeColor = d3.scale.category20();

    // draw age rose chart
    var gAge = svg.append("g")
        .attr("id", "gAge");

    var ga = gAge.selectAll(".arc")
        .data(pie(data))
        .enter().append("g");

    ga.append("path")
        .attr("d", ageArc)
        .style("fill", function(d) {
            return ageGroupColor(d.data.AGEGROUP);
        })
        .style("stroke", "#FFF")
        .style("stroke-width", 1)
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
        .attr("data-legend", function(d) {
            return d.data.CANCER_TYPE;
        })
        .attr("data-legend-pos", function(d) { return legendItems.indexOf(d.data.CANCER_TYPE)})
        .style("fill", function(d) {
            return cancerTypeColor(d.data.CANCER_TYPE);
        })
        .style("stroke", "#FFF")
        .style("stroke-width", 1);

    // draw age group label arcs
    var gLabels= svg.append("g")
        .attr("id", "gLabels");

    var gl = gLabels.selectAll(".arc")
        .data(pieGroups(ageGroupCount))
        .enter().append("g");

    gl.append("path")
        .attr("d", labelArc)
        .style("fill", function(d) {
            return ageGroupColor(d.data.ageRange);
        })
        .style("stroke", "#FFF")
        .style("stroke-width", 1);

    addAgeCircleAxes();
    addLegend();
});

addAgeCircleAxes = function() {
    var circleAxes, i;

    svg.selectAll('.circle-ticks').remove();

    circleAxes = svg.selectAll('.circle-ticks')
        .data(sdat)
        .enter().append('svg:g')
        .attr("class", "circle-ticks");

    circleAxes.append("path")
        .attr("d", ageAxisArc)
        .style("fill", axisStrokeColor);

    circleAxes.append("svg:text")
        .attr("text-anchor", "center")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .attr("dy", function(d) { return d + 15 })
        .style("fill", "#333")
        .text(function(d,i) { return i * (100/numTicksAge) });
};

addLegend = function() {
    svg.append("g")
        .attr("class","legend")
        .attr("transform","translate(400,225)")
        .style("font-size","12px")
        .call(d3.legend);
};
