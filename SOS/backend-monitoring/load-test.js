const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

// Configuration
const MONOLITHIC_URL = 'http://localhost:4000'; // Updated monolithic backend URL to port 4000
const MICROSERVICES_URL = 'http://localhost:5000'; // Updated API gateway URL to port 3000

// Test endpoints that exist in both backends
const TEST_ENDPOINTS = [
  // Note Service Endpoints
  { name: 'Notes - Get All', path: '/api/notes/get-notes/W5k3NAyaw9f07HeeTw9GbiHieSn1', method: 'GET' },
  
  // Event Service Endpoints
  { name: 'Events - Get All', path: '/api/events/user/W5k3NAyaw9f07HeeTw9GbiHieSn1', method: 'GET' }
];

// Modify test duration for quicker feedback
const TEST_DURATION = 10; // seconds (reduced from 10)
const CONNECTIONS = 100; // Reduced from 2 to minimize aborted requests

// Create results directory
const RESULTS_DIR = path.join(__dirname, 'results');
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR);
}

// Initialize global results object
const globalResults = {
  monolithicBootTime: null,
  microservicesBootTime: null
};

// Function to run tests against a backend
async function runTest(name, baseUrl) {
  console.log(`\nRunning tests against ${name} backend (${baseUrl})...`);
  
  // Measure cold start time by sending an initial ping request
  console.log(`Measuring cold start time for ${name}...`);
  const startTime = Date.now();
  try {
    await fetch(`${baseUrl}/ping`);
    const coldStartTime = Date.now() - startTime;
    console.log(`  Cold start response time: ${coldStartTime} ms`);
    
    // Store for later reporting
    if (name === 'Monolithic') {
      globalResults.monolithicBootTime = coldStartTime;
    } else {
      globalResults.microservicesBootTime = coldStartTime;
    }
  } catch (error) {
    console.error(`  Error measuring cold start time: ${error.message}`);
    if (name === 'Monolithic') {
      globalResults.monolithicBootTime = -1; // Error indicator
    } else {
      globalResults.microservicesBootTime = -1; // Error indicator
    }
  }
  
  const results = [];
  
  for (const endpoint of TEST_ENDPOINTS) {
    try {
      console.log(`Testing ${endpoint.name} (${endpoint.method} ${endpoint.path})...`);
      
      // Additional logging to debug connection issues
      console.log(`  Target URL: ${baseUrl}${endpoint.path}`);
      
      // Determine autocannon options based on whether setupRequest is defined
      const autocannonOptions = {
        url: `${baseUrl}${endpoint.path}`,
        connections: CONNECTIONS,
        duration: TEST_DURATION,
        method: endpoint.method,
        timeout: 5, // 5 second timeout for each request to prevent hanging
      };

      if (endpoint.setupRequest) {
        autocannonOptions.setupRequest = endpoint.setupRequest;
      } else {
        autocannonOptions.headers = endpoint.headers || {};
        autocannonOptions.body = endpoint.body;
      }

      const result = await autocannon(autocannonOptions);
      
      results.push({
        endpoint: endpoint.name,
        result
      });
      
      console.log(`  Requests/sec: ${result.requests.average}`);
      console.log(`  Latency (avg): ${result.latency.average} ms`);
      console.log(`  Min/Max Latency: ${result.latency.min} ms / ${result.latency.max} ms`);
      console.log(`  Status Codes: ${JSON.stringify(result.statusCodeStats || {})}`);
      console.log(`  Errors: ${Object.keys(result.errors || {}).length > 0 ? JSON.stringify(result.errors) : "None"}`);
    } catch (error) {
      console.error(`Error testing ${endpoint.name}: ${error.message}`);
      // Create a placeholder result for the failed endpoint to maintain array alignment
      results.push({
        endpoint: endpoint.name,
        result: {
          requests: { average: 0 },
          latency: { average: 0, min: 0, max: 0 },
          errors: { failed: 1 },
          // Add other properties that might be accessed elsewhere
          statusCodeStats: {},
        }
      });
    }
  }
  
  return results;
}

