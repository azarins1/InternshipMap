// Arthur Zarins

const dotenv = require('dotenv')
dotenv.config({ path: './secrets.env' });

const fs = require('node:fs')

const files = ['./data/quant_jobs.csv', './data/swe_jobs.csv', './data/hardware_jobs.csv', './data/datascience_ml_jobs.csv'];

const location_mappings = {
    'NYC': 'New York, NY',
    'SF': 'San Francisco, CA',
    'LA': 'Los Angeles, CA'
}
const state_mappings_old = {
    'AL': 'Alabama',
    'AK': 'Alaska',
    'AZ': 'Arizona',
    'AR': 'Arkansas',
    'CA': 'California',
    'CO': 'Colorado',
    'CT': 'Connecticut',
    'DE': 'Delaware',
    'DC': 'District of Columbia',
    'FL': 'Florida',
    'GA': 'Georgia',
    'HI': 'Hawaii',
    'ID': 'Idaho',
    'IL': 'Illinois',
    'IN': 'Indiana',
    'IA': 'Iowa',
    'KS': 'Kansas',
    'KY': 'Kentucky',
    'LA': 'Louisiana',
    'ME': 'Maine',
    'MD': 'Maryland',
    'MA': 'Massachusetts',
    'MI': 'Michigan',
    'MN': 'Minnesota',
    'MS': 'Mississippi',
    'MO': 'Missouri',
    'MT': 'Montana',
    'NE': 'Nebraska',
    'NV': 'Nevada',
    'NH': 'New Hampshire',
    'NJ': 'New Jersey',
    'NM': 'New Mexico',
    'NY': 'New York',
    'NC': 'North Carolina',
    'ND': 'North Dakota',
    'OH': 'Ohio',
    'OK': 'Oklahoma',
    'OR': 'Oregon',
    'PA': 'Pennsylvania',
    'RI': 'Rhode Island',
    'SC': 'South Carolina',
    'SD': 'South Dakota',
    'TN': 'Tennessee',
    'TX': 'Texas',
    'UT': 'Utah',
    'VT': 'Vermont',
    'VA': 'Virginia',
    'WA': 'Washington',
    'WV': 'West Virginia',
    'WI': 'Wisconsin',
    'WY': 'Wyoming'
}
const state_mappings = {
    'Alabama': 'AL',
    'Alaska': 'AK',
    'Arizona': 'AZ',
    'Arkansas': 'AR',
    'California': 'CA',
    'Colorado': 'CO',
    'Connecticut': 'CT',
    'Delaware': 'DE',
    'District of Columbia': 'DC',
    'Florida': 'FL',
    'Georgia': 'GA',
    'Hawaii': 'HI',
    'Idaho': 'ID',
    'Illinois': 'IL',
    'Indiana': 'IN',
    'Iowa': 'IA',
    'Kansas': 'KS',
    'Kentucky': 'KY',
    'Louisiana': 'LA',
    'Maine': 'ME',
    'Maryland': 'MD',
    'Massachusetts': 'MA',
    'Michigan': 'MI',
    'Minnesota': 'MN',
    'Mississippi': 'MS',
    'Missouri': 'MO',
    'Montana': 'MT',
    'Nebraska': 'NE',
    'Nevada': 'NV',
    'New Hampshire': 'NH',
    'New Jersey': 'NJ',
    'New Mexico': 'NM',
    'New York': 'NY',
    'North Carolina': 'NC',
    'North Dakota': 'ND',
    'Ohio': 'OH',
    'Oklahoma': 'OK',
    'Oregon': 'OR',
    'Pennsylvania': 'PA',
    'Rhode Island': 'RI',
    'South Carolina': 'SC',
    'South Dakota': 'SD',
    'Tennessee': 'TN',
    'Texas': 'TX',
    'Utah': 'UT',
    'Vermont': 'VT',
    'Virginia': 'VA',
    'Washington': 'WA',
    'West Virginia': 'WV',
    'Wisconsin': 'WI',
    'Wyoming': 'WY'
};


var usa_only = false;

