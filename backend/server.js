const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const { Model } = require('objection');
const Knex = require('knex');
const path = require('path');

const knex = Knex({
  client: 'sqlite3',
  connection: {
    filename: './database/db.sqlite',
  },
  useNullAsDefault: true,
});

Model.knex(knex);

const server = express();
const port = 5100;
server.use(cors());
server.use(express.json());
server.use('/images', express.static(path.join(__dirname, 'tmp')));
const db = new sqlite3.Database('./database/db.sqlite', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to SQLite database');
    }
});

server.use("/auth", require("./routes/auth"));
server.use("/products", require("./routes/products"));
server.use("/orders", require("./routes/orders"));
server.use("/category", require("./routes/category"));
server.use("/tax", require("./routes/tax"));
server.use("/pos", require("./routes/pos"));
server.use("/notes", require("./routes/notes"));
server.use("/config", require("./routes/config"));

server.get("/", (r, res) => res.send("Hello abhishek!"));

server.listen(port);