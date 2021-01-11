import {width, height, textKey, nSims} from './const.js'

var margin = {top: 10, right: 20, bottom: 40, left: 40};


// Generic chart class

class chartBase {
    // Create instance with variables
    constructor() {
      this.width = width //- margin.left - margin.right;
      this.height = height //- margin.top - margin.bottom;
      //this.ylabel = "";
    }
  
}

// Bar chart class to extend generic chart
class histChart extends chartBase {

    // Initialize barchart with same attributes as generic chart
    constructor() { 
        super()
        this.stats = {
            '0.5': '',
            '0.9': ''
        }
    

    this.makeChart = function(data,container,init=true) {

        //d3.select(container).remove('svg')
        if (!init) {
            
            let target = d3.select(container);
            target.select('svg').remove();

        }

        if (this.width >= 992) {
            this.width = this.width/6;
        }

        if (this.height >= 558) {
            this.height = this.height/4;
        } else {
            this.height = this.height/2;
        }

        const svg = d3.select(container).append('svg');
        svg.attr('width',this.width).attr('height',this.height);

        svg.append("g").classed('x-axis',true);
        svg.append("g").classed('y-axis',true);
        svg.append("g").classed('bars',true);
        svg.append("g").classed('stats',true);

        // Make x func for this chart
        var x = this.x(data);

        // Create x axis
        this.xAxis(svg.select('.x-axis'),x);

        // Create array of bins
        var bins = this.bins(data,x);

        // Create y func for this chart
        var y = this.y(bins);

        // Create y axis
        this.yAxis(svg.select('.y-axis'),y);

        // Create histogram bars
        this.bars(svg.select('.bars'),bins,x,y);

        // Update percentiles & add text
        // this.calcs(data);
        // this.statsText(svg.select('.stats'),container)

        // Try to create pop-ups for the rects
        // data-toggle="tooltip" title="Climo goes here">
        d3.selectAll('rect')
            .attr('data-toggle','tooltip')
            .attr('title', d => {
                // If the bar only represents one value, just show that value
                // Otherwise, show the range it represents
                if (d.x1 - d.x0 == 1) { 
                    return `${d.x0}: ${(d.length*100/(nSims)).toFixed(1)}%`;
                } else {
                    return `${d.x0}-${d.x1-1}: ${(d.length*100/(nSims)).toFixed(1)}%`;
                }
            })

        // Have to re-run the tooltip method each time since we blow away the charts with each
        // update
        $('rect').tooltip();

    }

    this.xAxis = function(g,xScale) { 
        g.attr("transform", `translate(0,${this.height - margin.bottom})`)
            .call(d3.axisBottom(xScale).tickFormat(d3.format("~s")))
    }

    this.yAxis = function(g,y) { 
        g.attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(10,".0%"))
    }


    this.xScaleDom = function(data) {
        
        if (d3.max(data) > 10) {
            return [0,d3.max(data)]
        } else {
            return [0,10]
        }
    };

    this.x = function(data) {
        return d3.scaleLinear().domain(this.xScaleDom(data))
                    .range([margin.left, this.width - margin.right])
    }

    this.bins = function(data,x) { 
        return d3.bin()
                .domain(x.domain())
                //.thresholds(10)
                .thresholds(() => {
                    
                    let max = d3.max(data)
                    
                    let limit = 20;

                    if (max <= 10) {
                        return 10;
                    } else if (max <= limit) {
                        return max;
                    } else {
                        return limit;
                    }
                })
                (data)
    }

    this.yScaleDom = function(data) {

        let maxArr = data.map(arr => arr.length)
        let maxDec = d3.max(maxArr)/nSims;


        if (maxDec < 0.5) {
            return [0,maxDec*2]
        } 

        return [0,1];

    }


    this.y = (bins) => d3.scaleLinear()
        //.domain([0,1])
        .domain(this.yScaleDom(bins))
        .range([this.height - margin.bottom, margin.top])

    this.bars = (g,bins,x,y) => g.attr('fill','steelblue')
        .selectAll('rect')
        .data(bins)
        .join('rect')
        .attr('x', d => x(d.x0))
        .attr('width', d => x(d.x1) - x(d.x0))
        .attr('y', d => y(d.length/nSims))
        .attr('height', d => y(0) - y(d.length/nSims));
    }

}


export default histChart;

