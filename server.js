'use strict';

// Application Dependencies
//require("dotenv").config();
const express = require('express');
const superagent = require('superagent');
const cors=require('cors');
const pg=require('pg');


// Application Setup
const app = express();
const PORT = process.env.PORT || 3000;

// Application Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('./public'));
app.use(cors());

const client=new pg.Client(process.env.DATABASE_URL);
// Set the view engine for server-side templating
app.set('view engine', 'ejs');

// API Routes
// Renders the home page
app.get('/', renderHomePage);

// Renders the search form
app.get('/searches/new', showForm);

// Creates a new search to the Google Books API
app.post('/searches', createSearch);

// Catch-all
app.get('*', (request, response) => response.status(404).send('This route does not exist'));

//app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));

// Constructor
function Book(info) {
  const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';

  this.title = info.title || 'No title available';
  this.authors=info.authors;
  this.description=info.description;
  this.image=info.imageLinks ? info.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';

}

// Note that .ejs file extension is not required

function renderHomePage(request, response) {
  response.render('pages/index');
}

function showForm(request, response) {
  response.render('pages/searches/new.ejs');
}

// No API key required
// Console.log request.body and request.body.search
function createSearch(request, response) {
  let url = 'https://www.googleapis.com/books/v1/volumes';
  // add the search query to the URL
  console.log(request.body);
  const searchBy = request.body.searchBy;
  const searchValue = request.body.search;
  const queryObj = {};
  if (searchBy === 'title') {
    queryObj['q'] = `+intitle:${searchValue}`;

  } else if (searchBy === 'author') {
    queryObj['q'] = `+inauthor:${searchValue}`;
  }
  // console.log(queryObj);
  // send the URL to the servers API
  superagent.get(url).query(queryObj).then(apiResponse => {
    return apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo))
  }).then(results => {
    response.render('pages/searches/show', { searchResults: results })
  });
}



client.connect().then(() =>
  app.listen(PORT, () => console.log(`Listening on port: ${PORT}`))
);