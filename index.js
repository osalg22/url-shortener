var express = require("express");
var shortid = require("shortid");
var path = require("path");
var validUrl = require("valid-url");
var mongo = require("mongodb").MongoClient;
var dburl = process.env.MONGOLAB_URI;

var app = express();

app.set('port', (process.env.PORT || 8080));


app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/public/index.html'));
})

app.get('/new/*', function(req, res) { // input is url, response should be shortened url
    var longUrl = req.params[0];
    // url is legit
    if (validUrl.isUri(longUrl)) {
        console.log('thats a url');
        // new document with original url and shortened url
        var shorty = shortid.generate();
        // document
        var doc = {
            oldURL: longUrl,
            short: shorty
        };
        // testing ///////////////
        //console.log("Old url:" + longUrl);
        //console.log("New url:" + shorty);
        ////////////////////////
        
        mongo.connect(dburl, function(err, db) {
          if (err) return console.log("DB Connect error");
           
          db.collection('websites').insert(doc, function(err, result) {
              if (err) return console.log("Document insert error");
               
             res.json({
                 "original_url": longUrl,
                 "short_url": "https://" + req.hostname + "/" + shorty
             });
             db.close();
          });
        });
    }
    // wasn't a url
    else {
        res.json({"error": "That was not in a url format. Please re-check the url you are trying to shorten."});
    }
    
});

app.get('/:id', function (req, res) { // input is shortened url, should redirectto orig. website
    var shorty = req.params.id;
    //console.log(shorty);
    if (shorty != 'favicon.ico') { // this was causing issues so I am ignoring the favicon request for now
        mongo.connect(dburl, function(err, db) {
          if (err) return console.log("error connecting to DB");
           
          db.collection('websites').find({ short: shorty}).toArray(function(err, docs) {
              if (err) return console.log("error finding document");
              if (docs.length == 0) res.json({"error": "That url was not in the database."});
              else res.redirect(docs[0]['oldURL']);
              db.close();
          });
        });
    }
});


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
