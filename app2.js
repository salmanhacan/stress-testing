const puppeteer = require('puppeteer');
const fs = require('fs');
const csv = require('csv-parser');

const url = 'http://125.209.94.198:8383/apex/f?p=109';
const sessionsCount = 250;
const usersFile = 'user.csv';
const outputCSV = 'response_times.csv';

async function loginAndMeasureResponseTime(page, username, password, sessionNumber) {
  const start = Date.now();
  
  await page.type('input[name="P9999_USERNAME"]', String(username));
  await page.type('input[name="P9999_PASSWORD"]', String(password));
  await page.click('#P9999_SUBMIT');

  await page.waitForNavigation({ waitUntil : 'load'});

  const end = Date.now();
  const responseTime = end - start;

  console.log(`Session ${sessionNumber}: Response Time - ${responseTime} ms`);

  // Write response time to CSV file
  fs.appendFileSync(outputCSV, `${sessionNumber},${responseTime}\n`);
}

async function main() {
  // Read users from CSV file
  const users = [];
  fs.createReadStream(usersFile)
    .pipe(csv())
    .on('data', (row) => {
      users.push(row);
    })
    .on('end', async () => {
      // Open browser and create sessions
      const browser = await puppeteer.launch();
      const pages = await Promise.all([...Array(sessionsCount)].map(() => browser.newPage()));

      // Prepare CSV file with header
      fs.writeFileSync(outputCSV, 'Session,Response Time (ms)\n');

      // Loop through sessions and login with different users
      for (let i = 0; i < sessionsCount; i++) {
        const page = pages[i];
        const user = users[i % users.length];

        await page.goto(url, { waitUntil: 'load', timeout: 0});

        // Perform login and measure response time
        await loginAndMeasureResponseTime(page, String(user["﻿uid"]), String(user["pwd"]), i + 1);

        // Close the page to release resources
        //await page.close();
      }

      // Execute all promises in parallel
      await Promise.all(loginPromises);

      // Close the browser
      await browser.close();
    });
}

main();
