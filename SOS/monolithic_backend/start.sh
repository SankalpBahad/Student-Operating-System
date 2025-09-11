#!/bin/bash
echo "Starting Monolithic Backend..."
cd "$(dirname "$0")"
npm install
npm run dev 