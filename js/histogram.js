class Histogram {
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            colorScale: d3.scaleOrdinal(["#4fade0", "#e47b41"]),
            containerWidth: _config.containerWidth || 700,
            containerHeight: _config.containerHeight || 400,
            margin: _config.margin || {
                top: 50,
                right: 50,
                bottom: 30,
                left: 40
            },
            tooltipPadding: _config.tooltipPadding || 50
        };
        this.data = _data;
        this.selectedPoints = new Set();

        this.selectedData1 = "percent_poverty";
        this.selectedData2 = "percent_high_blood_pressure";

        this.selectedBins = new Set();

        this.initVis();
    }

    initVis() {
        let vis = this;

        

        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // Create Scales
        vis.xScale = d3.scaleLinear().range([0, vis.width]).domain([0, 100]);
        vis.yScale = d3.scaleLinear().range([vis.height, 0]);

        // Axes
        vis.xAxis = d3.axisBottom(vis.xScale).ticks(10).tickFormat(d => d + "%");
        vis.yAxis = d3.axisLeft(vis.yScale).ticks(10);

        vis.svg = d3.select(vis.config.parentElement)
            .attr("width", vis.config.containerWidth)
            .attr("height", vis.config.containerHeight);

        vis.chart = vis.svg.append("g")
            .attr("transform", `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        vis.xAxisG = vis.chart.append("g")
            .attr("class", "axis x-axis")
            .attr("transform", `translate(0,${vis.height})`);

        vis.yAxisG = vis.chart.append("g").attr("class", "axis y-axis");

        vis.legend = vis.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${vis.width + vis.config.margin.left - 200}, ${vis.config.margin.top + 100})`);

        vis.legend.append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", vis.config.colorScale(0));

        vis.legend.append("text")
            .attr("class", "legend-text1")
            .attr("x", 25)
            .attr("y", 12)
            .text(vis.selectedData1.replace(/_/g, " "))
            .attr("font-size", "14px")
            .attr("alignment-baseline", "middle");

        vis.legend.append("rect")
            .attr("y", 25)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", vis.config.colorScale(1));

        vis.legend.append("text")
            .attr("class", "legend-text2")
            .attr("x", 25)
            .attr("y", 37)
            .text(vis.selectedData2.replace(/_/g, " "))
            .attr("font-size", "14px")
            .attr("alignment-baseline", "middle");

        // Listen for clicks outside bars to reset selection
        vis.svg.on("click", () => {
            vis.selectedBins.clear();
            vis.updateHighlighting();
            updateOtherVisualizations([]);
        });

        vis.brush = d3.brushX()
    .extent([[0, 0], [vis.width, vis.height]])
    .on("brush end", brushed);

vis.chart.append("g")
    .attr("class", "brush")
    .call(vis.brush);

        vis.chart.append("text")
        .attr("class", "axis-title x-axis-label")
        .attr("x", vis.width / 2)
        .attr("y", vis.height + 30) // Keep this above the bottom margin
        .attr("text-anchor", "middle")
        .text("Percentage");
    
    // Y-axis label
    vis.chart.append("text")
        .attr("class", "axis-title y-axis-label")
        .attr("x", -vis.height / 2)
        .attr("y", -35)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .text("Count");
        vis.updateVis();

        function brushed(event) {
            if (!event.selection) {
                vis.selectedBins.clear();
                selectedBins.clear();
                vis.updateHighlighting();
                updateOtherVisualizations();
                return;
            }
        
            const [x0, x1] = event.selection.map(vis.xScale.invert);
        
            vis.selectedBins.clear();
        
            vis.aggregatedData.forEach(bin => {
                // Select bins that intersect the brush range
                if (bin.x1 > x0 && bin.x0 < x1) {
                    vis.selectedBins.add(bin.x0); // use .x0 like in clicks
                }
            });
        
            selectedBins = new Set([...vis.selectedBins]);
            vis.updateHighlighting();
            updateOtherVisualizations();
        }
    }

    updateVis(filteredData = null) {
        let vis = this;

        vis.legend.select(".legend-text1")
            .text(vis.selectedData1.replace(/_/g, " "));

        vis.legend.select(".legend-text2")
            .text(vis.selectedData2.replace(/_/g, " "));

        // Preserve the original dataset for resetting
        vis.displayData = filteredData ? filteredData : vis.data;

        const data1 = vis.displayData.map(d => d[vis.selectedData1]);
        const data2 = vis.displayData.map(d => d[vis.selectedData2]);

        const histogram = d3.histogram().domain([0, 100]).thresholds(20);
        const bins1 = histogram(data1);
        const bins2 = histogram(data2);

        vis.aggregatedData = bins1.map((bin, i) => ({
            x0: bin.x0,
            x1: bin.x1,
            count1: bin.length,
            count2: bins2[i] ? bins2[i].length : 0
        }));

        vis.yScale.domain([0, d3.max(vis.aggregatedData, d => Math.max(d.count1, d.count2))]);

        vis.renderVis();
    }



    renderVis() {
        let vis = this;

        let tooltip = d3.select("body").select("#tooltip");
        if (tooltip.empty()) {
            tooltip = d3.select("body")
                .append("div")
                .attr("id", "tooltip")
                .style("position", "absolute")
                .style("background", "white")
                .style("border", "1px solid #ccc")
                .style("padding", "8px")
                .style("border-radius", "4px")
                .style("display", "none")
                .style("pointer-events", "none");
        }

        function handleBarClick(event, d) {
            event.stopPropagation();
        
            if (vis.selectedBins.has(d.x0)) {
                vis.selectedBins.delete(d.x0);
            } else {
                vis.selectedBins.add(d.x0);
            }
        
            selectedBins = new Set([...vis.selectedBins]); // ← ADD THIS
            vis.updateHighlighting();
            updateOtherVisualizations();
        }
        

        const bars1 = vis.chart.selectAll(".bar1")
            .data(vis.aggregatedData)
            .join("rect")
            .attr("class", "bar1")
            .attr("x", d => vis.xScale(d.x0))
            .attr("width", d => vis.xScale(d.x1) - vis.xScale(d.x0) - 1)
            .attr("y", d => vis.yScale(d.count1))
            .attr("height", d => vis.height - vis.yScale(d.count1))
            .attr("fill", d => vis.selectedBins.size === 0 || vis.selectedBins.has(d.x0) ? vis.config.colorScale(0) : "#ccc")
            .attr("opacity", d => vis.selectedBins.size === 0 || vis.selectedBins.has(d.x0) ? 0.8 : 0.2)
            .on("click", handleBarClick)
            .on("mouseover", (event, d) => {
                tooltip.style("display", "block")
                    .html(`<strong>Range:</strong> ${d.x0} - ${d.x1}%<br><strong>Count 1:</strong> ${d.count1}`);
            })
            .on("mousemove", event => {
                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px");
            })
            .on("mouseleave", () => {
                tooltip.style("display", "none");
            });

        const bars2 = vis.chart.selectAll(".bar2")
            .data(vis.aggregatedData)
            .join("rect")
            .attr("class", "bar2")
            .attr("x", d => vis.xScale(d.x0) + 5)
            .attr("width", d => vis.xScale(d.x1) - vis.xScale(d.x0) - 1)
            .attr("y", d => vis.yScale(d.count2))
            .attr("height", d => vis.height - vis.yScale(d.count2))
            .attr("fill", d => vis.selectedBins.size === 0 || vis.selectedBins.has(d.x0) ? vis.config.colorScale(1) : "#ccc")
            .attr("opacity", d => vis.selectedBins.size === 0 || vis.selectedBins.has(d.x0) ? 0.8 : 0.2)
            .on("click", handleBarClick)
            .on("mouseover", (event, d) => {
                tooltip.style("display", "block")
                    .html(`<strong>Range:</strong> ${d.x0} - ${d.x1}%<br><strong>Count:</strong> ${d.count2}`);
            })
            .on("mousemove", event => {
                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px");
            })
            .on("mouseleave", () => {
                tooltip.style("display", "none");
            });

        vis.xAxisG.call(vis.xAxis);
        vis.yAxisG.call(vis.yAxis);
    }

    updateHighlighting() {
        let vis = this;

        vis.chart.selectAll(".bar1")
            .attr("fill", d => vis.selectedBins.size === 0 || vis.selectedBins.has(d.x0) ? vis.config.colorScale(0) : "#ccc")
            .attr("opacity", d => vis.selectedBins.size === 0 || vis.selectedBins.has(d.x0) ? 0.8 : 0.2);

        vis.chart.selectAll(".bar2")
            .attr("fill", d => vis.selectedBins.size === 0 || vis.selectedBins.has(d.x0) ? vis.config.colorScale(1) : "#ccc")
            .attr("opacity", d => vis.selectedBins.size === 0 || vis.selectedBins.has(d.x0) ? 0.8 : 0.2);
    }
}



function updateOtherVisualizations() {
    let filteredData = data;

    if (selectedBins.size > 0) {
        filteredData = filteredData.filter(d =>
            [...selectedBins].some(binStart =>
                d.percent_poverty >= binStart && d.percent_poverty < binStart + 5
            )
        );
    }

    if (selectedFips.size > 0) {
        filteredData = filteredData.filter(d => selectedFips.has(d.fips));
    }

    scatterplot.updateVis(filteredData);
    choroplethMap.updateVis(filteredData.length ? filteredData : null);
}