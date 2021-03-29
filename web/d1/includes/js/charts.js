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
        return data.filter(val => val < quant_adj - 1)
    }

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

    //console.log(impacts)

    var popChart = new histChart();
    var hospChart = new histChart();
    var mobChart = new histChart();
    var powChart = new histChart();

    if (impacts.sims.length) {

        popChart.makeChart(quantFormatter(pop), '#pop-chart')
        // popChart.makeChart(pop, '#pop-chart')

        
        //let hospNine = h.filter(val => val < d3.quantile(h,0.9))
        hospChart.makeChart(quantFormatter(h), '#hosp-chart')
        //hospChart.makeChart(h,'#hosp-chart')

        
        mobChart.makeChart(quantFormatter(m), '#mob-chart', true)
        // mobChart.makeChart(m, '#mob-chart')

        
        //console.log(d3.max(quantFormatter(pow)))
        powChart.makeChart(quantFormatter(pow), '#pow-chart')
        // powChart.makeChart(pow,'#pow-chart')
    
    } else {

        console.log('There are no simulated tors')

        // Remove svg if it exists and add a banner about no tornadoes
        let containers = d3.selectAll('.chart');
        containers.select('svg').remove();
        containers.append('h4').text('No simulated tornadoes')
    }

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
    
})