// Generate ASCII chart for comparison
function generateAsciiChart(monolithicResults, microservicesResults) {
  console.log('\n=== THROUGHPUT COMPARISON (req/sec) ===');
  const maxLength = Math.max(...TEST_ENDPOINTS.map(e => e.name.length)) + 5;
  
  console.log('Endpoint'.padEnd(maxLength) + 'Monolithic'.padEnd(15) + 'Microservices'.padEnd(15));
  console.log('-'.repeat(maxLength + 30));
  
  for (let i = 0; i < TEST_ENDPOINTS.length; i++) {
    const mono = monolithicResults[i].result.requests.average.toFixed(2);
    const micro = microservicesResults[i].result.requests.average.toFixed(2);
    
    console.log(
      TEST_ENDPOINTS[i].name.padEnd(maxLength) + 
      mono.padEnd(15) + 
      micro.padEnd(15)
    );
  }
  
  console.log('\n=== LATENCY COMPARISON (ms) ===');
  console.log('Endpoint'.padEnd(maxLength) + 'Monolithic'.padEnd(15) + 'Microservices'.padEnd(15));
  console.log('-'.repeat(maxLength + 30));
  
  for (let i = 0; i < TEST_ENDPOINTS.length; i++) {
    const mono = monolithicResults[i].result.latency.average.toFixed(2);
    const micro = microservicesResults[i].result.latency.average.toFixed(2);
    
    console.log(
      TEST_ENDPOINTS[i].name.padEnd(maxLength) + 
      mono.padEnd(15) + 
      micro.padEnd(15)
    );
  }
  
  console.log('\n=== ERROR COUNT COMPARISON ===');
  console.log('Endpoint'.padEnd(maxLength) + 'Monolithic'.padEnd(15) + 'Microservices'.padEnd(15));
  console.log('-'.repeat(maxLength + 30));
  
  for (let i = 0; i < TEST_ENDPOINTS.length; i++) {
    const mono = Object.values(monolithicResults[i].result.errors).reduce((a, b) => a + b, 0);
    const micro = Object.values(microservicesResults[i].result.errors).reduce((a, b) => a + b, 0);
    
    console.log(
      TEST_ENDPOINTS[i].name.padEnd(maxLength) + 
      mono.toString().padEnd(15) + 
      micro.toString().padEnd(15)
    );
  }
}

// Save detailed results to JSON
function saveResults(monolithicResults, microservicesResults) {
  const results = {
    timestamp: new Date().toISOString(),
    monolithic: monolithicResults,
    microservices: microservicesResults,
    bootTime: {
      monolithic: globalResults.monolithicBootTime || 'Not measured',
      microservices: globalResults.microservicesBootTime || 'Not measured'
    },
    summary: {
      monolithic: {
        avgThroughput: monolithicResults.reduce((acc, r) => acc + r.result.requests.average, 0) / monolithicResults.length,
        avgLatency: monolithicResults.reduce((acc, r) => acc + r.result.latency.average, 0) / monolithicResults.length,
      },
      microservices: {
        avgThroughput: microservicesResults.reduce((acc, r) => acc + r.result.requests.average, 0) / microservicesResults.length,
        avgLatency: microservicesResults.reduce((acc, r) => acc + r.result.latency.average, 0) / microservicesResults.length,
      }
    }
  };
  
  fs.writeFileSync(path.join(RESULTS_DIR, 'results.json'), JSON.stringify(results, null, 2));
  console.log('Detailed results saved to results.json');
  
  // Generate HTML report
  const htmlReport = generateHtmlReport(results);
  fs.writeFileSync(path.join(RESULTS_DIR, 'report.html'), htmlReport);
  console.log('HTML report generated: results/report.html');
  
  // Print summary
  console.log('\n=== SUMMARY ===');
  console.log('Monolithic Backend:');
  console.log(`  Average Throughput: ${results.summary.monolithic.avgThroughput.toFixed(2)} req/sec`);
  console.log(`  Average Latency: ${results.summary.monolithic.avgLatency.toFixed(2)} ms`);
  console.log(`  Cold Start Time: ${results.bootTime.monolithic} ms`);
  
  console.log('Microservices Backend:');
  console.log(`  Average Throughput: ${results.summary.microservices.avgThroughput.toFixed(2)} req/sec`);
  console.log(`  Average Latency: ${results.summary.microservices.avgLatency.toFixed(2)} ms`);
  console.log(`  Cold Start Time: ${results.bootTime.microservices} ms`);
  
  // Calculate differences
  const throughputDiff = ((results.summary.microservices.avgThroughput / results.summary.monolithic.avgThroughput) - 1) * 100;
  const latencyDiff = ((results.summary.microservices.avgLatency / results.summary.monolithic.avgLatency) - 1) * 100;
  
  console.log('\nComparison:');
  console.log(`  Throughput: Microservices is ${Math.abs(throughputDiff).toFixed(2)}% ${throughputDiff > 0 ? 'better' : 'worse'}`);
  console.log(`  Latency: Microservices is ${Math.abs(latencyDiff).toFixed(2)}% ${latencyDiff < 0 ? 'better' : 'worse'}`);
}

