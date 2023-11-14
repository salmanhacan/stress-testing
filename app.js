const puppeteer = require('puppeteer');
const fs = require('fs');
const { performance } = require('perf_hooks');

const URL_TO_TEST = 'http://125.209.94.198:8383/apex/f?p=109';
const SESSION_COUNT = 250;
const CSV_FILE_PATH = 'response_times.csv';

async function runStressTest() {
  const browser = await puppeteer.launch({ headless: true });

  const promises = Array.from({ length: SESSION_COUNT }, async (_, index) => {
    const page = await browser.newPage();

    const startTime = performance.now();
    await page.goto(URL_TO_TEST);
    const endTime = performance.now();

    const responseTime = endTime - startTime;
    console.log(`Session ${index + 1} - Response Time: ${responseTime} ms`);

    await page.close();

    return { session: index + 1, responseTime };
  });

  const results = await Promise.all(promises);
  await browser.close();

  // Write response times to a CSV file
  const csvContent = 'Session,ResponseTime(ms)\n' + results.map(result => `${result.session},${result.responseTime}`).join('\n');
  fs.writeFileSync(CSV_FILE_PATH, csvContent);
  console.log(`Response times saved to ${CSV_FILE_PATH}`);
}

runStressTest().catch(error => console.error(error));
