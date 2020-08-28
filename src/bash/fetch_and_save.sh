#!/bin/bash

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Fetching data from Steam API" >> log.txt
node ../fetchAndSave.js >> log.txt 2>&1
