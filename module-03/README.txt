# Setting up PHP locally

## Setting up dependencies

https://github.com/Homebrew/homebrew-php#installation

- `brew tap homebrew/dupes`  
- `brew tap homebrew/versions`  
- `brew tap homebrew/homebrew-php`  

## Installing a fresh PHP version

```
brew update
brew install php55
```

## Linux alternative

```
sudo add-apt-repository ppa:ondrej/php5
sudo apt-get update
sudo apt-get upgrade
sudo apt-get install php5
```

If necessary, install
```
sudo apt-get install python-software-properties
```

# Setting up MySQL

## OS X

```
brew install mysql
```

Run any commands suggested by homebrew

## Linux example
```
sudo apt-get install mysql-server
sudo apt-get install mysql-client
```

You might also need to start it separately.

```
sudo /etc/init.d/mysql start
```

# Setting up a local WordPress installation

Clone WordPress
```
mkdir jsconfar-workshop && cd jsconfar-workshop
git clone --depth 10 git@github.com:wordpress/wordpress.git
```

Setup a database

```
mysql -u root
CREATE DATABASE wp_test;
```

Start up server
```
cd wordpress
php -S localhost:3000
```

Open up WordPress in your browser to set up tables and in [http://localhost:3000](http://localhost:3000).

Fill in MySQL credentials:

Username: root
Password: [empty]

# Set up Socket.IO server

## Install Redis

```
brew install redis
```

Or something like this on linux:

If not installed do
```
sudo apt-get install build-essential
```

If not installed do
```
sudo apt-get install tcl8.5
```

Then install Redis itself:
```
wget http://download.redis.io/releases/redis-2.8.9.tar.gz
tar xzf redis-2.8.9.tar.gz
cd redis-2.8.9
make
make test
sudo make install
cd utils
sudo ./install_server.s
```

Then start the server with `sudo service redis_6379 start` (can be stopped later with `sudo service redis_6379` stop).

## Application skeleton

```
cd ~/jsconfar-workshop
mkdir socket.io-server && cd socket.io-server
touch package.json
npm install --save socket.io
npm install --save socket.io-redis
```

Writing to `index.js`:
```js
var http = require('http');
var sio = require('socket.io');
var redisAdapter = require('socket.io-redis');

var srv = http.createServer();
var io = sio(srv, { adapter: redisAdapter() });

srv.listen(3001, function() {
  console.log('Listening on port 3001');
});
```

# Set up a WordPress plugin that emits events

Set up composer

```
brew install composer
```

Or alternatively
```
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer
```

Set up the plugin project

```
cd wordpress/wp-content/plugins
mkdir realtime && cd realtime
```

Write a simple `composer.json` file:
```
{
    "require": {
        "rase/socket.io-emitter": "*"
    }
}
```

Install the dependency by running `composer install`.

Start a new PHP file (realtime.php`) with the following:

```php
<?php
require 'vendor/autoload.php';
?>
```

# Let's start coding

## Initializing Socket.IO emitter

```php
$emitter = new SocketIO\Emitter();
```

Hook into a post publishing action

```php
<?php
/**
 * Plugin Name: Realtime
 * Plugin URI: http://this-is-sparta.com
 * Description: A brief description of the plugin.
 * Version: 1.0.0
 * Author: rase-
 * Author URI: http://URI_Of_The_Plugin_Author.com
 * License: MIT
 */

require 'vendor/autoload.php';

class SocketConnection {
  public function __construct() {
    $this->emitter = new SocketIO\Emitter();
  }

  public function when_post_published($id, $post) {
    $this->emitter->emit('new post', array('id' => $id, 'post' => (array) $post));
  }
}

$connection = new SocketConnection();
add_action('publish_post', array($connection, 'when_post_published'), 10, 2);

?>
```

Open redis monitor to see that stuff is sent.

```
redis-cli monitor
```

Now let's publish a post. Fire up the PHP server, if it isn't running.

The output in redis monitor should look something like this:
![Redis output](https://cloudup.com/cUBGj60LY36+)

Let's add some code and look what we produce in Redis when we make a comment. Effectively the code now becomes:

```php
<?php
/**
 * Plugin Name: Realtime
 * Plugin URI: http://this-is-sparta.com
 * Description: A brief description of the plugin.
 * Version: 1.0.0
 * Author: rase-
 * Author URI: http://URI_Of_The_Plugin_Author.com
 * License: MIT
 */

require 'vendor/autoload.php';

class SocketConnection {
  public function __construct() {
    $this->emitter = new SocketIO\Emitter();
  }

  public function when_post_published($id, $post) {
    $this->emitter->emit('new post', array('id' => $id, 'post' => (array) $post));
  }

  public function when_post_commented($comment_id, $comment_obj) {
    $this->emitter->emit('new comment', array('id' => $comment_id, 'comment' => (array) $comment_obj));
  }
}

$connection = new SocketConnection();
add_action('publish_post', array($connection, 'when_post_published'), 10, 2);
add_action('wp_insert_comment', array($connection, 'when_post_commented'), 10, 2);

?>
```

The output in redis monitor should look something like this:
![Redis output](https://cloudup.com/csuQ5bmhKv9+)

## Let's make our socket.io server receive client connections.

First let's install the `debug` module.

```
npm install --save debug
```

The `index.js' file after edits:

```js
var http = require('http');
var debug = require('debug')('workshop');
var sio = require('socket.io');
var redisAdapter = require('socket.io-redis');

var srv = http.createServer();
var io = sio(srv, { adapter: redisAdapter() });

io.on('connection', function(socket) {
  debug('Socket connection established');

  socket.on('disconnect', function() {
    debug('Socket disconnected');
  });
});

srv.listen(3001, function() {
  console.log('Listening on port 3001');
});
``'

## Now let's get a really simple client going.
First we write really basic client code using the socket.io CDN into an `index.html` file:
```html
<html>
  <head>
  </head>
  <body>
    <h1>Hello world!</h1>
    <!-- scripts -->
    <script src="http://cdn.socket.io/socket.io-1.2.1.js"></script>
    <script>
      var socket = io('ws://localhost:3001');

      socket.on('new post', function(data) {
        console.log(data);
      });

      socket.on('new comment', function(data) {
        console.log(data);
      });
    </script>
  </body>
</html>
```

Now let's modify the server to serve the above HTML file.

```js
var http = require('http');
var fs = require('fs');
var debug = require('debug')('workshop');
var sio = require('socket.io');
var redisAdapter = require('socket.io-redis');

var srv = http.createServer(reqHandler);
var io = sio(srv, { adapter: redisAdapter() });

function reqHandler(req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(fs.readFileSync(__dirname + '/index.html', 'utf8'));
}

io.on('connection', function(socket) {
  debug('Socket connection established');

  socket.on('disconnect', function() {
    debug('Socket disconnected');
  });
});

srv.listen(3001, function() {
  console.log('Listening on port 3001');
});
```

Let's open this is our browser and verify that we get `console.log` prints that verify we are receiving data by opening up both the WordPress instance and the socket.io server. Then create a new post and comment on an existing post. You should see two objects pop up in the developer console.

## Let's add a view count to the WP plugin

Adding a new method to the plugin file:

```php
public function when_post_possibly_viewed() {
  if ( is_singular() ) {
    $id = get_the_ID();

    $meta = get_post_meta($id, 'real_time_views');
    $count = !empty($meta) ? (int) $meta[0] : 0;
    $count++;

    update_post_meta($id, 'real-time-views', $count);
    $this->emitter->emit('post view', array('id' => $id, 'count' => $count));
  }
}
```

The post meta get and update retrieve the current count that and the update persists the new count in the database. This way we always have up to date information about the number of counts.

And hooking this action into WordPress:

```php
add_action('template_redirect', array($connection, 'when_post_possibly_viewed'), 10, 0);
```

## Let's receive those views on the client

Adding another event listener to our `index.html` file:

```js
socket.on('post view', function(data) {
  console.log(data);
});
```

# Moving our stuff into the production site

Modify the `package.json` to include our dependencies:

```
<     "wpcom": "2.6.0",
<     "debug": "^2.1.0",
<     "socket.io": "^1.2.1",
<     "socket.io-redis": "^0.1.4"
< 
---
>     "wpcom": "2.6.0"
```

Then let's move our code from the `index.js` file we created. Here is the diff:

```
< var debug = require('debug')('jsconf-workshop');
27,30d25
< // Initialize socket.io
< var server = require('http').Server(app);
< var io = require('socket.io')(server, { adapter: require('socket.io-redis')() } );
< 
89,98c84
< io.on('connection', function(socket) {
<   debug('Socket connection established');
< 
<   socket.on('disconnect', function() {
<     debug('Socket disconnected');
<   });
< });
< 
< 
< server.listen(3000, function () {
---
> var server = app.listen(3000, function () {
```

Now let's add the client-side event listeners we had to `public/main.js`, but notice we are changing the port to 3000:
```
var socket = io('ws://localhost:3000');
socket.on('new post', function(data) {
  console.log(data);
});

socket.on('new comment', function(data) {
  console.log(data);
});

socket.on('post view', function(data) {
  console.log(data);
});
```

We also need to add the socket.io script to our view in `views/blog.jade`, making the bottom part look like this:

```
script(src="http://cdn.socket.io/socket.io-1.2.1.js")
script(src="main.js")
```

## Implementing the action listeners
TODO

# Deploying

