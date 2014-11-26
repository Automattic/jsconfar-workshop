
/**
 * Modules dependencies
 */

var express = require('express');
var OAuth = require('wpcom-oauth');

/**
 * Application
 */

var app = express();

// public path
app.use(express.static(__dirname + '/public'));

// jade templates folder
app.set('views', __dirname + '/views');

// set jade rendering engine
app.set('view engine', 'jade');


/**
 * WP.com app settings
 */

var wp_app = {
  "client_id": "38002",
  "client_secret": "jNzfpqPY8tUPKK2oQQRvCvWpzAowIY3O2TadIHRkmx47Kbe0pfo7Jb4FKNbKjKh8",
  "url":  {
    "redirect": "https://jsconfar.test/connect"
  }
};

// Open athentication instance
var oauth = OAuth(wp_app);

/**
 * Routes
 */

app.get('/', function (req, res) {
  res.render('index');
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
