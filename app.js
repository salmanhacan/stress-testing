const puppeteer = require('puppeteer');
const fs = require('fs');
const util = require('util');
const csv = require('csv-parser');
const { performance } = require('perf_hooks');

const readFile = util.promisify(fs.readFile);

const URL_TO_TEST = 'http://125.209.94.198:8383/apex/f?p=109';

const CSV_FILE_PATH = 'response_times.csv';
const usersFile = 'user.csv';

const timeout  = 30000 * 10;

var users = [];


async function readCSVFile(filePath) {
  try {
    const data = await readFile(filePath, 'utf8');
    const results = [];

    // Use the csv-parser module to parse the CSV data
    data
      .trim() // Remove any leading/trailing whitespace
      .split('\n') // Split the data by newline
      .forEach((line) => {
        const row = line.split(','); // Assuming CSV values are comma-separated
        results.push(row);
      });    

    console.log(results);
    // Process the 'results' array here or perform other operations.

    return results;
  } catch (error) {
    console.error('Error reading the file:', error);
    throw error;
  }
}

async function runStressTest() {
 

  const SESSION_COUNT = users.length;

  const promises = Array.from({ length: SESSION_COUNT }, async (_, index) => {
    
    const browser = await puppeteer.launch({ headless: true });
    
    const page = await browser.newPage();

    const startTime = performance.now();
    await page.goto(URL_TO_TEST, { waitUntil : 'load', timeout });
    const endTime1 = performance.now();

    const responseTime1 = endTime1 - startTime;
    console.log(`Session ${index + 1} - Response Time 1: ${responseTime1/1000} s`);
    
    await page.type('input[name="P9999_USERNAME"]', users[index][0]);
    await page.type('input[name="P9999_PASSWORD"]', users[index][1]);
    await page.click('#P9999_SUBMIT');
  
    await page.waitForNavigation({ waitUntil : 'load', timeout });
  
    const endTime2 = performance.now();
    const responseTime2 = endTime2 - startTime;
  
    console.log(`Session ${index + 1}: Response Time 2: ${responseTime2/1000} s`);

    await page.close();
    
    await browser.close();

    return { session: index + 1, responseTime1, responseTime2 };
  });

  const results = await Promise.all(promises);
 

  // Write response times to a CSV file
  const csvContent = 'Session,ResponseTime(ms)\n' + results.map(result => `${result.session},${result.responseTime}`).join('\n');
  fs.writeFileSync(CSV_FILE_PATH, csvContent);
  console.log(`Response times saved to ${CSV_FILE_PATH}`);
}


(async()=>{
users  = await readCSVFile(usersFile);
})().then(()=>{
  runStressTest().catch(error => console.error(error));
});
 