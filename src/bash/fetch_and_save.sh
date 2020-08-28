#!/bin/bash
dirname="$(dirname "$0")"
log="$dirname"/log.txt
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Fetching data from Steam API" >> "$log"
/home/ec2-user/.nvm/versions/node/v14.9.0/bin/node "$dirname"/../fetchAndSave.js >> "$log" 2>&1
