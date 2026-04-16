#!/bin/bash
# Simple script to trigger the auto-tracking cron job locally or against prod

ENV=${1:-"local"}
SECRET="airbook_super_secret_dev_key_12345"

if [ "$ENV" == "prod" ]; then
    URL="https://your-production-url.vercel.app/api/cron/track"
    # Prompt for prod secret if running against prod
    read -p "Enter PROD CRON_SECRET: " SECRET
else
    URL="http://localhost:3000/api/cron/track"
fi

echo "Triggering AirBook Cron Job at $URL..."
echo "This may take a few minutes as it spins up headless browsers."
echo ""

curl -s "$URL?key=$SECRET" | jq
