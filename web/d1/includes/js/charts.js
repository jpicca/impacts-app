import histChart from './plotBase.js'
import { quantileCalc } from './stats.js'
import { natTableProcess } from './helper.js'

// New file format to read in sims + state/cwa starter info (10/med/90 + climo)
export default d3.json('./includes/data/init/data.json').then(function(impacts) {
    var h = [], m = [], pop = [], pow = [], tor = [];
    let initData = impacts;

    // console.log(initData)

    impacts.sims.forEach(function(entry) {
        pop.push(entry[0])
        h.push(entry[1])
        m.push(entry[2])
        pow.push(entry[3])
        tor.push(entry[4])
    })

    var popChart = new histChart();
    popChart.makeChart(pop, '#pop-chart')

    var hospChart = new histChart();
    hospChart.makeChart(h,'#hosp-chart')

    var mobChart = new histChart();
    mobChart.makeChart(m, '#mob-chart')

    var powChart = new histChart();
    powChart.makeChart(pow, '#pow-chart')

    // Get quantile data for table
    let masterArr = [pop,h,m,pow,tor];

    let statsDict = quantileCalc(masterArr);

    // Add the statsDict to initData so we have the quantiles for the table whenever
    // we have to re-populate the table with national stats
    initData['natQuantiles'] = statsDict;

    // Populate table with national data
    natTableProcess(initData)

    return initData;
    
});