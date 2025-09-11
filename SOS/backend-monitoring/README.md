# Backend Monitoring

A simple tool to compare the performance of Monolithic vs. Microservices backend architectures using load testing.

## Prerequisites

*   Node.js and npm
*   A Monolithic backend running on `http://localhost:4000`
*   A Microservices API Gateway running on `http://localhost:5000`

## Installation

```bash
npm install --legacy-peer-deps
```

## Usage

### 1. Run Performance Tests

This executes the load tests defined in `load-test.js` against both backend architectures, measures throughput, latency, and cold start time, and generates reports in the `results/` directory.

```bash
npm test
```
or
```bash
node load-test.js
```

### 2. Start Monitoring Dashboard

This starts a simple web server (on `http://localhost:5000` by default, check `monitor.js`) that allows you to:
*   View the latest generated HTML report (`results/report.html`).
*   Trigger a new performance test run via a button.

```bash
npm start
```
or
```bash
node monitor.js
```

## Key Files

*   `load-test.js`: Runs performance tests using Autocannon, gathers metrics, and generates reports.
*   `monitor.js`: Express server to display the HTML report and provide a trigger for running tests.
*   `results/`: Contains the generated `results.json` and `report.html` (renamed from `Monitoring_Report.html` in the provided example, based on `load-test.js` output).
*   `direct-register-test.js`: A separate script to directly test user registration endpoints (run with `node direct-register-test.js`).
