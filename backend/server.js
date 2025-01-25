const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const { Model } = require('objection');
const Knex = require('knex');
const path = require('path');
const escpos = require('escpos');
escpos.USB = require('escpos-usb');

const device = new escpos.USB();

const printer = new escpos.Printer(device);

device.open((error) => {
  if (error) {
    console.error('Error opening the USB device:', error);
  } else {
    printer
      .text('Hello ESC/POS Printer!')
      .cut()
      .close();
  }
});

const knex = Knex({
  client: 'sqlite3',
  connection: {
    filename: './database/db.sqlite',
  },
  useNullAsDefault: true,
});

Model.knex(knex);

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'tmp')));

const db = new sqlite3.Database('./database/db.sqlite', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to SQLite database');
    }
});

app.use("/auth", require("./routes/auth"));
app.use("/products", require("./routes/products"));
app.use("/orders", require("./routes/orders"));
app.use("/category", require("./routes/category"));
app.use("/tax", require("./routes/tax"));
app.use("/pos", require("./routes/pos"));
app.use("/notes", require("./routes/notes"));
app.use("/config", require("./routes/config"));

app.get("/", (r, res) => res.send("Hello abhishek!"));

app.get('print', async(req,res) => {
    const print = printer.USB()
    console.log(print);
})

// const printer = new escpos.Printer('USB001');
app.listen(port);