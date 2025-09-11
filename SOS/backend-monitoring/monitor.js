const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 5000;

// Serve static files
app.use('/results', express.static(path.join(__dirname, 'results')));

// Home page
app.get('/', (req, res) => {
  console.log("Loading home page...");
  
  // Make sure results directory exists
  const resultsDir = path.join(__dirname, 'results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
    console.log(`Created results directory at ${resultsDir}`);
  }
  
  const reportPath = path.join(__dirname, 'results', 'report.html');
  const jsonPath = path.join(__dirname, 'results', 'results.json');
  
  console.log(`Checking for report at ${reportPath}`);
  
  // Check if report.html exists
  if (fs.existsSync(reportPath)) {
    console.log("Report file found, serving HTML report");
    try {
      const reportHtml = fs.readFileSync(reportPath, 'utf8');
      return res.send(reportHtml);
    } catch (error) {
      console.error(`Error reading report file: ${error}`);
      // Continue to show welcome page if there's an error
    }
  } else {
    console.log("No report file found");
    
    // Check if JSON results exist but HTML report doesn't
    if (fs.existsSync(jsonPath)) {
      console.log("JSON results found but no HTML report, regenerating report");
      try {
        // Require the load-test module to access the generateHtmlReport function
        const loadTest = require('./load-test');
        const resultsData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        
        // If loadTest exports the function directly, we can use it
        if (typeof loadTest.generateHtmlReport === 'function') {
          const reportHtml = loadTest.generateHtmlReport(resultsData);
          fs.writeFileSync(reportPath, reportHtml);
          console.log("Successfully regenerated HTML report");
          return res.send(reportHtml);
        }
      } catch (error) {
        console.error(`Error regenerating report: ${error}`);
        // Continue to show welcome page if there's an error
      }
    }
  }
  
  // Otherwise show welcome page
  console.log("Showing welcome page");
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Backend Architecture Comparison</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          line-height: 1.6;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }
        header {
          margin-bottom: 30px;
        }
        h1 {
          color: #333;
        }
        .no-results {
          text-align: center;
          padding: 40px;
          background-color: #f9f9f9;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .run-test-btn {
          display: block;
          width: 200px;
          margin: 20px auto;
          padding: 10px;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          text-align: center;
          text-decoration: none;
        }
        .run-test-btn:hover {
          background-color: #45a049;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>Backend Architecture Comparison</h1>
          <p>Monolithic vs. Microservices Performance</p>
        </header>
        
        <div class="no-results">
          <h2>No test results available</h2>
          <p>Run the load test to generate performance comparison data.</p>
          <p><small>Make sure your monolithic backend is running on port 4000 and your microservices API gateway is running on port 3000.</small></p>
        </div>
        
        <a href="/run-test" class="run-test-btn">Run Performance Test</a>
      </div>
    </body>
    </html>
  `);
});

// Endpoint to trigger the load test
app.get('/run-test', (req, res) => {
  const { exec } = require('child_process');
  
  // Set a longer timeout for the refresh (60 seconds instead of 3)
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Running Test...</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          text-align: center;
          padding: 50px;
        }
        .loader {
          border: 16px solid #f3f3f3;
          border-top: 16px solid #3498db;
          border-radius: 50%;
          width: 120px;
          height: 120px;
          animation: spin 2s linear infinite;
          margin: 0 auto;
          margin-bottom: 30px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .back-btn {
          display: inline-block;
          margin-top: 20px;
          padding: 10px 20px;
          background-color: #4CAF50;
          color: white;
          text-decoration: none;
          border-radius: 4px;
        }
      </style>
      <meta http-equiv="refresh" content="60;url=/" />
    </head>
    <body>
      <h1>Running Performance Test</h1>
      <div class="loader"></div>
      <p>This may take a few minutes. Please wait...</p>
      <p>You will be redirected to the results page when the test completes.</p>
      <p><small>If not redirected automatically, <a href="/">click here</a> to view results.</small></p>
      <a href="/" class="back-btn">Back to Dashboard</a>
    </body>
    </html>
  `);
  
  console.log("Starting performance test...");
  
  // Make sure results directory exists
  const resultsDir = path.join(__dirname, 'results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
    console.log(`Created results directory at ${resultsDir}`);
  }
  
  // Get the full path to load-test.js
  const testScriptPath = path.join(__dirname, 'load-test.js');
  console.log(`Executing test script: ${testScriptPath}`);
  
  // Execute the load test script with verbose error handling
  exec(`node "${testScriptPath}"`, { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error running test: ${error}`);
      console.error(`Exit code: ${error.code}`);
      return;
    }
    console.log(`Test output: ${stdout}`);
    if (stderr) console.error(`Test stderr: ${stderr}`);
    
    console.log("Test completed successfully");
    
    // Double-check that report.html exists
    const reportPath = path.join(__dirname, 'results', 'report.html');
    if (fs.existsSync(reportPath)) {
      console.log(`Report file generated at ${reportPath}`);
    } else {
      console.error(`Report file not found at ${reportPath}`);
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Monitoring dashboard running at http://localhost:${port}`);
}); 