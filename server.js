
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const dns = require('dns');
const shortId = require('shortid');
const app = express();

// A URL string is a structured string containing multiple meaningful components. When parsed, a URL object is returned containing properties for each of these components.
const url = require("url");

// Basic Configuration
const port = process.env.PORT || 3000;

// mongodb connection
mongoose.connect(process.env.MONGO_URI, { useNewURLParser: true, useUnifiedTopology: true });

const db_connection = mongoose.connection;

db_connection.once("open", () => {
  console.log("MongoDB connection successfully established");
});

// url post schema
const Schema = mongoose.Schema;
const urlSchema = new Schema({ "url": String, "shortUrl": String });
const Url = mongoose.model("Url", urlSchema);

// middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))
app.use('/public', express.static(`${process.cwd()}/public`));

const urlVerification = (req, res, next) => {
  let reqURL = req.body.url;
  console.log("urlVerificationMiddleware ===> ", reqURL);
  // Regex to validate url as and authentic url
  let urlRegex = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/;

  if (!urlRegex.test(reqURL)) {
    return res.json({ "error": "invalid URL" });
  };
  console.log("url from middleware", reqURL)

    const urlObject = url.parse(reqURL, true, true);
  // example of parsed url with node url: 
  // urlObject ====>>>> 
//   Url {
//   protocol: 'https:',
//   slashes: true,
//   auth: null,
//   host: 'boilerplate-project-urlshortener.robyoung1.repl.co',
//   port: null,
//   hostname: 'boilerplate-project-urlshortener.robyoung1.repl.co',
//   hash: null,
//   search: '?v=1639424115922',
//   query: [Object: null prototype] { v: '1639424115922' },
//   pathname: '/',
//   path: '/?v=1639424115922',
//   href: 'https://boilerplate-project-urlshortener.robyoung1.repl.co/?v=1639424115922'
// }
  console.log('urlObject ====>>>>', urlObject);  
  const hostname = urlObject.hostname;
  console.log("hostname ====>>>>", hostname);

  dns.lookup(hostname, (err) => {
    if (err) return res.json({ error: "invalid url" });
    next();
  });
};

// routes
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});


// Your first API endpoint

app.post('/api/shorturl', urlVerification, (req, res) => {
  console.log("app.post req.body.url ===>", req.body.url)
  Url.findOne({ url: req.body.url }, (err, model) => {
    if (err) return res.json({ error: "findOne error" });
    if (model) {
      res.json({ original_url: model.url, short_url: model.shortUrl });
    }
    else {
      new_model = new Url({ url: req.body.url, shortUrl: shortId.generate() });
      new_model.save((err, data) => {
        if (err) return res.json({ error: "save error" });
        res.json({ original_url: data.url, short_url: data.shortUrl });
      });
    };
  });
});

app.get('/api/shorturl/:shortUrl?', (req, res) => {
  var urlId = req.params.shortUrl;
  console.log("urlId from app.get", urlId)
  Url.findOne({ shortUrl: urlId }, (err, model) => {
    if (err || model == null) return res.json({ error: "invalid url" });
    res.redirect(model.url);
  });
});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);

});