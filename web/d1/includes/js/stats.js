export function quantileCalc(sims) {

    let statsDict = {}

    sims.forEach((array,i) => {

        let min = d3.min(array)
        let ten = d3.quantile(array,0.1)
        let med = d3.quantile(array,0.5)
        let ninety = d3.quantile(array, 0.9)
        let max = d3.max(array)

        switch (i) {
            case 0:
                statsDict['pop'] = {
                    'min': min,
                    'ten': ten,
                    'med': med,
                    'ninety': ninety,
                    'max': max
                }
                break;
            case 1:
                statsDict['hosp'] = {
                    'min': min,
                    'ten': ten,
                    'med': med,
                    'ninety': ninety,
                    'max': max
                }
                break;
            case 2:
                statsDict['mob'] = {
                    'min': min,
                    'ten': ten,
                    'med': med,
                    'ninety': ninety,
                    'max': max
                }
                break;
            case 3:
                statsDict['pow'] = {
                    'min': min,
                    'ten': ten,
                    'med': med,
                    'ninety': ninety,
                    'max': max
                }
                break;
            case 4:
                statsDict['tor'] = {
                    'min': min,
                    'ten': ten,
                    'med': med,
                    'ninety': ninety,
                    'max': max
                }
                break;
        }
    })

    return statsDict;

}

export function formatQuantile(dict) {
    
}