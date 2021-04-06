'use strict';

// Application Dependencies

const express = require('express');
const superagent = require('superagent');
const cors=require('cors');
const pg=require('pg');
require('dotenv').config();


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
app.get('/', getBooks); 
app.get('/searches/new', showForm);
app.post('/books',createBook);
app.post('/searches', createSearch);
app.get('/books/:id', getOneBook);
app.get('*', (request, response) => response.status(404).send('This route does not exist'));


// Constructor
function Book(info) {
  const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';

  this.title = info.title || 'No title available';
  this.author=info.authors;
  this.isbn=info.industryIdentifiers ? info.industryIdentifiers[0].identifier: 'No isbn';
  this.description=info.description;
  this.image_url=info.imageLinks ? info.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';

}
function getBooks(request, response) {
  let SQL = 'SELECT * FROM book;';

  return client.query(SQL)
    .then(results => {
      if (results.rows.rowCount === 0) {
        response.render('pages/searches/search');
      } else {
        response.render('pages/index', { books: results.rows })
      }
    })
    .catch(() => response.status(500).render('pages/error'), {err: 'oops'}); 
}


function getOneBook(request, response) {
  const id= request.params.id;
  const myReq='SELECT * FROM book WHERE id=$1 ;'
  const idValue= [id];
   client.query(myReq,idValue)
    .then(result => {
      console.log(result.rows[0]);
      response.render('pages/books/detail', { book: result.rows[0]})
    })
    .catch(() => response.status(500).render('pages/error'), {err: 'oops'});
}






// Note that .ejs file extension is not required

function createBook(request, response) {
  let { title, author, isbn, image_url, description} = request.body;
  let SQL = 'INSERT INTO book(title, author, isbn, description, image_url) VALUES($1, $2, $3, $4, $5) RETURNING id;';
  let values = [title, author, isbn, description, image_url];

   client.query(SQL, values)
    .then (results => {
     // console.log(results.rows[0]);
      response.redirect(`/books/${results.rows[0].id}` )})
    .catch(() => response.status(500).render('pages/error'), {err: 'oops'});
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
    console.log(results);
    response.render('pages/searches/show', { searchResults: results })
  });
}



client.connect().then(() =>
  app.listen(PORT, () => console.log(`Listening on port: ${PORT}`))
);