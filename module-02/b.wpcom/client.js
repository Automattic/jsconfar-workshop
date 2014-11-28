
/**
 * JSCONFAR application
 */

var wpcom = require('wpcom');
var request = require('superagent');

request
.get('/token')
.end(function(res){
  if (!res.ok) {
    return console.error(res.text);
  }

  if (res.status == 404) {
    return console.error('token is not defined');
  }

  var token = res.text;
  console.log('-> token -> ', token);
});
