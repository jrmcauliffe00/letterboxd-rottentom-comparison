const fs = require('fs');
const Papa = require('papaparse');

// Get username from CLI
const USERNAME = process.argv[2];

if (!USERNAME) {
  console.error('❌ Please provide your Letterboxd username as a CLI argument.');
  process.exit(1);
}

// Load files
const matched = JSON.parse(fs.readFileSync('rotten_tom_films.json', 'utf8'));
const personalData = JSON.parse(fs.readFileSync('films.json', 'utf8'));
const personalRatings = personalData.films;

// Map: title -> rating
const ratingMap = new Map(personalRatings.map(film => [film.title, film.rating]));

// Merge, filter out invalid scores
let merged = matched
  .filter(movie => movie.critic_score > 0 && movie.audience_score > 0)
  .map(movie => ({
    title: movie.title,
    url: movie.url,
    release_date: movie.release_date,
    critic_score: movie.critic_score,
    audience_score: movie.audience_score,
    [`${USERNAME}_rating`]: ratingMap.get(movie.title) ?? ''
  }));

// Deduplicate by title (keep first)
const seenTitles = new Set();
merged = merged.filter(movie => {
  if (seenTitles.has(movie.title)) return false;
  seenTitles.add(movie.title);
  return true;
});

// ✅ Convert to 0–100 scale
merged = merged.map(row => {
    const key = `${USERNAME}_rating`;
    const rating = row[key];
    row[key] = typeof rating === 'number' ? rating * 20 : '';
    return row;
  });

// Convert to CSV and write
const csv = Papa.unparse(merged);
fs.writeFileSync('output.csv', csv, 'utf8');
console.log(`✅ Wrote output.csv with ${USERNAME}_rating, filtered for valid scores and no duplicates.`);
