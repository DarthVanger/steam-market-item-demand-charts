#!/bin/bash
dirname="$(dirname "$0")"
log="$dirname"/crawl_log.txt
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Crawling data from Steam website" >> "$log"
/home/ec2-user/.nvm/versions/node/v14.9.0/bin/node "$dirname"/../crawlAndSave.js >> "$log" 2>&1
