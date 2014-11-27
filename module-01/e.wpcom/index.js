
/**
 * Modules dependencies
 */

var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var OAuth = require('wpcom-oauth');
var wpcom = require('wpcom');

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

// session
app.use(cookieParser('jsconfar'));
app.use(session());

/**
 * WP app settings
 */

var wp_app = {
  "client_id": "38002",
  "client_secret": "jNzfpqPY8tUPKK2oQQRvCvWpzAowIY3O2TadIHRkmx47Kbe0pfo7Jb4FKNbKjKh8",
  "url":  {
    "redirect": "http://jsconfar.test:3000/connect"
  }
};

// Open athentication instance
var oauth = OAuth(wp_app);

// Main route
app.get('/', function (req, res) {
  var url = oauth.urlToConnect();
  res.render('index', { url: url, logged: !!req.session.token });
});

// Get code to WP.com
app.get('/connect', function (req, res) {
  var code = req.query.code;

  // set oauth code ...
  oauth.code(code);

  // ... and negotiate by access token
  oauth.requestAccessToken(function(err, data){
   if (err && err.descrption) {
      return res.send(err.descrption);
   }

   // store token in current user session
   req.session.token = data.access_token;

   res.redirect('/');
  });
});

// Start web server
var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
