const { execSync } = require('child_process');

const USERNAME = process.argv[2];

if (!USERNAME) {
  console.error('❌ Please provide your Letterboxd username.');
  process.exit(1);
}

try {
  console.log(`📥 Step 1: Fetching ratings for user "${USERNAME}"...`);
  execSync(`node letterboxd.js ${USERNAME}`, { stdio: 'inherit' });

  console.log('🍅 Step 2: Matching against Rotten Tomatoes data...');
  execSync(`node movies_query.js`, { stdio: 'inherit' });

  console.log('📊 Step 3: Writing final matched CSV...');
  execSync(`node write_matched_csv.js ${USERNAME}`, { stdio: 'inherit' });

  console.log(`✅ All done! Your final CSV is ready as output.csv`);
} catch (error) {
  console.error('❌ Workflow failed:', error.message);
}
