const fs = require('fs')
const fetch = require('node-fetch')
const { parse } = require('node-html-parser')

const OUTPUT_FILE = 'films.json'

if (process.argv.length < 3) {
  console.error('Error: Please provide a username.')
  process.exit(1)
}

const USERNAME = process.argv[2]
const URL = `https://letterboxd.com/${USERNAME}/films/diary/page/`

async function fetchPage(pageNumber) {
  const response = await fetch(URL + pageNumber)
  const text = await response.text()
  return parse(text)
}

async function getTotalPages(root) {
  const pagination = root.querySelector('.paginate-pages')
  if (!pagination) return 1

  const lastPageLink = pagination.querySelectorAll('li a').pop()
  return lastPageLink ? parseInt(lastPageLink.innerText.trim(), 10) : 1
}

async function scrapeFilms() {
  const root = await fetchPage(1)
  const totalPages = await getTotalPages(root)
  const films = []

  for (let i = 1; i <= totalPages; i++) {
    const pageRoot = await fetchPage(i)
    const filmEntries = pageRoot.querySelectorAll('.diary-entry-row')
    // console.log('here is the filmentries: ', filmEntries[0]) //.querySelector('.edit-review-button'))


    filmEntries.forEach(entry => {
      const $metadata = entry.querySelector('.edit-review-button')
      const $actions = entry.querySelector('.film-actions')
      const $ratingField = entry.querySelector('.rateit-field')
    
      const permalink = $actions?.getAttribute('data-film-slug') || 'unknown'
      const filmTitle = $actions?.getAttribute('data-film-name') || 'Untitled'
      // const watchedOn = $metadata?.getAttribute('data-viewing-date') || 'unknown'
      const rewatched = $metadata?.getAttribute('data-rewatch') === 'true'
    
      const year = entry.querySelector('.td-released span')?.textContent?.trim() || 'unknown'
      const title = `${filmTitle}`
    
      const ratingRaw = $ratingField?.getAttribute('value')
      const rating = ratingRaw ? parseInt(ratingRaw, 10) / 2 : null
    
      console.log(`${title} - ${rating ?? 'No'} stars`)
      films.push({ title, rating, rewatched, permalink })
    })
  }

  return films
}

scrapeFilms().then(films => {
  const updated_at = new Date().toISOString().split('T')[0] 
  const outputData = {
    updated_at,
    count: films.length,
    films
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2))

  console.log(`Total films: ${films.length}`)
}).catch(error => {
  console.error('Error scraping films:', error)
})