// variables to keep track of 
var global_job_count = 0;
var locations = {};
function process_datafile(filename) {
    // Import raw data
    const raw_data = fs.readFileSync(filename, 'utf8');
    const lines = raw_data.split('\n')

    let last_company = '';
    for (let l = 1; l < lines.length; l++) {
        let traits = lines[l].split('@');

        let location;
        if (traits.length == 1) {
            location = process_location(traits[0]);
            company = last_company;
        } else {
            location = process_location(traits[2]);
            company = process_company(traits[0]); // get company name
            // use previous company if down arrow is used
            if (company.trim() == '↳') company = last_company;
        }
        if (location == null) continue; // ignore bad data

        if (locations[location] == undefined) {
            locations[location] = { jobs: 0, companies: new Set() }; // initialize the location
        }
        locations[location].jobs += 1;
        locations[location].companies.add(company);
        global_job_count += 1;
        last_company = company; // update the last recorded company
    }
}
for (let i in files) {
    process_datafile(files[i]); // process ALL the files!
}


let loc_array = []
for (const [key, value] of Object.entries(locations)) {
    loc_array.push({ location: key, data: value });
}
// sort so locations with the most internships have lower indices
loc_array.sort((a, b) => { return b.data.jobs - a.data.jobs; });

let top_job_cities = 0;
console.log()
for (let i = 0; i < 10; i++) {
    top_job_cities += loc_array[i].data.jobs;
    console.log(`${i + 1}.\t${loc_array[i].location} - ${loc_array[i].data.jobs} (${to_percent(loc_array[i].data.jobs, global_job_count)}), ${loc_array[i].data.companies.size} companies`)
    // console.log(loc_array[i].data.companies)
}

console.log(`\n${to_percent(top_job_cities, global_job_count)} of ${global_job_count} jobs located within the above cities`)
console.log(`${loc_array.length} cities total!`)

// get_geolocation_data_api();

// fs.writeFileSync('./geolocations.csv', 'text!\nline 2!')

// Process location string
function process_location(loc) {
    loc = loc.trim()
    if (loc[0] == '"') loc = loc.slice(1);
    if (loc[loc.length - 1] == '"') loc = loc.slice(0, -1);

    if (Number.isInteger(Number.parseInt(loc[0])) || loc.length == 0) {
        return null; // This is bad data - ignore it
    }
    if (loc.toLowerCase().indexOf("remote") > -1)
        return null; // the job is remote - ignore it

    if (location_mappings[loc] != undefined)
        loc = location_mappings[loc] // change abbreviation to full name

    if (usa_only && (loc.toLowerCase().indexOf("canada") > -1) || loc.indexOf("London") > -1)
        return null; // the job is international

    return loc;
}

function process_company(com) {
    com = com.replace('🔥', ''); // remove emoji
    return com.trim();
}

function to_percent(num, denom) {
    percent = Math.floor(num * 10000 / denom) / 100;
    // if (percent >= 10) percent = Math.floor(percent * 10) / percent;
    return `${percent}%`;
}

var location_coords = {};
function get_coords(){
    const raw_data = fs.readFileSync('./worldcities.csv', 'utf8');
    const lines = raw_data.split('\n');

    const headers = lines[0].split(',');
    const city_name = headers.indexOf('"city_ascii"');
    const admin_name = headers.indexOf('"admin_name"'); // stores the state
    const country = headers.indexOf('"country"');
    const lat = headers.indexOf('"lat"');
    const lng = headers.indexOf('"lng"');

    for (let i = 1; i < lines.length; i++){
        const data = lines[i].split(',');
        for (let d = 0; d < data.length; d++){
            data[d] = data[d].replaceAll('"','');
        }
        if (data[country] != 'United States')
            continue;

        const city = data[city_name];
        const coords = [Number(data[lat]), Number(data[lng])] // Lat, Long
        const state = state_mappings[data[admin_name]];
        const full_name = `${city}, ${state}`
        console.log(full_name, coords)
        
        location_coords[full_name] = coords;
    }
}
get_coords();
console.log(Object.keys(location_coords).length, ' locations in the US');
console.log('NYC',location_coords['New York, NY']);
console.log('BOS',location_coords['Boston, MA'])

// Get geolocation data with the database
function get_geolocation_data() {
    for (let i = 0; i < loc_array.length; i++) {
        let location_data = loc_array[i].location.split(',')
        let city = location_data[0];
        let state = location_data[1]
        console.log(city, state);
    }

}

function lat_long_to_mercator(long, lat){
    const R = 1; // arbitrary scale factor
    const lat_0 = 100;
    // center longitude of US is 100 degrees West
    let x = R * (long - lat_0);
    let y = R * (Math.log(Math.tan(0.4 * Math.PI + 0.5 * lat)));
    return [x,y];
}

// console.log('ENV =',process.env.GEO_API);