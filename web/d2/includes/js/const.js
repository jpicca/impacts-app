// Script to hold variable constants

export const colors = {
    2: '#248B00',
    5: '#8B4726',
    10: '#FDC803',
    15: '#F90201',
    30: '#F724FF',
    45: '#912CEE',
    60: '#104E8B'
}

export const textKey = {
    '#hosp-chart': 'Hospitals',
    '#mob-chart': 'Mobile Homes',
    '#pow-chart': 'Power Substations'
}

export const height = $(window).height();
export const width = $(window).width();

export const nSims = 10000;

// Obviously needs to be improved with variable color scales based on impact type, etc.
// export const fillColor = d3.scaleSequential([0,75], customReds).nice();
export const customReds = d3.scaleLinear().range(["rgb(255,245,240)", "rgb(214,37,34)"])

export const fillColorDict = {
    'pop': {
        'min': d3.scaleSequential([1,100], customReds),
        'ten': d3.scaleSequential([1,1000], customReds),
        'med': d3.scaleSequential([1,10000], customReds),
        'ninety': d3.scaleSequential([1,100000], customReds),
        'max': d3.scaleSequential([1,1000000], customReds)
    },
    'hosp': {
        'min': d3.scaleSequential([1,3], customReds),
        'ten': d3.scaleSequential([1,3], customReds),
        'med': d3.scaleSequential([1,3], customReds),
        'ninety': d3.scaleSequential([1,5], customReds),
        'max': d3.scaleSequential([1,10], customReds)
    },
    'pow': {
        'min': d3.scaleSequential([1,3], customReds),
        'ten': d3.scaleSequential([1,5], customReds),
        'med': d3.scaleSequential([1,10], customReds),
        'ninety': d3.scaleSequential([1,20], customReds),
        'max': d3.scaleSequential([1,50], customReds)
    },
    'mob': {
        'min': d3.scaleSequential([1,100], customReds),
        'ten': d3.scaleSequential([1,100], customReds),
        'med': d3.scaleSequential([1,100], customReds),
        'ninety': d3.scaleSequential([1,500], customReds),
        'max': d3.scaleSequential([1,1000], customReds)
    }
}