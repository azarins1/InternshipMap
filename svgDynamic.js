const container = document.getElementById("map-container");
const svgWidth = container.clientWidth - 0;
const svgHeight = container.clientHeight - 0;

import { states } from './state_names.js';
console.log(states)

const svg = d3.select("#map-container")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

// Create a tooltip
var tooltip = d3.select("#map-container")
    .append("div")
    .style("position", "absolute")
    .attr('class', 'tooltip')
    .style("visibility", "hidden")
    .text("HELLO");

d3.json('2010_us_census.json').then(unitedStates => {
    // Map projection, pathGenerator, and svg append generated with ChatGPT
    const projection = d3.geoAlbersUsa()
        .fitSize([svgWidth, svgHeight], unitedStates);

    const pathGenerator = d3.geoPath()
        .projection(projection);

    svg.append("g")
        .selectAll("path")
        .data(unitedStates.features)
        .enter()
        .append("path")
        .attr('id', d => d.properties.NAME)
        .attr("class", "state")
        .attr("d", pathGenerator);

    // Draw and Parse the cities
    let stateStats = {};
    d3.json('internship_data.json').then(internship_data => {
        const data = internship_data.cities;
        for (let i = 0; i < data.length; i++) {
            // draw city
            const coords = data[i].data.coords;
            if (coords == undefined)
                continue;
            const XYcoords = projection([coords[1], coords[0]]);
            if (!XYcoords)
                continue;
            svg.append('circle')
                .attr('cx', XYcoords[0])
                .attr('cy', XYcoords[1])
                // Later on, scale r proportionally to viewport width
                .attr('r', Math.pow(data[i].data.jobs, 3 / 5))
                .attr('fill', '#04ffd9ff')
                .attr('stroke', 'black')
                .attr('stroke-opacity', 0.3)
                .attr('TOTAL_JOBS', data[i].data.jobs)
                .attr('CITY_NAME', data[i].location)
                .attr('opacity', 0.5)
                .on("mouseenter", (event) => {
                    d3.select(event.currentTarget)
                        .attr('opacity', 1)
                        .attr('stroke-width', 3)
                        .attr('z-index', 99);
                    tooltip.style("visibility", "visible");
                    const cityName = d3.select(event.currentTarget).attr('CITY_NAME');
                    const jobCount = d3.select(event.currentTarget).attr('TOTAL_JOBS');
                    if (jobCount == 1) {
                        tooltip.html(`${cityName}<br>(1 job)`);
                    } else {
                        tooltip.html(`${cityName}<br>(${jobCount} jobs)`);
                    }
                })
                .on("mousemove", (evt) => {
                    tooltip.style("top", (event.offsetY) + "px").style("left", (event.offsetX + 10) + "px");
                })
                .on('mouseleave', (event) => {
                    d3.select(event.currentTarget)
                        .attr('opacity', 0.7)
                        .attr('stroke-width', 1);
                    tooltip.style("visibility", "hidden");
                })

            let stateName = data[i].location.split(',').at(-1).trim();
            if (states[stateName] != undefined)
                stateName = states[stateName];
            if (stateStats[stateName] == undefined)
                stateStats[stateName] = 0;
            stateStats[stateName] += data[i].data.jobs;
        }

        let region_array = []
        for (const [key, value] of Object.entries(stateStats)) {
            region_array.push({ state: key, jobs: value });
        }
        // sort so locations with the most internships have lower indices
        region_array.sort((a, b) => { return b.jobs - a.jobs; });
        const maxJobs = region_array[0].jobs;

        // Color in the states
        let state_names = Object.values(states);
        for (let i = 0; i < state_names.length; i++) {
            document.getElementById(state_names[i]).style.fill = 'rgb(0,70,70)';
        }
        console.log(region_array)
        for (let i = 0; i < region_array.length; i++) {
            const stateName = region_array[i].state;
            const jobs = region_array[i].jobs;
            let scale = Math.pow(jobs, 1/3) * 255 / Math.pow(maxJobs, 1/3);
            if (document.getElementById(stateName) == undefined)
                continue;
            document.getElementById(stateName).style.fill = 
            `rgb(${scale}, 80, 80)`;
        }
    })
})