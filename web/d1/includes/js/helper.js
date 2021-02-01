// Helper functions
import { diffColorDict } from './const.js'

export var stateDict = {};
export var cwaDict = {};

export function tablePopulate(entry,prev,attr='title') {

    const percList = ['min','ten','med','ninety','max'];
    const helperDict = {
        'population': 'pop',
        'hospitals': 'hosp',
        'mobilehomes': 'mob',
        'psubstations': 'pow',
        'tors': 'tor'
    }

    console.log(prev)

    // Check on previous run before try block
    let oldValArr;
    let isOld = true;
    try {
        oldValArr = prev[0]['population']
    } catch(err) {
        console.log('No previous data for this location')
        oldValArr = [0,0,0,0,0]
        isOld = false;
    }

    try {

        Object.keys(entry[0]).forEach(function(key) {


            if (!['state','cwa','national'].includes(key)) {
            //if ((key != 'state') && (key != 'cwa') && (key != 'national')) { 

                let valArr = entry[0][key][0]
                let climoArr = entry[0][key][1]
                
                if (isOld) {oldValArr = prev[0][key][0]}
                
                // try {
                //     oldValArr = prev[0][key][0]
                // } catch(err) {
                //     console.log('No prev data for this selection!')
                // }

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

                    cell.attr(attr,() => {

                        if (climo < 1) {
                            text = 'Tornado-day simulations average fewer than 1 this time of year for this quantile.'
                        } else {
                            text = `This is ${(val/climo).toFixed(1)}x average for tornado-day simulations this time of year.`
                        }

                        return text;
                    })

                    // Calculate and highlight outlook changes in impacts
                    let oldVal = +(oldValArr[i]).toFixed()
                    let diff = val - oldVal

                    // Calculate background color of cell and set it
                    let backCol = diffColorDict[helperDict[key]][e](diff)
                    
                    cell.style('background-color',() => {
                        return backCol;
                    })

                    formatTextCol(cell,backCol)
                    // http://www.w3.org/TR/AERT#color-contrast
                    // Tiny algorithm to determine if text color should be white or black
                    // let brightness = Math.round(((parseInt(d3.rgb(backCol).r) * 299) +
                    // (parseInt(d3.rgb(backCol).g) * 587) +
                    // (parseInt(d3.rgb(backCol).b) * 114)) / 1000);
                    // let textColour = (brightness > 125) ? 'black' : 'white';

                    // cell.style('color', textColour)
                    //console.log(`Perc: ${e}, Impact: ${key} `)
                    
                })

            }

        })

    } catch(err) {

        console.log(err)

        // Set all cells to 0 and set all tooltips to generic text
        // Also return background color to default
        d3.selectAll('.cell.dat')
            .attr('data-original-title','No simulated tornadoes.')
            .style('background-color',diffColorDict['pow']['med'](0))
            .style('color','black')
            .text(0)
            
        // Make sure the tornado background color remains white, though
        d3.selectAll('.cell.ttor')
            .style('background-color','white')

    }

}

function formatTextCol(obj,bCol) {
    // http://www.w3.org/TR/AERT#color-contrast
    // Tiny algorithm to determine if text color should be white or black
    let brightness = Math.round(((parseInt(d3.rgb(bCol).r) * 299) +
    (parseInt(d3.rgb(bCol).g) * 587) +
    (parseInt(d3.rgb(bCol).b) * 114)) / 1000);
    let textColour = (brightness > 125) ? 'black' : 'white';

    obj.style('color', textColour)
}


export function natTableProcess(dict,attr='title') {

    let natQuants = dict['natQuantiles']
    let climoQuants = dict['natClimo']

    //console.log(natQuants)

    Object.keys(natQuants).forEach(function(key) {
        Object.keys(natQuants[key]).forEach(function(innerKey) {

            let cell = d3.select(`.t${key}.${innerKey}`);
            let val = +natQuants[key][innerKey].toFixed()
            cell.text(val)

            // Return if the key is tor since there's no tor climo yet
            if (key == 'tor') { return; };
            cell.attr(attr,() => {

                let climo = +climoQuants[key][innerKey];
                let text;

                if (climo < 1) {
                    text = 'Tornado-day simulations average fewer than 1 this time of year for this quantile.'
                } else {
                    text = `This is ${(val/climo).toFixed(1)}x average for tornado-day simulations this time of year.`
                }

                return text;
            })

        })
    })

}

d3.json('./includes/jsons/states.json').then(function(data) {

    let dropdown = d3.select('#st-choice')

    data.forEach(function(entry) {

        stateDict[entry.name] = entry.abbreviation;
        
        let option = dropdown.append('option')

        option.text(entry.name)
        option.attr('value',entry.abbreviation)

    })

    dropdown.property('value','OK');
})

d3.json('./includes/jsons/cwa.json').then(function(data) {

    let dropdown = d3.select('#c-choice')

    data.forEach(function(entry) {

        cwaDict[entry.name] = entry.abbreviation;
        
        let option = dropdown.append('option')

        option.text(entry.name)
        option.attr('value',entry.abbreviation)

    })

    dropdown.property('value','OUN')
})