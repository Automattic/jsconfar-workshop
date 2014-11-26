
/**
 * Modules dependencies
 */

var express = require('express');
var app = express();

// public path
app.use(express.static(__dirname + '/public'));

// jade templates folder
app.set('views', __dirname + '/views');

// set jade rendering engine
app.set('view engine', 'jade');

app.get('/', function (req, res) {
  res.render('index');
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
