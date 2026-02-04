const r = await fetch('/internship_data.json');
const data = await r.json();

const usa_file = await fetch('/usa_outline.json');
const usa = await usa_file.json()

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

var job_type = 'jobs';
var percent = false;

window.addEventListener('resize', () => {
    visualize();
});

document.getElementById('sweBtn').addEventListener('click', () => {
    job_type = 'swe';
    visualize();
});
document.getElementById('quantBtn').addEventListener('click', () => {
    job_type = 'quant';
    visualize();
})
document.getElementById('hardwareBtn').addEventListener('click', () => {
    job_type = 'hardware';
    visualize();
})
document.getElementById('datascience_mlBtn').addEventListener('click', () => {
    job_type = 'datascience_ml';
    visualize();
})
document.getElementById('showAllBtn').addEventListener('click', () => {
    job_type = 'jobs'; // gets data on all jobs
    visualize();
})
document.getElementById('percentBtn').addEventListener('click', () => {
    percent = !percent; // toggle percent
    document.getElementById('percentBtn').innerHTML = 'Show %   ';
    if (percent)
        document.getElementById('percentBtn').innerHTML = 'Show Values';
    visualize();
})


function changeJobType(type) {
    job_type = type; // update the job type
    visualize();
}

function calibrate_dimensions() {
    const ratio = 0.5;
    canvas.width = Math.min(window.innerWidth, window.innerHeight / ratio);
    canvas.height = Math.min(canvas.width * ratio, window.innerHeight);

    console.log(canvas.width, canvas.height);
    // background
    ctx.fillStyle = 'rgb(166, 198, 222)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function visualize() {
    let buttons = ['swe', 'quant', 'hardware', 'datascience_ml']
    for (let i = 0; i < 4; i++){
        document.getElementById(`${buttons[i]}Btn`).classList.remove('selected');
    }

    if (job_type != 'jobs')
        document.getElementById(`${job_type}Btn`).classList.add('selected');
    calibrate_dimensions();
    drawUSA();
    draw_cities();
}
visualize();

function drawUSA() {
    let coords = structuredClone(usa.coordinates);
    for (let i = 0; i < coords.length; i++) {
        let flipped = [coords[i][1], coords[i][0]]
        let xy_mercator = mercator(flipped);
        let xy_coords = zoom_in(xy_mercator);
        coords[i] = xy_coords;
    }

    // ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.moveTo(coords[0][0], coords[0][1]);
    for (let i = 0; i < coords.length; i++) {
        ctx.lineTo(coords[i][0], coords[i][1]);
    }
    ctx.lineTo(coords[0][0], coords[0][1])
    ctx.closePath();
    ctx.fillStyle = 'rgb(113, 139, 92)';
    ctx.fill();
    console.log('USA is drawn')
}

function draw_cities() {
    // draw the cities
    let cities = data.cities;
    let total_jobs = 0;
    for (let i = 0; i < cities.length; i++) {
        cities[i].display_value = cities[i].data[job_type];
        total_jobs += cities[i].data[job_type];
    }
    console.log('Total Jobs:', total_jobs);
    cities.sort((a, b) => { return b.display_value - a.display_value });

    for (let i = cities.length - 1; i >= 0; i--) {
        let jobs = cities[i].display_value;
        let coords = cities[i].data.coords;
        if (coords == undefined)
            continue;
        let xy_mercator = mercator(coords);
        let xy_coords = zoom_in(xy_mercator);

        console.log(cities[0].location, cities[1].location, cities[2].location);
        ctx.fillStyle = 'rgba(55, 191, 45, 0.3)';
        if (i <= 7) {
            ctx.fillStyle = 'rgba(191, 45, 45, 0.3)';
            // console.log(cities[i].location)
        }
        if (percent == true) {
            circle(xy_coords[0], xy_coords[1], job_size(jobs, total_jobs));
        } else {
            circle(xy_coords[0], xy_coords[1], job_size(jobs, 0));
            // circle(xy_coords[0], xy_coords[1], job_size(jobs, 0));
        }
        if (i <= 15) {
            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '25px Helvetica';
            // ctx.fillText(cities[i].location, xy_coords[0], xy_coords[1])
        }
    }
    const results = document.getElementById('results');
    let result_text = '';
    for (let i = 0; i < 20 & i < cities.length; i++){
        result_text += `${i+1}. ${cities[i].location} - ${cities[i].display_value} 
        (${Math.round(cities[i].display_value * 10000 / total_jobs) / 100}%)
        <br>`
    }
    results.innerHTML = result_text;
}

function circle(x, y, r = 5) {
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
}

/**
 * Converts latitude and longitude to x,y coordinates
 * This function was written with assistance from Google Gemini
 * Prompt: 'Mercator formula code' (response was pseudocode)
 * @param {*} coords 
 * @returns 
 */
function mercator(coords) {
    if (coords == undefined) {
        console.log('oh no')
    }
    // coords are initially in degrees; convert to radians!
    const mapWidth = canvas.width;
    const mapHeight = canvas.height;

    const coords_rad = [coords[0] * Math.PI / 180, coords[1] * Math.PI / 180];

    const normalizedX = coords_rad[1] / Math.PI;
    const normalizedY = Math.log(Math.tan(Math.PI / 4 + coords_rad[0] / 2))

    const x = (normalizedX + 1) * mapWidth / 2; // Adjust for -1 to 1 range
    const y = (mapHeight / 2) - (normalizedY * mapHeight / 2); // Flip y-axis and scale
    return [x, y];
}

function zoom_in(coords) {
    const x_bounds = [0.14, 0.32];
    const y_bounds = [0, 0.3];

    let new_coords = [0, 0];
    new_coords[0] = (coords[0] - x_bounds[0] * canvas.width) / (x_bounds[1] - x_bounds[0]);
    new_coords[1] = (coords[1] - y_bounds[0] * canvas.height) / (y_bounds[1] - y_bounds[0]);

    return new_coords;
}

// size for functions to be
function job_size(jobs, total_jobs = 0) {
    return Math.min(jobs, 1);
    if (total_jobs == 0) // we don't care about total # of jobs
        return Math.sqrt(jobs) * (canvas.width * 0.0025);
    return Math.sqrt(jobs / total_jobs) * (canvas.width * 0.1);
}