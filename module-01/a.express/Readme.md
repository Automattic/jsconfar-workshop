### Module 01

# [c] Web server with express.js


### 1 - Install `node`

Go to http://nodejs.org/ and install node.

### 2 - Create `package.json` via `npm init`

### 3 - Add `express.js` dependency

### 4 - Write a web server using express

```
var express = require( 'express' );
var app = express();

app.get( '/', function ( req, res ) {
  res.send( 'Hello World!' );
} );

var server = app.listen( 3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log( 'Example app listening at http://%s:%s', host, port );
} );
```