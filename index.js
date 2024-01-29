require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient } = require('mongodb');
const urlparser = require('url');
const dns = require('dns');

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
const db = client.db('urlshortner');
const urls = db.collection('urls');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(express.urlencoded({ extended: true }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
  const dnslookup = dns.lookup(urlparser.parse(req.body.url).hostname, async (err,address) => {
    if (!address) {
      res.json({ error: 'invalid url' });
    } else {
      const urlCount = await urls.countDocuments({})
      const urlDoc = {
        url: req.body.url,
        short_url: urlCount
      }
      const result = await urls.insertOne(urlDoc);
      console.log(result);
      res.json({original_url: req.body.url, short_url: urlCount});
    }
    
  })
});

app.get('/api/shorturl/:short_url', async function(req, res) {
  const urlDoc = await urls.findOne({short_url: +req.params.short_url});
  if (urlDoc) {
    res.redirect(urlDoc.url);
  } else {
    res.json({ error: 'invalid url' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
