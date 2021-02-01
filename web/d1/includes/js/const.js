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

const divergeMap = d3.interpolateRdBu

// Note that the input domains are flipped since the d3 color map goes from red to blue
export const diffColorDict = {
    'pop': {
        'min': d3.scaleSequential([50,-50], divergeMap),
        'ten': d3.scaleSequential([1000,-1000], divergeMap),
        'med': d3.scaleSequential([10000,-10000], divergeMap),
        'ninety': d3.scaleSequential([100000,-100000], divergeMap),
        'max': d3.scaleSequential([1000000,-1000000], divergeMap)
    },
    'hosp': {
        'min': d3.scaleSequential([1,-1], divergeMap),
        'ten': d3.scaleSequential([2,-2], divergeMap),
        'med': d3.scaleSequential([2,-2], divergeMap),
        'ninety': d3.scaleSequential([3,-3], divergeMap),
        'max': d3.scaleSequential([10,-10], divergeMap)
    },
    'pow': {
        'min': d3.scaleSequential([1,-1], divergeMap),
        'ten': d3.scaleSequential([2,-2], divergeMap),
        'med': d3.scaleSequential([2,-2], divergeMap),
        'ninety': d3.scaleSequential([5,-5], divergeMap),
        'max': d3.scaleSequential([50,-50], divergeMap)
    },
    'mob': {
        'min': d3.scaleSequential([25,-25], divergeMap),
        'ten': d3.scaleSequential([50,-50], divergeMap),
        'med': d3.scaleSequential([100,-100], divergeMap),
        'ninety': d3.scaleSequential([500,-500], divergeMap),
        'max': d3.scaleSequential([5000,-5000], divergeMap)
    }
}

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