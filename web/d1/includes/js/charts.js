import histChart from './plotBase.js'
import { quantileCalc } from './stats.js'
import { natTableProcess, tablePopulate } from './helper.js'


export function quantFormatter(data,quant=0.9,isMob=false) {

    let max_adj = d3.max(data)/10
    let quant_adj = d3.quantile(data,quant)

    if (isMob) {
        if ((max_adj < 251) & (quant_adj < 251)) {
            return data.filter(val => val < 251)
        } else if (max_adj > quant_adj) {
            return data.filter(val => val < max_adj)
        } else {
            return data.filter(val => val < quant_adj)
        }
    }

    if ((max_adj < 10) & (quant_adj < 10)) {
        return data.filter(val => val < 10)
    } else if (max_adj > quant_adj) {
        return data.filter(val => val < max_adj)
    } else {
        return data.filter(val => val < quant_adj)
    }

    // let perc = d3.quantile(data,quant)

    // console.log(perc)

    // if (perc < 10) {
    //     return data
    // } else {
    //     return data.filter(val => val < perc)
    // }

}

export var prevData = d3.json('./includes/data/init/data_prev.json').then(function(impacts) {
    return impacts;
})

// New file format to read in sims + state/cwa starter info (10/med/90 + climo)
export default d3.json('./includes/data/init/data.json').then(function(impacts) {
    var h = [], m = [], pop = [], pow = [], tor = [];
    let initData = impacts;

    //console.log(initData.national)

    impacts.sims.forEach(function(entry) {
        pop.push(entry[0])
        h.push(entry[1])
        m.push(entry[2])
        pow.push(entry[3])
        tor.push(entry[4])
    })

    var popChart = new histChart();
    popChart.makeChart(quantFormatter(pop), '#pop-chart')
    // popChart.makeChart(pop, '#pop-chart')

    var hospChart = new histChart();
    //let hospNine = h.filter(val => val < d3.quantile(h,0.9))
    hospChart.makeChart(quantFormatter(h), '#hosp-chart')
    //hospChart.makeChart(h,'#hosp-chart')

    var mobChart = new histChart();
    mobChart.makeChart(quantFormatter(m), '#mob-chart', true)
    // mobChart.makeChart(m, '#mob-chart')

    var powChart = new histChart();
    //console.log(d3.max(quantFormatter(pow)))
    powChart.makeChart(quantFormatter(pow), '#pow-chart')
    // powChart.makeChart(pow,'#pow-chart')

    // Get quantile data for table
    let masterArr = [pop,h,m,pow,tor];

    let statsDict = quantileCalc(masterArr);

    //console.log(statsDict)

    // Add the statsDict to initData so we have the quantiles for the table whenever
    // we have to re-populate the table with national stats
    initData['natQuantiles'] = statsDict;

    // Populate table with national data
    // natTableProcess(initData)
    Promise.resolve(prevData).then((d) => {
        tablePopulate(initData.national,d.national)

        // Do something with prev data for national numbers

    })

    return initData;
    
});