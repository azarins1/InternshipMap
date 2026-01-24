const r = await fetch('/internship_data.json');
const data = await r.json();

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = Math.max(window.innerWidth, window.innerHeight / 0.7);
canvas.height = Math.min(canvas.width * 0.7, window.innerHeight);

// background
ctx.fillStyle = 'rgb(166, 198, 222)';
ctx.fillRect(0,0,canvas.width,canvas.height);

// draw the cities
let cities = data.cities;
for (let i = 0; i < cities.length; i++){
    let coords = cities[i].data.coords;
    if (coords == undefined)
        continue;
    let xy_mercator = mercator(coords);
    let xy_coords = zoom_in(xy_mercator);

    let jobs = cities[i].data.jobs;
    circle(xy_coords[0], xy_coords[1],job_size(jobs));
}
console.log('Done!');

function circle(x,y,r=5){
    ctx.fillStyle = 'rgba(55, 191, 45, 0.5)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fill(); 
    ctx.stroke();
}


/**
 * Converts latitude and longitude to x,y coordinates
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

function zoom_in(coords){
    const x_bounds = [0.15, 0.32];
    const y_bounds = [0, 0.4];

    let new_coords = [0,0];
    new_coords[0] = (coords[0] - x_bounds[0] * canvas.width) / (x_bounds[1] - x_bounds[0]);
    new_coords[1] = (coords[1] - y_bounds[0] * canvas.height) / (y_bounds[1] - y_bounds[0]);

    return new_coords;
}

function job_size(jobs){
    return Math.sqrt(jobs) * 2;
}