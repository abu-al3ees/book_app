DROP TABLE IF EXISTS book;
CREATE TABLE book ( 
 id SERIAL PRIMARY KEY,
 title VARCHAR(255),
 author VARCHAR(255),
 isbn VARCHAR(255),
 description TEXT,
 image_url VARCHAR(255)
);