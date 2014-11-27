
/**
 * Modules dependencies
 */

var express = require('express');
var OAuth = require('wpcom-oauth');
var WPCom = require('wpcom');

/**
 * Application
 */

var app = express();

// public path
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/node_modules/wpcom/dist'));

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
    "redirect": "http://jsconfar.test:3000/connect"
  }
};

// Open athentication instance
var oauth = OAuth(wp_app);

// token
var token;

/**
 * Routes
 */

app.get('/', function (req, res) {

  if (token) {
    // create wpcom instance
    var wpcom = WPCom(token.access_token);

    // get posts list
    wpcom.site(token.blog_id)
    .get(function(err, blog){
      res.render('blog', { token: token, blog: blog });
    });
  } else {
    var url = oauth.urlToConnect();
    res.render('index', { url: url });
  }
});

// get code from WP.com response
app.get('/connect', function (req, res) {
  var code = req.query.code;

  // set oauth code ...
  oauth.code(code);

   // ... and negotiate by access token
   oauth.requestAccessToken(function(err, data){
     if (err && err.descrption) {
        return res.send(err.descrption);
     }

     // set access token in global var
     token = data;
     res.redirect('/');
   });
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
