#!/bin/bash

# Install dependencies
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Create results directory if it doesn't exist
mkdir -p results

# Start the monitoring dashboard
echo "Starting monitoring dashboard..."
node monitor.js 