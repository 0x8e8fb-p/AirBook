const { Client } = require('pg');

const regions = [
  'ap-south-1',
  'ap-southeast-1',
  'us-east-1',
  'eu-central-1',
  'us-west-1',
  'us-west-2',
  'eu-west-1',
  'eu-west-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'sa-east-1',
  'ca-central-1'
];

async function testRegions() {
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    const client = new Client({
      host: host,
      port: 6543,
      user: 'postgres.vffwryvhyworvkrkagvc',
      password: 'AirBookQwerty@997',
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 3000 // 3 seconds timeout
    });

    console.log(`Testing ${host}...`);
    try {
      await client.connect();
      console.log(`SUCCESS! Connected to ${host}`);
      await client.end();
      return host;
    } catch (err) {
      console.log(`Failed on ${host}: ${err.message}`);
    }
  }
  console.log("None of the regions worked.");
}

testRegions();