// Helper functions

export var stateDict = {};
export var cwaDict = {};

export function natTableProcess(dict,attr='title') {

    let natQuants = dict['natQuantiles']
    let climoQuants = dict['natClimo']

    console.log(natQuants)

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