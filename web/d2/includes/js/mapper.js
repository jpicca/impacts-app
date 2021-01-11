// Mapping script

import { colors, width, height, fillColorDict, customReds } from './const.js'
import { interact } from './interactions.js'
import { stateDict } from './helper.js'
import initData from './charts.js'


// Set up which outlook file to use (testing => may 2019 file)
var testing = false;
var outlook;

if (testing) {
    outlook = d3.json('./includes/geo/outlook.geojson');
} else {
    outlook = d3.json('./includes/geo/day1otlk_20200419.geojson');
}

Promise.all([d3.json('./includes/geo/counties-10m-edit.json'),
            outlook,
            d3.json('./includes/geo/cwa.json'),
            initData,
            d3.json('./includes/data/init/ind_tors.json')]).then(function(files) {

    var us = files[0];
    var outlooks = files[1];
    var cwa = files[2];
    var starterData = files[3];
    var natTors = files[4];
    var mapWidthScaler = 1;
    var mapHeightScaler = 1;

    // Check size of window
    if (width >= 992) {
        mapWidthScaler = 2;
    } 

    if (height >= 558) {
        mapHeightScaler = 2;
    } 

    const dims = {
        'width': width,
        'height': height
    };

    var projection = d3.geoAlbersUsa()
        .scale(dims.width/mapWidthScaler)
        .translate([dims.width/(mapWidthScaler*2),dims.height/(mapHeightScaler*2)]);

    var path = d3.geoPath().projection(projection);

    var svg = d3.select('#map-holder')
                .append('svg')
                .attr('height',dims.height/mapHeightScaler)
                .attr('width',dims.width/mapWidthScaler);

    // Zoom testings

    const zoom = d3.zoom()
        .scaleExtent([1,8])
        .on("zoom", zoomed);

    function zoomed(event) {
        const {transform} = event;
        g.attr("transform", transform);
        g.attr("stroke-width", 1 / transform.k);

        statesG.attr("transform", transform);
        statesG.attr("stroke-width", 1 / transform.k);

        warnAreasG.attr("transform", transform);
        warnAreasG.attr("stroke-width", 1 / transform.k);

        torPathHolder.attr("transform", transform);
        torPathHolder.attr("stroke-width", 1 / transform.k);

    }

    function clicked(event, d) {
        const [[x0, y0], [x1, y1]] = path.bounds(d);
        event.stopPropagation();
        //states.transition().style("fill", null);
        //d3.select(this).transition().style("fill", "red");
        svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity
                .translate(width / (2*mapWidthScaler), height / (2*mapHeightScaler))
                .scale(Math.min(7/mapWidthScaler, 0.9 / Math.max((x1 - x0) / (width*mapWidthScaler), 
                    (y1 - y0) / (height*mapHeightScaler))))
                .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
                d3.pointer(event, svg.node())
        );
    }

    // Need to reverse the order of the lat/lon pairs...
    // The way they're processed in python, they're output in reverse order that
    // d3 needs them to properly render the geojsons
    

    // var g = d3.select('svg')
    //     .append('g')
    //     .attr('fill','none');
    var g = svg.append('g').attr('fill','none');

    if (testing) {
        outlooks.features.map(function(arr) {
            return arr.geometry.coordinates[0].reverse()
        })

        g.selectAll('.contours')
            .data(outlooks.features)
            .join('path')
            .attr('d',path)
            .classed('contours',true)
            .attr('stroke-width', 1 )
            .attr('stroke', d => {
                return colors[d.properties.probability];
            })
            .attr('fill', d => {
                return colors[d.properties.probability];
            })
    } else { 
        g.selectAll('.contours')
            .data(outlooks.features)
            .join('path')
            .attr('d',path)
            .classed('contours',true)
            .attr('stroke-width', d => {
                if (d.properties.LABEL != 'SIGN') {
                    return 1;
                } else {
                    return 2;
                }
            } )
            .attr('stroke', d => {
                if (d.properties.LABEL != 'SIGN') {
                    return d.properties.stroke;
                } else {
                    return '#FFFFFF'
                }
            })
            .attr('fill', d => {
                if (d.properties.LABEL != 'SIGN') {
                    return d.properties.fill;
                } 
            })
    }

    let statesG = d3.select('svg')
                    .append('g')

    statesG.selectAll('.st')
            .data(topojson.feature(us,us.objects.states).features)
            .join('path')
            .attr('d',path)
            .on('click.two', clicked )
            .attr('stroke-width',0.3)
            .attr('stroke','#000')
            .attr('fill',d => {
                // .population[0][2] is currently the 90th percentile -- *** make sure to change!! ***
                try {
                    let abbrev = stateDict[d.properties.name]
                    let filtered = starterData.states.filter(entry => entry.state == abbrev)
                    
                    // Grab 0 index of hospitals for array of hospitals impacted
                    // Then grab 2 index to get the median value
                    let testData = filtered[0].hospitals[0][2]

                    if (testData == 0) {
                        return '#fff'
                    }

                    return fillColorDict[$('#prod').val()][$('#perc').val()](testData)
                }
                catch(err) {
                    
                    return '#fff'
                }
            })
            .attr('fill-opacity',0)
            .classed('st',true)
            .attr('id', d => { return stateDict[d.properties.name]})

    let warnAreasG = d3.select('svg')
                    .append('g')

    warnAreasG.selectAll('.cwa')
            .data(topojson.feature(cwa,cwa.objects.cwas).features)
            .join('path')
            .attr('d',path)
            .on('click.two', clicked )
            .attr('stroke-width',0.3)
            .attr('stroke','#000')
            .attr('fill', d => {
                // .population[0][2] is currently the 90th percentile -- *** make sure to change!! ***
                try {
                    let abbrev = d.properties.CWA
                    let filtered = starterData.cwas.filter(entry => entry.cwa == abbrev)
                    
                    let testData = filtered[0].hospitals[0][2]

                    return fillColorDict[$('#prod').val()][$('#perc').val()](testData)
                }
                catch(err) {
                    
                    return '#fff'
                }
            })
            //.attr('fill','#aaa')
            .attr('fill-opacity',0)
            .classed('cwa',true)
            .attr('id', d => d.properties.CWA )
            .attr('data-toggle','tooltip')
            .attr('title', d => d.properties.CWA)

    let svgTitle = d3.select('svg')
            .append('g')

    var torButton = svg.append('g')

    torButton.append('polygon')
            .attr('id','tor-button')
            .attr('points',`${dims.width*.9/mapWidthScaler},${dims.height/(mapHeightScaler*7)} ${dims.width*.87/mapWidthScaler},${dims.height/(mapHeightScaler*15)} ${dims.width*.93/mapWidthScaler},${dims.height/(mapHeightScaler*15)}`)
            .attr('fill','black')
            .attr('opacity',0.3)
            .attr('visibility','hidden');
    

    // Adding tornado paths to chart

    var torPathHolder = svg.append('g').attr('id','tor-path-holder')

    // var torTest = natTors['hospitals']['max']
    var torPaths = {
        'init': [],
        'followup': {}
    }

    Object.keys(natTors).forEach(outerKey => {
        Object.keys(natTors[outerKey]).forEach(innerKey => {
            natTors[outerKey][innerKey].forEach(d => {
                torPaths['init'].push({
                    type: "LineString",
                    coordinates: [
                        [d[0], d[1]],
                        [d[2], d[3]]
                    ],
                    level: 'nat',
                    impact: outerKey,
                    percentile: innerKey,
                    impactCount: d[4]
                });
            })
        })
    })

    torPathHolder.selectAll('.tor-paths')
        .data(torPaths['init'])
        .join('path')
        .attr('d',path)
        .attr("class", d => `${d.percentile} ${d.impact}`)
        .classed('tor-paths nat',true)
        .attr('stroke-width',0.5)
        .attr('stroke','#000')
        .attr('visibility','hidden')
        .attr('data-toggle','tooltip')
        .attr('title', d => d.impactCount)

    svgTitle.append('text')
        .classed('title-text', true)
        .attr('text-anchor','middle')
        .attr('transform',`translate(${dims.width*0.25},40)`)
        .text('SPC Tornado Probabilities')

    let legendG = d3.select('svg')
        .append('g');

    // Legend for contours, etc
    legendG.selectAll('.prob-square')
        .data([2,5,10,15,30,45,60])
        .join('rect')
        .classed('prob-square',true)
        .classed('tor-prob-leg',true)
        .classed('legend',true)
        .attr('width',30)
        .attr('height',20)
        .attr('transform', (d,i) => 
        {
            return `translate(${i*30 + 40},${dims.height/mapHeightScaler - 40})`
        })
        .attr('fill', d => colors[d])
        .attr('stroke','#000')

    legendG.selectAll('.prob-text')
        .data([2,5,10,15,30,45,60])
        .join('text')
        .classed('prob-text', true)
        .classed('tor-prob-leg', true)
        .classed('legend',true)
        .text(d => `${d}%`)
        .attr('transform', (d,i) => 
        {
            return `translate(${i*30 + 40},${dims.height/mapHeightScaler - 40})`
        })
        .attr('fill','#000')
        .attr('font-size','0.6rem')

    legendG.selectAll('.fill-legend')
        .data([...Array(100).keys()])
        .join('rect')
        .classed('fill-legend',true)
        .attr('transform', (d,i) => 
        {
            return `translate(${i*2 + 40},${dims.height/mapHeightScaler - 40})`
        })
        .attr('width',2)
        .attr('height',20)
        .attr('fill', d => d3.scaleSequential([1,100], customReds).nice()(d))
        .attr('visibility','hidden')

    legendG.selectAll('.fill-legend-text')
        .data(fillColorDict[$('#prod').val()][$('#perc').val()].domain())
        .join('text')
        .classed('fill-legend-text', true)
        .classed('fill-legend', true)
        .attr('text-anchor','middle')
        .text(d => d)
        .attr('transform', (d,i) => 
        {
            return `translate(${i*200 + 40},${dims.height/mapHeightScaler - 10})`
        })
        .attr('fill','#000')
        .attr('font-size','0.6rem')
        .attr('visibility','hidden')

    // ** Interactions ** //

    svg.call(zoom);

    var interaction = interact(torPaths,path)

    interaction.highlight(d3.selectAll('.st'))
        .highlight(d3.selectAll('.cwa'))
        .menuChange(d3.select('select#prod'))
        .menuChange(d3.select('select#gran'))
        .menuChange(d3.select('select#st-choice'))
        .menuChange(d3.select('select#c-choice'))
        .menuChange(d3.select('select#perc'))
        .updateThresh(starterData.sims);
        //.tableSelect();
    

})

