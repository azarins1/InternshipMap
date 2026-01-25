const r = await fetch('/internship_data.json');
const data = await r.json();

const usa_file = await fetch('/usa_outline.json');
const usa = await usa_file.json()

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

window.addEventListener('resize', () => {
    visualize();
});

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
    for (let i = cities.length - 1; i >= 0; i--) {
        let coords = cities[i].data.coords;
        if (coords == undefined)
            continue;
        let xy_mercator = mercator(coords);
        let xy_coords = zoom_in(xy_mercator);

        let jobs = cities[i].data.jobs;
        ctx.fillStyle = 'rgba(55, 191, 45, 0.3)';
        if (i <=7) {
            ctx.fillStyle = 'rgba(191, 45, 45, 0.5)';
            console.log(cities[i].location)
        }
        circle(xy_coords[0], xy_coords[1], job_size(jobs));
        if (i <= 7){
            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '25px Helvetica';
            ctx.fillText(cities[i].location, xy_coords[0], xy_coords[1])
        }
    }
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

function job_size(jobs) {
    return Math.sqrt(jobs) * (canvas.width * 0.002);
}