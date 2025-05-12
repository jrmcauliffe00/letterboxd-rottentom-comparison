const fs = require('fs');
const Papa = require('papaparse');
const initSqlJs = require('sql.js');

// Load JSON file of your rated movies
const personalRatings = JSON.parse(fs.readFileSync('./films.json', 'utf8'));
const myTitles = new Set(personalRatings.films.map(film => film.title));
console.log('titles of the stuff: ', myTitles)

// Load and parse CSV file
const csvData = fs.readFileSync('./movie_info.csv', 'utf8');
const parsed = Papa.parse(csvData, {
  header: true,
  skipEmptyLines: true
});

(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  // Create table and insert rows
  db.run(`
    CREATE TABLE movies (
      title TEXT,
      url TEXT,
      release_date TEXT,
      critic_score INTEGER,
      audience_score INTEGER
    );
  `);

  const stmt = db.prepare(`
    INSERT INTO movies (title, url, release_date, critic_score, audience_score)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const row of parsed.data) {
    stmt.run([
      row.title,
      row.url,
      row.release_date,
      parseInt(row.critic_score || 0),
      parseInt(row.audience_score || 0)
    ]);
  }
  stmt.free();

  // Query only your movies
  const placeholders = Array.from(myTitles).map(() => '?').join(',');
  const query = `SELECT * FROM movies WHERE title IN (${placeholders})`;
  const result = db.exec(query, Array.from(myTitles));

  // Output result
  if (result.length > 0) {
    const rows = result[0].values;
    const headers = result[0].columns;
    const data = rows.map(row =>
      Object.fromEntries(row.map((val, i) => [headers[i], val]))
    );

    fs.writeFileSync('rotten_tom_films.json', JSON.stringify(data, null, 2))
  } else {
    console.log('No matching movies found.');
  }

  db.close();
})();