// Generate HTML report
function generateHtmlReport(results) {
  return `
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
          max-width: 1200px;
          margin: 0 auto;
        }
        header {
          text-align: center;
          margin-bottom: 30px;
        }
        h1 {
          color: #333;
        }
        .metrics {
          display: flex;
          justify-content: space-around;
          margin-bottom: 30px;
        }
        .metric-card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          width: 30%;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .metric-title {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 15px;
          text-align: center;
        }
        .comparison {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .status-success {
          color: green;
          font-weight: bold;
        }
        .status-warning {
          color: orange;
          font-weight: bold;
        }
        .status-error {
          color: red;
          font-weight: bold;
        }
        /* Added styles for the button */
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
          <p><strong>Test Date:</strong> ${new Date(results.timestamp).toLocaleString()}</p>
        </header>

        <div class="metrics">
          <div class="metric-card">
            <div class="metric-title">Throughput</div>
            <p><strong>Monolithic:</strong> ${results.summary.monolithic.avgThroughput.toFixed(2)} req/sec</p>
            <p><strong>Microservices:</strong> ${results.summary.microservices.avgThroughput.toFixed(2)} req/sec</p>
            <p>
              <strong>Difference:</strong> 
              ${Math.abs((results.summary.microservices.avgThroughput / results.summary.monolithic.avgThroughput - 1) * 100).toFixed(2)}% 
              ${results.summary.microservices.avgThroughput > results.summary.monolithic.avgThroughput ? 'higher in Microservices' : 'higher in Monolithic'}
            </p>
          </div>
          
          <div class="metric-card">
            <div class="metric-title">Latency</div>
            <p><strong>Monolithic:</strong> ${results.summary.monolithic.avgLatency.toFixed(2)} ms</p>
            <p><strong>Microservices:</strong> ${results.summary.microservices.avgLatency.toFixed(2)} ms</p>
            <p>
              <strong>Difference:</strong> 
              ${Math.abs((results.summary.microservices.avgLatency / results.summary.monolithic.avgLatency - 1) * 100).toFixed(2)}% 
              ${results.summary.microservices.avgLatency < results.summary.monolithic.avgLatency ? 'lower in Microservices' : 'lower in Monolithic'}
            </p>
          </div>
          
          <div class="metric-card">
            <div class="metric-title">Cold Start Time</div>
            <p><strong>Monolithic:</strong> ${results.bootTime.monolithic} ms</p>
            <p><strong>Microservices:</strong> ${results.bootTime.microservices} ms</p>
            <p>
              <strong>Difference:</strong> 
              ${typeof results.bootTime.monolithic === 'number' && typeof results.bootTime.microservices === 'number' ?
                `${Math.abs((results.bootTime.microservices / results.bootTime.monolithic - 1) * 100).toFixed(2)}% 
                ${results.bootTime.microservices < results.bootTime.monolithic ? 'faster in Microservices' : 'faster in Monolithic'}`
                : 'Not available'}
            </p>
          </div>
        </div>
        
        <div class="comparison">
          <h2>Detailed Results</h2>
          <h3>Throughput (requests/sec)</h3>
          <table>
            <tr>
              <th>Endpoint</th>
              <th>Monolithic</th>
              <th>Microservices</th>
              <th>Difference</th>
            </tr>
            ${results.monolithic.map((item, i) => {
              const mono = item.result.requests.average;
              const micro = results.microservices[i].result.requests.average;
              const diff = mono === 0 || micro === 0 ? 0 : ((micro / mono) - 1) * 100;
              return `
                <tr>
                  <td>${item.endpoint}</td>
                  <td>${mono.toFixed(2)}</td>
                  <td>${micro.toFixed(2)}</td>
                  <td>${diff === 0 ? 'N/A' : `${diff > 0 ? '+' : ''}${diff.toFixed(2)}%`}</td>
                </tr>
              `;
            }).join('')}
          </table>
          
          <h3>Latency (ms)</h3>
          <table>
            <tr>
              <th>Endpoint</th>
              <th>Monolithic</th>
              <th>Microservices</th>
              <th>Difference</th>
            </tr>
            ${results.monolithic.map((item, i) => {
              const mono = item.result.latency.average;
              const micro = results.microservices[i].result.latency.average;
              const diff = mono === 0 || micro === 0 ? 0 : ((micro / mono) - 1) * 100;
              return `
                <tr>
                  <td>${item.endpoint}</td>
                  <td>${mono.toFixed(2)}</td>
                  <td>${micro.toFixed(2)}</td>
                  <td>${diff === 0 ? 'N/A' : `${diff > 0 ? '+' : ''}${diff.toFixed(2)}%`}</td>
                </tr>
              `;
            }).join('')}
          </table>
          
          <h3>HTTP Status Codes</h3>
          <table>
            <tr>
              <th>Endpoint</th>
              <th>Monolithic Status</th>
              <th>Microservices Status</th>
            </tr>
            ${results.monolithic.map((item, i) => {
              const formatStatusCodes = (statusCodeStats) => {
                if (!statusCodeStats || Object.keys(statusCodeStats).length === 0) {
                  return '<span class="status-error">No successful responses</span>';
                }
                
                return Object.entries(statusCodeStats).map(([code, count]) => {
                  let className = '';
                  if (code.startsWith('2')) className = 'status-success';
                  else if (code.startsWith('4')) className = 'status-warning';
                  else if (code.startsWith('5')) className = 'status-error';
                  
                  return `<span class="${className}">${code}: ${count}</span>`;
                }).join('<br>');
              };
              
              const monoStatus = formatStatusCodes(item.result.statusCodeStats);
              const microStatus = formatStatusCodes(results.microservices[i].result.statusCodeStats);
              
              return `
                <tr>
                  <td>${item.endpoint}</td>
                  <td>${monoStatus}</td>
                  <td>${microStatus}</td>
                </tr>
              `;
            }).join('')}
          </table>
          
          <h3>Error Count</h3>
          <table>
            <tr>
              <th>Endpoint</th>
              <th>Monolithic</th>
              <th>Microservices</th>
            </tr>
            ${results.monolithic.map((item, i) => {
              const mono = Object.values(item.result.errors).reduce((a, b) => a + b, 0);
              const micro = Object.values(results.microservices[i].result.errors).reduce((a, b) => a + b, 0);
              return `
                <tr>
                  <td>${item.endpoint}</td>
                  <td>${mono}</td>
                  <td>${micro}</td>
                </tr>
              `;
            }).join('')}
          </table>
        </div>
        
        <div class="comparison">
          <h2>Architecture Trade-offs</h2>
          
          <h3>Monolithic Architecture</h3>
          <p><strong>Advantages:</strong></p>
          <ul>
            <li><strong>Lower Latency:</strong> Typically better response times due to fewer network hops</li>
            <li><strong>Simplicity:</strong> Easier to develop, test, and deploy as a single unit</li>
            <li><strong>Data Consistency:</strong> Easier to maintain transactional integrity</li>
            <li><strong>Resource Efficiency:</strong> Generally requires fewer resources</li>
          </ul>
          
          <p><strong>Disadvantages:</strong></p>
          <ul>
            <li><strong>Scalability Challenges:</strong> Must scale the entire application</li>
            <li><strong>Technology Lock-in:</strong> Difficult to use different technologies for different components</li>
            <li><strong>Deployment Risk:</strong> Changes require redeploying the entire application</li>
          </ul>
          
          <h3>Microservices Architecture</h3>
          <p><strong>Advantages:</strong></p>
          <ul>
            <li><strong>Independent Scalability:</strong> Each service can be scaled based on demand</li>
            <li><strong>Technology Flexibility:</strong> Different services can use different technologies</li>
            <li><strong>Resilience:</strong> Failures are isolated to individual services</li>
            <li><strong>Team Autonomy:</strong> Teams can work independently on different services</li>
          </ul>
          
          <p><strong>Disadvantages:</strong></p>
          <ul>
            <li><strong>Increased Latency:</strong> Network calls between services add latency</li>
            <li><strong>Operational Complexity:</strong> More moving parts to monitor and maintain</li>
            <li><strong>Distributed Transactions:</strong> Ensuring data consistency is challenging</li>
            <li><strong>Higher Resource Requirements:</strong> Each service has its own runtime overhead</li>
          </ul>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Main function
async function main() {
  try {
    console.log('=== BACKEND PERFORMANCE COMPARISON ===');
    console.log(`Test Duration: ${TEST_DURATION} seconds per endpoint`);
    console.log(`Concurrent Connections: ${CONNECTIONS}`);
    
    const monolithicResults = await runTest('Monolithic', MONOLITHIC_URL);
    const microservicesResults = await runTest('Microservices', MICROSERVICES_URL);
    
    generateAsciiChart(monolithicResults, microservicesResults);
    saveResults(monolithicResults, microservicesResults);
    
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Export functions for use in other modules
module.exports = {
  generateHtmlReport,
  runTest,
  generateAsciiChart,
  saveResults
};

// Run the main function if this script is executed directly
if (require.main === module) {
  main();
} 
