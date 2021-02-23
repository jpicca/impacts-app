import initData, { prevData, quantFormatter } from './charts.js';
import { natTableProcess, tablePopulate, stateDict } from './helper.js';
import { fillColorDict } from './const.js'
import histChart from './plotBase.js'

export function interact(torPaths,path,preds) {

    var exports = {};

    exports.vars = {
        'sims':[],
        'selSims':[],
        'states':[],
        'cwas':[],
        'natQuantiles': {},
        'nationals':[]
    }

    exports.prevars = {
        'nationals': [],
        'states': [],
        'cwas': []
    }

    // Load the sims from the initial data file into our exports dict 
    // THis includes individual sim data on national scale
    // and summary stats (quantiles) on states/cwas for map filling
    //Promise.resolve(initData).then(data => {
    Promise.all([initData,prevData]).then(data => {

        let init = data[0]
        let prev = data[1]

        exports.vars.sims = init.sims;
        exports.vars.states = init.states;
        exports.vars.cwas = init.cwas;
        exports.vars.natQuantiles = init.natQuantiles;
        exports.vars.nationals = init.national;

        //console.log(prev)
        exports.prevars.nationals = prev.national;
        exports.prevars.states = prev.states;
        exports.prevars.cwas = prev.cwas;

        //console.log(exports.prevars)
        
    })

    exports.highlight = function(selection) {

        let type = selection.nodes()[0].getAttribute('class')

        selection.on('mouseover', function(e) {

            $(e.currentTarget).attr('stroke-width', 0.6)

        }).on('mouseout', function(e) {
            
            $(e.currentTarget).attr('stroke-width', 0.3)

        }).on('click.one', function(e) {

            // Change selection menu to proper level
            $("select#gran").val(type);
            
            // Get clicked element ID
            let id = $(e.currentTarget).attr("id")
            // this.vars.selected = id;

            d3.select('#prob-dist-title').text(`Tornado Impact Distributions (${id})`)

            // Load new data file for clicked element
            // Load data also runs the threshold div updater and chart updater
            this.loadData(`./includes/data/followup/${id}_data.csv`);
            this.loadPathData(id);

            switch (type) {
                case 'st':
                    
                    // this.vars.level = 'st'

                    // Switch the state menu to clicked state
                    $('#st-choice').val(id)
                    // d3.select('#state-choice').style('visibility','visible')
                    // d3.select('#cwa-choice').style('visibility','hidden') 

                    d3.select('#state-choice').style('display','block')
                    d3.select('#cwa-choice').style('display','none') 

                    d3.select('#cur-val-table').text(`State: ${id}`)

                    // Run the table updater
                    this.updateTable('states')

                    break;

                case 'cwa':

                    // this.vars.level = 'cwa'
                    
                    $('#c-choice').val(id)
                    // d3.select('#state-choice').style('visibility','hidden')
                    // d3.select('#cwa-choice').style('visibility','visible') 

                    d3.select('#state-choice').style('display','none')
                    d3.select('#cwa-choice').style('display','block') 

                    d3.select('#cur-val-table').text(`CWA: ${id}`)

                    // Update hail/wind text
                    this.updatePreds(id)

                    this.updateTable('cwas')

                    break;

                case 'co':
                    // Nothing here for the time being, but if counties are added
                }

        }.bind(this))
        
        return this;    
    }

    // Function to update hail/wind predictions
    exports.updatePreds = function(id) {

        let hailcell = d3.select('#exp-hail')
        let windcell = d3.select('#exp-wind')

        if (preds[id]) {

            let hailcast = preds[id]["hail"]['forecast']
            let windcast = preds[id]["wind"]['forecast']
            let hailclim = preds[id]["hail"]['climo']
            let windclim = preds[id]["wind"]['climo']

            hailcell.text(`Hail: ${hailcast} Reports`)
            windcell.text(`Wind: ${windcast} Reports`)

            hailcell.attr('data-original-title',() => {

                return `This is ${(hailcast/hailclim).toFixed(1)}x normal for hail
                days this time of year.`;
            })

            windcell.attr('data-original-title',() => {

                return `This is ${(windcast/windclim).toFixed(1)}x normal for wind
                days this time of year.`;
            })

        } else {
            hailcell.text('No Predicted Reports and/or CWA/State not included at this time.')
            windcell.text('No Predicted Reports and/or CWA/State not included at this time.')
        }

        
    }

    exports.menuChange = function(selection) {
        selection.on('change', function() {

            let val = selection.node().value

            switch (selection.attr('id')) {

                case 'gran':

                    let isChecked = d3.select('#tordio').property('checked');

                    if (val == 'cwa') {

                        // Update the expected LSR
                        this.updatePreds($('#c-choice').val())

                        // Update the selected var and the table title
                        // this.vars.selected = $('#c-choice').val()
                        d3.select('#cur-val-table').text(`CWA: ${$('#c-choice').val()}`)

                        d3.select('#prob-dist-title')
                            .text(`Probablity Distributions (${$('#c-choice').val()})`)

                        // Load new data file for whatever is the active CWA
                        this.loadData(`./includes/data/followup/${$('#c-choice').val()}_data.csv`);

                        this.loadPathData($('#c-choice').val());

                        // Update the table values
                        this.updateTable('cwas')



                        // Control what menu is shown
                        d3.select('#state-choice').style('display','none')
                        d3.select('#cwa-choice').style('display','block')

                        // Control what map shows
                        if (isChecked) {
                            
                            d3.selectAll('.st')
                                .style('visibility','hidden')

                            d3.selectAll('.cwa')
                                .style('visibility','visible')
                                .attr('fill-opacity',0)

                        } else {

                            d3.selectAll('.cwa')
                                .style('visibility','visible')
                                .attr('fill-opacity',1)

                        }

                    } else if (val == 'st') {

                        // Update the expected LSR
                        this.updatePreds($('#st-choice').val())

                        // Update the selected var and the table title
                        // this.vars.selected = $('#st-choice').val()
                        d3.select('#cur-val-table').text(`State: ${$('#st-choice').val()}`)

                        d3.select('#prob-dist-title')
                            .text(`Probablity Distributions (${$('#st-choice').val()})`)

                        // Load new data file for current state
                        this.loadData(`./includes/data/followup/${$('#st-choice').val()}_data.csv`);

                        this.loadPathData($('#st-choice').val());

                        // Update the table values
                        this.updateTable('states')

                        // Control what menu is shown
                        d3.select('#state-choice').style('display','block')
                        d3.select('#cwa-choice').style('display','none')

                        // Control what is shown on map
                        d3.selectAll('.cwa')
                            .style('visibility','hidden')

                        if (isChecked) {

                            d3.selectAll('.st')
                                .style('visibility','visible')
                                .attr('fill-opacity',0)

                        } else {

                            d3.selectAll('.st')
                                .style('visibility','visible')
                                .attr('fill-opacity',1)

                        }

                    } else {

                        // Update the expected LSR
                        this.updatePreds('nat')

                        //this.updateTable('national')
                        this.updateTable('nationals')

                        // this.vars.selected = val;
                        d3.select('#cur-val-table').text(`National`)

                        d3.select('#prob-dist-title')
                            .text(`Probablity Distributions (National)`)

                        // Update thresh with nat sims
                        this.updateThresh(this.vars.sims);

                        // Update charts
                        this.loadData(null,true);

                        this.loadPathData('nat');

                        // Control what menu is shown
                        d3.select('#state-choice').style('display','none')
                        d3.select('#cwa-choice').style('display','none')

                        // Control what is shown on map
                        d3.selectAll(`.cwa`)
                            .style('visibility','hidden')


                        if (isChecked) {
                            d3.selectAll('.st')
                                .attr('fill-opacity',0)
                                .style('visibility','visible')
                        } else {
                            d3.selectAll('.st')
                                .attr('fill-opacity',1)
                                .style('visibility','visible')
                        }
                        
                    }

                    break;

                case 'st-choice':

                    // Update the expected LSR
                    this.updatePreds($('#st-choice').val())

                    // this.vars.selected = val;
                    d3.select('#cur-val-table').text(`State: ${val}`)

                    // Load new data file for updated menu
                    this.loadData(`./includes/data/followup/${val}_data.csv`);

                    this.loadPathData(val);

                    // Update table
                    this.updateTable('states')
                    
                    break;

                case 'c-choice':

                    // Update the expected LSR
                    this.updatePreds($('#c-choice').val())

                    // this.vars.selected = val;
                    d3.select('#cur-val-table').text(`CWA: ${val}`)

                    // Load new data file for updated menu
                    this.loadData(`./includes/data/followup/${val}_data.csv`);

                    this.loadPathData(val);

                    // Update table
                    this.updateTable('cwas')

                    break;

                case 'prod':

                    // Update context jumbo
                    if ($('select#gran').val() == 'nat') {
                        this.updateThresh(this.vars.sims);
                    } else {
                        this.updateThresh(this.vars.selSims)
                    }

                    // Update map
                    this.updateMap()

                    console.log('Product updated!')

                    this.updateProduct(val);

                    if (tracksOn) { trackChanger(true) }

                    break;

                case 'perc':

                    this.updateMap()

                    if (tracksOn) { trackChanger(true) }

                    console.log('Perc updated!')

                    
            }

            // console.log(this.vars)

        }.bind(this))

        return this;
    }

    // Use this function to update map fill when the impact or percentile is changed
    exports.updateMap = function() {

        const helper = {
            'hosp':'hospitals',
            'pop':'population',
            'mob':'mobilehomes',
            'pow':'psubstations'
        }

        const indexer = {
            'min': 0,
            'ten': 1,
            'med': 2,
            'ninety': 3,
            'max': 4
        } 

        //if (type == 'impact') {
        d3.selectAll('.st')
            .attr('fill', function(d) {
                // .population[0][2] is currently the 90th percentile -- *** make sure to change!! ***
                try {
                    let abbrev = stateDict[d.properties.name]
                    let filtered = exports.vars.states.filter(function(entry) {
                        return entry.state == abbrev
                    })
                    
                    // Get the proper value
                    let testData = filtered[0][helper[$('#prod').val()]][0][indexer[$('#perc').val()]]
                    
                    if (testData == 0) { return '#fff' }
                    
                    return fillColorDict[$('#prod').val()][$('#perc').val()](testData)
                }
                // If there's no entry for that state
                catch(err) {
                    
                    return '#fff'
                }
            })

        d3.selectAll('.cwa')
            .attr('fill', function(d) {
                // .population[0][2] is currently the 90th percentile -- *** make sure to change!! ***
                try {
                    let abbrev = d.properties.CWA
                
                    let filtered = exports.vars.cwas.filter(function(entry) {
                        return entry.cwa == abbrev
                    })
                    
                    
                    // Get the proper value
                    let testData = filtered[0][helper[$('#prod').val()]][0][indexer[$('#perc').val()]]
                    
                    if (testData == 0) { return '#fff' }
                    
                    return fillColorDict[$('#prod').val()][$('#perc').val()](testData)
                }
                // If there's no entry for that CWA
                catch(err) {
                    return '#fff'
                }
            })

        // Update the legend text
        d3.selectAll('.fill-legend-text')
            .data(fillColorDict[$('#prod').val()][$('#perc').val()].domain())
            //.data(rangeHelper[$('#prod').val()])
            .text(d => d);

        // Update title
        if (d3.select('#impadio').property('checked')) {
            updateTitle();
        }
    }

    // Method to load tor path data for display
    exports.loadPathData = function(loc) {
        
        d3.selectAll('.tor-paths').remove()
        tracksOn = false;

        let torPathHolder = d3.select('#tor-path-holder')
        
        if (loc == 'nat') {

            torPathHolder.selectAll('.tor-paths')
                .data(torPaths['init'])
                .join('path')
                .attr('d',path)
                .attr("class", d => `${d.percentile} ${d.impact}`)
                .classed(`tor-paths ${loc}`,true)
                .attr('stroke-linecap','round')
                .attr('stroke-width',0.5)
                .attr('stroke','#000')
                .attr('visibility','hidden')
                .attr('data-toggle','tooltip')
                .attr('title', d => d.impactCount)

            $('.tor-paths').tooltip();

        } else {

            // New state/cwa tor path loader
            if (!Object.keys(torPaths['followup']).includes(loc)) {
                d3.json(`./includes/data/followup/${loc}_ind_tors.json`)
                    .then((data) => {

                        torPaths['followup'][loc] = []

                        Object.keys(data).forEach(outerKey => {
                            Object.keys(data[outerKey]).forEach(innerKey => {
                                data[outerKey][innerKey].forEach(d => {
                                    torPaths['followup'][loc].push({
                                        type: "LineString",
                                        coordinates: [
                                            [d[0], d[1]],
                                            [d[2], d[3]]
                                        ],
                                        level: loc,
                                        impact: outerKey,
                                        percentile: innerKey,
                                        impactCount: d[4]
                                    });
                                })
                            })
                        })

                        torPathHolder.selectAll('.tor-paths')
                            .data(torPaths['followup'][loc])
                            .join('path')
                            .attr('d',path)
                            .attr("class", d => `${d.percentile} ${d.impact}`)
                            .classed(`tor-paths ${loc}`,true)
                            .attr('stroke-linecap','round')
                            .attr('stroke-width',0.5)
                            .attr('stroke','#000')
                            .attr('visibility','hidden')
                            .attr('data-toggle','tooltip')
                            .attr('title', d => d.impactCount)

                        $('.tor-paths').tooltip();

                    })
                    .catch(err => { console.log(err)})
            } else {

                torPathHolder.selectAll('.tor-paths')
                    .data(torPaths['followup'][loc])
                    .join('path')
                    .attr('d',path)
                    .attr("class", d => `${d.percentile} ${d.impact}`)
                    .classed(`tor-paths ${loc}`,true)
                    .attr('stroke-linecap','round')
                    .attr('stroke-width',0.5)
                    .attr('stroke','#000')
                    .attr('visibility','hidden')
                    .attr('data-toggle','tooltip')
                    .attr('title', d => d.impactCount)

                $('.tor-paths').tooltip();

            }
        }
        
    }

    exports.loadData = function(file=null,nat=false) {

        let containers = d3.selectAll('.chart');
        containers.select('h4').remove();

        if (nat) {

            var h = [], m = [], pop = [], pow = [];

            this.updateThresh(this.vars.sims);

            this.vars.sims.forEach(function(entry) {
                pop.push(entry[0])
                h.push(entry[1])
                m.push(entry[2])
                pow.push(entry[3])
            })

            var popChart = new histChart();
            var hospChart = new histChart();
            var mobChart = new histChart();
            var powChart = new histChart();

            if (this.vars.sims.length) {

                popChart.makeChart(quantFormatter(pop), '#pop-chart')
                
                //let hospNine = h.filter(val => val < d3.quantile(h,0.9))
                hospChart.makeChart(quantFormatter(h), '#hosp-chart')
                
                mobChart.makeChart(quantFormatter(m), '#mob-chart', true)

                //console.log(d3.max(quantFormatter(pow)))
                powChart.makeChart(quantFormatter(pow), '#pow-chart')
            
            } else {

                console.log('There are no simulated tors')

                // Remove svg if it exists and add a banner about no tornadoes
                //let containers = d3.selectAll('.chart');
                containers.select('svg').remove();
                containers.append('h4').text('No simulated tornadoes')
            }   

            // var newPop = new histChart();
            // //newPop.makeChart(pop,'#pop-chart',false);
            // newPop.makeChart(quantFormatter(pop),'#pop-chart',false);

            // var newHosp = new histChart();
            // newHosp.makeChart(quantFormatter(h),'#hosp-chart',false);

            // var newMob = new histChart();
            // newMob.makeChart(quantFormatter(m,0.9,true),'#mob-chart',false);

            // var newPow = new histChart();
            // //newPow.makeChart(pow,'#pow-chart',false);
            // newPow.makeChart(quantFormatter(pow),'#pow-chart',false);

            return;

        }

        d3.csv(file).then(function(data) {

            var h = [], m = [], pop = [], pow = [], simArr = [], simsArr = [];

            // Process data
            data.forEach(function(entry) {
                h.push(+entry.hospitals)
                m.push(+entry.mobilehomes)
                pop.push(+entry.population)
                pow.push(+entry.psubstations)

                simArr = [+entry.population,+entry.hospitals,+entry.mobilehomes,+entry.psubstations];
                simsArr.push(simArr);

            })

            // Add our simsArr to the exports vars
            this.vars.selSims = simsArr;

            this.updateThresh(this.vars.selSims);

            var newPop = new histChart();
            // newPop.makeChart(pop,'#pop-chart',false);
            newPop.makeChart(quantFormatter(pop),'#pop-chart',false);
            
            var newHosp = new histChart();
            newHosp.makeChart(quantFormatter(h),'#hosp-chart',false);

            var newMob = new histChart();
            //newMob.makeChart(m,'#mob-chart',false);
            newMob.makeChart(quantFormatter(m,0.9,true),'#mob-chart',false);

            var newPow = new histChart();
            //newPow.makeChart(pow,'#pow-chart',false);
            newPow.makeChart(quantFormatter(pow),'#pow-chart',false);

        }.bind(this)).catch(function(err) {
            console.log('No file!')

            // Remove svg if it exists and add a banner about no tornadoes
            containers.select('svg').remove();
            containers.append('h4').text('No simulated tornadoes')

            d3.select('#context-jumbo').text('No simulated tornadoes')

            this.vars.selSims = [];

        }.bind(this))

    }

    exports.updateThresh = function(data) {

        if (!data.length) { 

            d3.select('#context-jumbo').text('No simulated tornadoes');

            return;

        }

        let thresh = +$('#thresh').val()
        
        const arrayMapper = {
            'pop': [0,'people'],
            'hosp': [1,'hospital(s)'],
            'mob': [2,'mobile home(s)'],
            'pow': [3,'power substation(s)']
        }

        let arrayIdx = arrayMapper[$('#prod').val()][0]

        // console.log(arrayIdx)

        let count = data.filter(function(entry) { return entry[arrayIdx] >= thresh }).length

        // Update text on page
        d3.select('#context-jumbo')
            .text(`At least ${thresh} ${arrayMapper[$('#prod').val()][1]} were exposed to a tornado in 
            ${count} of 10k simulations (${(count/100).toFixed(1)} %)`)
            //.text(`${count} of 10k simulations (${(count/100).toFixed(1)} %) impacted at least
            //${thresh} ${arrayMapper[$('#prod').val()][1]}.`)

        return this;
    }

    const helperDict = {
        'population': 'pop',
        'hospitals': 'hosp',
        'mobilehomes': 'mob',
        'psubstations': 'pow',
        'tors': 'tor'
    }

    const invHelperDict = {
        'pop': 'population',
        'hosp':'hospitals',
        'mob':'mobilehomes',
        'pow':'psubstations',
        'tor':'tors'
    }

    var tracksOn = false;

    // Use this function to update table when an area is selected via a map click or menu change
    exports.updateTable = function(level) {

        let region;

        if (level == 'states') {
            region = $('#st-choice').val() 
        } else if (level == 'cwas') {
            region = $('#c-choice').val() 
        } else if (level == 'nationals') { 
            region = 'national'
        } else {
            // console.log('National!')
            Promise.resolve(initData).then(data => natTableProcess(data,'data-original-title'))
            
            return;
        }

        //console.log(`This is updateTable: ${region}`)

        //const percList = ['min','ten','med','ninety','max'];

        // Get data from var holder
        let filtered;
        let filt_prev;

        // Check if there are any current data for this selection
        try {
            filtered = this.vars[level].filter(function(entry) {return entry[`${level.slice(0,-1)}`] == region })
        } catch(err) { 
        //console.log(filt_prev)
            filtered = null;
        }

        // Check if there are any previous data for this selection
        try {
            filt_prev = this.prevars[level].filter(function(entry) {return entry[`${level.slice(0,-1)}`] == region })
        } catch(err) {
            filt_prev = null;
        }

        tablePopulate(filtered,filt_prev,'data-original-title')

        /*
        try {

            Object.keys(filtered[0]).forEach(function(key) {

                if (!['state','cwa','national'].includes(key)) {
                //if ((key != 'state') && (key != 'cwa') && (key != 'national')) { 

                    let valArr = filtered[0][key][0]
                    let climoArr = filtered[0][key][1]

                    percList.forEach(function(e,i) {

                        // Update cell value
                        let cell = d3.select(`.t${helperDict[key]}.${e}`);
                        let val = +(valArr[i]).toFixed()
                        cell.text(val)

                        // ** Need to skip tor keys since they don't have climo currently **
                        if (key == 'tors') { return; };

                        // Update cell climo info
                        let climo = +climoArr[i]
                        let text;

                        cell.attr('data-original-title',() => {

                            if (climo < 1) {
                                text = 'Tornado-day simulations average fewer than 1 this time of year for this quantile.'
                            } else {
                                text = `This is ${(val/climo).toFixed(1)}x average for tornado-day simulations this time of year.`
                            }

                            // if (climo == 0) { 
                            //     text = 'Climo: 0'
                            // } else {
                            //     text = `Climo: ${climo.toFixed()} // Today's value is ${(val/climo).toFixed(1)}x normal for this date.`
                            // }

                            return text;
                        })
                        //console.log(`Perc: ${e}, Impact: ${key} `)
                        
                    })

                }

                
                // let val = +statsDict[key][innerKey].toFixed()

                // cell.text(val)
                // cell.attr('title',() => {

                //     let climo = +initData['natClimo'][key][innerKey];
                //     let text;
                //     if (climo == 0) { 
                //         text = 'Climo: 0'
                //     } else {
                //         text = `Climo: ${climo.toFixed()} // Today's value is ${(val/climo).toFixed(1)}x normal for this date.`
                //     }

                //     return text;
                // })
            })

        } catch(err) {

            console.log(err)

            // Set all cells to 0 and set all tooltips to generic text
            d3.selectAll('.cell.dat')
                .attr('data-original-title','No simulated tornadoes.')
                .text(0)
    

        }*/
        
    }

    exports.updateProduct = function(val) {

        // If showing impact map, update legend appropriately
        if ($('input[name="tordio"]:checked').val() == 'imp') {
            // Hide all legends
            d3.selectAll('.legend')
                .attr('visibility','hidden');

            // Show appropriate legend
            d3.selectAll(`.fill-legend`)
                .attr('visibility','visible');

        }

        //d3.selectAll('.cell')
        //    .style('background-color', '#fff')

        // Hide contours
        // d3.selectAll('.contours')
        //     .attr('visibility','hidden')

        // Highlight appropriate column
        //d3.selectAll(`.t${val}`)
        //    .style('background-color','rgba(187, 181, 181, 0.3)')

    }

    // Highlight tornadoes
    d3.select('#tor-button')
        .on('mouseover',function(e) {
            
            d3.select(e.currentTarget).attr('opacity',0.7)

        })
        .on('mouseout',function(e) {

            d3.select(e.currentTarget).attr('opacity',0.3)

        })
        .on('click', () => {trackChanger(false)});

    function trackChanger(menuChange=false) {

        // If it's a menu change forcing the track change
        if (menuChange) {

            // Temporarily turn off tracks
            tracksOn = false;
            d3.selectAll('path.tor-paths').attr('visibility','hidden')

        }

        let perc = $('#perc').val()
        let prod = $('#prod').val()

        if (!tracksOn) {
            
            d3.selectAll(`path.${perc}.${invHelperDict[prod]}`)
                .attr('visibility','visible')

            // d3.select(e.currentTarget).attr('opacity',0.7)

            tracksOn = true;
        } else {

            d3.selectAll(`path.${perc}.${invHelperDict[prod]}`)
                    .attr('visibility','hidden')

            //d3.select(e.currentTarget).attr('opacity',0.3)

            tracksOn = false;
        }

    }

    // Random helpers
    $('#thresh-update').on('click', function() {
        if ($('select#gran').val() == 'nat') {
            this.updateThresh(this.vars.sims);
        } else {
            this.updateThresh(this.vars.selSims);
        }
    }.bind(exports))

    function updateTitle() {
        let title = d3.select('.title-text')
                        
        let text = `${$('#prod option:selected').text()}: ${$('#perc option:selected').text()}`

        title.text(text)
    }

    $('input[name="tordio"]').on('change', function() {

        // Show contours
        d3.selectAll('.contours')
            .attr('opacity',1)

        let showing = $('select#gran').val();

        // Hide all legends
        // d3.selectAll('.legend').attr('visibility','hidden');

        if (d3.select('#tordio').property('checked')) { 

            // Update title
            d3.select('.title-text').text('SPC Tornado Probabilities')

            // Show tor prob legend
            d3.selectAll('.tor-prob-leg').attr('visibility','visible');
            d3.selectAll('.fill-legend').attr('visibility','hidden');

            if (showing == 'nat' || showing == 'st') { 
                d3.selectAll(`.cwa`)
                    .style('visibility','hidden')

                d3.selectAll(`.st`)
                    .style('visibility','visible')
                    .attr('fill-opacity',0)
            } else {
                d3.selectAll(`.cwa`)
                    .style('visibility','visible')
                    .attr('fill-opacity',0)

                d3.selectAll(`.st`)
                    .style('visibility','hidden')
            }

            d3.selectAll('.legend').attr('visibility','visible')

            // Hide percentile select

            d3.select('#map-fill').style('display','none')

            d3.select('#tor-button').attr('visibility','hidden');
            d3.selectAll('.tor-paths').attr('visibility','hidden');

            tracksOn = false;

        } else {

            // Hide contours
            d3.selectAll('.contours')
                .attr('opacity',0)

            // Update title
            updateTitle();

            d3.selectAll('.fill-legend').attr('visibility','visible');
            d3.selectAll('.tor-prob-leg').attr('visibility','hidden');
            
            if (showing == 'nat' || showing == 'st') { 
                
                d3.selectAll('.st')
                    .attr('fill-opacity',1)
                    .style('visibility','visible')
            } else { 
                d3.selectAll('.cwa')
                    .attr('fill-opacity',1) 
                    .style('visibility','visible')
            }

            // Show percentile select
            d3.select('#map-fill').style('display','block')

            // Show appropriate legend
            d3.selectAll(`.${$('#prod').val()}-leg`).attr('visibility','visible');

            // Highlight appropriate percentile row
            // d3.selectAll(`.${$('#perc').val()}`)
            //     .style('background-color','rgba(187, 181, 181, 0.3)')

            d3.select('#tor-button').attr('visibility','visible');
            
        }
    })

    // Enable tooltips
    $(function () {
        $('[data-toggle="tooltip"]').tooltip()
    })


    return exports;

}