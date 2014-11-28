(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

/**
 * JSCONFAR application
 */

var wpcom = require('wpcom');

},{"wpcom":24}],2:[function(require,module,exports){

},{}],3:[function(require,module,exports){

/**
 * Module dependencies.
 */

var Me = require('./lib/me');
var Site = require('./lib/site');
var Batch = require('./lib/batch');
var debug = require('debug')('wpcom');

/**
 * WordPress.com REST API class.
 *
 * @api public
 */

function WPCOM(request){
  if (!(this instanceof WPCOM)) return new WPCOM(request);
  if ('function' !== typeof request) {
    throw new TypeError('a `request` WP.com function must be passed in');
  }

  this.request = request;
}

/**
 * Get `Me` object instance
 *
 * @api public
 */

WPCOM.prototype.me = function(){
  return new Me(this);
};

/**
 * Get `Site` object instance
 *
 * @param {String} id
 * @api public
 */

WPCOM.prototype.site = function(id){
  return new Site(id, this);
};


WPCOM.prototype.batch = function(){
  return new Batch(this);
};

/**
 * List Freshly Pressed Posts
 *
 * @param {Object} [query]
 * @param {Function} fn callback function
 * @api public
 */

WPCOM.prototype.freshlyPressed = function(query, fn){
  return this.sendRequest('/freshly-pressed', query, null, fn);
};

/**
 * Request to WordPress REST API
 *
 * @param {String|Object} params
 * @param {Object} [query]
 * @param {Object} [body]
 * @param {Function} fn
 * @api private
 */

WPCOM.prototype.sendRequest = function (params, query, body, fn){
  // `params` can be just the path (String)
  if ('string' == typeof params) {
    params = { path: params };
  }

  debug('sendRequest(%o)', params.path);

  // set `method` request param
  params.method = (params.method || 'get').toUpperCase();

  // `query` is optional
  if ('function' == typeof query) {
    fn = query;
    query = null;
  }

  // `body` is optional
  if ('function' == typeof body) {
    fn = body;
    body = null;
  }

  // pass `query` and/or `body` to request params
  if (query) {
    params.query = query;
    delete query.apiVersion;
  }

  if (body) params.body = body;

  // callback `fn` function is optional
  if (!fn) fn = function(err){ if (err) throw err; };

  // request method
  return this.request(params, fn);
};

/**
 * Expose `WPCOM` module
 */

module.exports = WPCOM;

},{"./lib/batch":4,"./lib/me":10,"./lib/site":14,"debug":16}],4:[function(require,module,exports){

/**
 * Module dependencies.
 */

var debug = require('debug')('wpcom:batch');

/**
 * Create a `Batch` instance
 *
 * @param {WPCOM} wpcom
 * @api public
 */

function Batch(wpcom){
  if (!(this instanceof Batch)) return new Batch(wpcom);
  this.wpcom = wpcom;

  this.urls = [];
}

/**
 * Add url to batch requests
 *
 * @param {String} url
 * @api public
 */

Batch.prototype.add = function(url){
  this.urls.push(url);
  return this;
};

/**
 * Run the batch request
 *
 * @param {Object} [query]
 * @param {Function} fn
 * @api public
 */

Batch.prototype.run = function(query, fn){
  // add urls to query object
  if ('function' == typeof query) {
    fn = query;
    query = {};
  }
  query.urls = this.urls;

  return this.wpcom.sendRequest('/batch', query, null, fn);
};

/**
 * Expose `Batch` module
 */

module.exports = Batch;

},{"debug":16}],5:[function(require,module,exports){

/**
 * Module dependencies.
 */

var debug = require('debug')('wpcom:category');

/**
 * Category methods
 *
 * @param {String} [slug]
 * @param {String} sid site id
 * @param {WPCOM} wpcom
 * @api public
 */

function Category(slug, sid, wpcom){
  if (!sid) {
    throw new Error('`side id` is not correctly defined');
  }

  if (!(this instanceof Category)) return new Category(slug, sid, wpcom);

  this.wpcom = wpcom;
  this._sid = sid;
  this._slug = slug;
}

/**
 * Set category `slug`
 *
 * @param {String} slug
 * @api public
 */

Category.prototype.slug = function(slug){
  this._slug = slug;
};

/**
 * Get category
 *
 * @param {Object} [query]
 * @param {Function} fn
 * @api public
 */

Category.prototype.get = function(query, fn){
  var path = '/sites/' + this._sid + '/categories/slug:' + this._slug;
  return this.wpcom.sendRequest(path, query, null, fn);
};

/**
 * Add category
 *
 * @param {Object} body
 * @param {Function} fn
 * @api public
 */

Category.prototype.add = function(body, fn){
  var path = '/sites/' + this._sid + '/categories/new';
  return this.wpcom.sendRequest({ path: path, method: 'post' }, null, body, fn);
};

/**
 * Edit category
 *
 * @param {Object} body
 * @param {Function} fn
 * @api public
 */

Category.prototype.update = function(body, fn){
  var path = '/sites/' + this._sid + '/categories/slug:' + this._slug;
  return this.wpcom.sendRequest({ path: path, method: 'post' }, null, body, fn);
};

/**
 * Delete category
 *
 * @param {Function} fn
 * @api public
 */

Category.prototype['delete'] =
Category.prototype.del = function(fn){
  var path = '/sites/' + this._sid + '/categories/slug:' + this._slug + '/delete';
  return this.wpcom.sendRequest({ path: path, method: 'post' }, null, null, fn);
};

/**
 * Expose `Category` module
 */

module.exports = Category;

},{"debug":16}],6:[function(require,module,exports){

/**
 * Module dependencies.
 */

var CommentLike = require('./commentlike');
var debug = require('debug')('wpcom:comment');

/**
 * Comment methods
 *
 * @param {String} [cid] comment id
 * @param {String} [pid] post id
 * @param {String} sid site id
 * @param {WPCOM} wpcom
 * @api public
 */

function Comment(cid, pid, sid, wpcom){
  if (!sid) {
    throw new Error('`side id` is not correctly defined');
  }

  if (!(this instanceof Comment)) return new Comment(cid, pid, sid, wpcom);

  this.wpcom = wpcom;
  this._cid = cid;
  this._pid = pid;
  this._sid = sid;
}

/**
 * Return a single Comment
 *
 * @param {Object} [query]
 * @param {Function} fn
 * @api public
 */

Comment.prototype.get = function(query, fn){
  var path = '/sites/' + this._sid + '/comments/' + this._cid;
  return this.wpcom.sendRequest(path, query, null, fn);
};

/**
 * Return recent comments for a post
 *
 * @param {Object} [query]
 * @param {Function} fn
 * @api public
 */

Comment.prototype.replies = function(query, fn){
  var path = '/sites/' + this._sid + '/posts/' + this._pid + '/replies/';
  return this.wpcom.sendRequest(path, query, null, fn);
};

/**
 * Create a comment on a post
 *
 * @param {String|Object} body
 * @param {Function} fn
 * @api public
 */

Comment.prototype.add = function(body, fn){
  body = 'string' == typeof body ? { content: body } : body;

  var path = '/sites/' + this._sid + '/posts/' + this._pid + '/replies/new';
  return this.wpcom.sendRequest({ path: path, method: 'post' }, null, body, fn);
};

/**
 * Edit a comment
 *
 r @param {String|Object} body
 * @param {Function} fn
 * @api public
 */

Comment.prototype.update = function(body, fn){
  body = 'string' == typeof body ? { content: body } : body;

  var path = '/sites/' + this._sid + '/comments/' + this._cid;
  return this.wpcom.sendRequest({ path: path, method: 'post' }, null, body, fn);
};

/**
 * Create a Comment as a reply to another Comment
 *
 * @param {String|Object} body
 * @param {Function} fn
 * @api public
 */

Comment.prototype.reply = function(body, fn){
  body = 'string' == typeof body ? { content: body } : body;

  var path = '/sites/' + this._sid + '/comments/' + this._cid + '/replies/new';
  return this.wpcom.sendRequest({ path: path, method: 'post' }, null, body, fn);
};

/**
 * Delete a comment
 *
 * @param {Function} fn
 * @api public
 */

Comment.prototype['delete'] =
Comment.prototype.del = function(fn){
  var path = '/sites/' + this._sid + '/comments/' + this._cid + '/delete';
  return this.wpcom.sendRequest({ path: path, method: 'post' }, null, null, fn);
};

/**
 * Create a `CommentLike` instance
 *
 * @api public
 */

Comment.prototype.like = function(){
  return CommentLike(this._cid, this._sid, this.wpcom);
};

/**
 * Get comment likes list
 *
 * @param {Object} [query]
 * @param {Function} fn
 * @api public
 */

Comment.prototype.likesList = function(query, fn){
  var path = '/sites/' + this._sid + '/comments/' + this._cid + '/likes';
  return this.wpcom.sendRequest(path, query, null, fn);
};

/**
 * Expose `Comment` module
 */

module.exports = Comment;

},{"./commentlike":7,"debug":16}],7:[function(require,module,exports){

/**
 * Module dependencies.
 */

var debug = require('debug')('wpcom:commentlike');

/**
 * CommentLike methods
 *
 * @param {String} cid comment id
 * @param {String} sid site id
 * @param {WPCOM} wpcom
 * @api public
 */

function CommentLike(cid, sid, wpcom){
  if (!sid) {
    throw new Error('`side id` is not correctly defined');
  }

  if (!cid) {
    throw new Error('`comment id` is not correctly defined');
  }

  if (!(this instanceof CommentLike)) return new CommentLike(cid, sid, wpcom);

  this.wpcom = wpcom;
  this._cid = cid;
  this._sid = sid;
}

/**
 * Get your Like status for a Comment
 *
 * @param {Object} [query]
 * @param {Function} fn
 * @api public
 */

CommentLike.prototype.state =
CommentLike.prototype.mine = function(query, fn){
  var path = '/sites/' + this._sid + '/comments/' + this._cid + '/likes/mine';
  return this.wpcom.sendRequest(path, query, null, fn);
};

/**
 * Like a comment
 *
 * @param {Object} [query]
 * @param {Function} fn
 * @api public
 */

CommentLike.prototype.add = function(query, fn){
  var path = '/sites/' + this._sid + '/comments/' + this._cid + '/likes/new';
  return this.wpcom.sendRequest({ path: path, method: 'post' }, query, null, fn);
};

/**
 * Remove your Like from a Comment
 *
 * @param {Function} fn
 * @api public
 */

CommentLike.prototype['delete'] =
CommentLike.prototype.del = function(fn){
  var path = '/sites/' + this._sid + '/comments/' + this._cid + '/likes/mine/delete';
  return this.wpcom.sendRequest({ path: path, method: 'post' }, null, null, fn);
};

/**
 * Expose `CommentLike` module
 */

module.exports = CommentLike;

},{"debug":16}],8:[function(require,module,exports){

/**
 * Module dependencies.
 */

var debug = require('debug')('wpcom:follow');

/**
 * Follow 
 *
 * @param {String} site_id - site id
 * @param {WPCOM} wpcom
 * @api public
 */

function Follow(site_id, wpcom){
  if (!site_id) {
    throw new Error('`site id` is not correctly defined');
  }

  if (!(this instanceof Follow)) return new Follow(site_id, wpcom);

  this.wpcom = wpcom;
  this._sid = site_id;
}

/**
 * Follow the site
 *
 * @param {Object} [query]
 * @param {Function} fn
 */

Follow.prototype.follow =
Follow.prototype.add = function(query, fn) {
  var path = '/sites/' + this._sid + '/follows/new';
  return this.wpcom.sendRequest({ method: 'POST', path: path }, query, null, fn);
};

/**
 * Unfollow the site
 *
 * @param {Object} [query]
 * @param {Function} fn
 */

Follow.prototype.unfollow =
Follow.prototype.del = function(query, fn) {
  var path = '/sites/' + this._sid + '/follows/mine/delete';
  return this.wpcom.sendRequest({method: 'POST', path: path}, query, null, fn);
};

/**
 * Get the follow status for current 
 * user on current blog site
 *
 * @param {Object} [query]
 * @param {Function} fn
 */

Follow.prototype.state =
Follow.prototype.mine = function(query, fn) {
  var path = '/sites/' + this._sid + '/follows/mine';
  return this.wpcom.sendRequest(path, query, null, fn);
};

/**
 * Expose `Follow` module
 */

module.exports = Follow;

},{"debug":16}],9:[function(require,module,exports){

/**
 * Module dependencies.
 */

var debug = require('debug')('wpcom:like');

/**
 * Like methods
 *
 * @param {String} pid post id
 * @param {String} sid site id
 * @param {WPCOM} wpcom
 * @api public
 */

function Like(pid, sid, wpcom){
  if (!sid) {
    throw new Error('`side id` is not correctly defined');
  }

  if (!pid) {
    throw new Error('`post id` is not correctly defined');
  }

  if (!(this instanceof Like)) return new Like(pid, sid, wpcom);

  this.wpcom = wpcom;
  this._pid = pid;
  this._sid = sid;
}

/**
 * Get your Like status for a Post
 *
 * @param {Object} [query]
 * @param {Function} fn
 * @api public
 */

Like.prototype.state =
Like.prototype.mine = function(query, fn){
  var path = '/sites/' + this._sid + '/posts/' + this._pid + '/likes/mine';
  return this.wpcom.sendRequest(path, query, null, fn);
};

/**
 * Like a post
 *
 * @param {Object} [query]
 * @param {Function} fn
 * @api public
 */

Like.prototype.add = function(query, fn){
  var path = '/sites/' + this._sid + '/posts/' + this._pid + '/likes/new';
  return this.wpcom.sendRequest({ path: path, method: 'post' }, query, null, fn);
};

/**
 * Remove your Like from a Post
 *
 * @param {Function} fn
 * @api public
 */

Like.prototype['delete'] =
Like.prototype.del = function(fn){
  var path = '/sites/' + this._sid + '/posts/' + this._pid + '/likes/mine/delete';
  return this.wpcom.sendRequest({ path: path, method: 'post' }, null, null, fn);
};

/**
 * Expose `Like` module
 */

module.exports = Like;

},{"debug":16}],10:[function(require,module,exports){

/**
 * Module dependencies.
 */

var debug = require('debug')('wpcom:me');

/**
 * Create a `Me` instance
 *
 * @param {WPCOM} wpcom
 * @api public
 */

function Me(wpcom){
  if (!(this instanceof Me)) return new Me(wpcom);
  this.wpcom = wpcom;
}

/**
 * Meta data about auth token's User
 *
 * @param {Object} [query]
 * @param {Function} fn
 * @api public
 */

Me.prototype.get = function(query, fn){
  return this.wpcom.sendRequest('/me', query, null, fn);
};

/**
 * A list of the current user's sites
 *
 * @param {Object} [query]
 * @param {Function} fn
 * @api private
 */

Me.prototype.sites = function(query, fn){
  return this.wpcom.sendRequest('/me/sites', query, null, fn);
};

/**
 * List the currently authorized user's likes
 *
 * @param {Object} [query]
 * @param {Function} fn
 * @api public
 */

Me.prototype.likes = function(query, fn){
  return this.wpcom.sendRequest('/me/likes', query, null, fn);
};

/**
 * A list of the current user's group
 *
 * @param {Object} [query]
 * @param {Function} fn
 * @api public
 */

Me.prototype.groups = function(query, fn){
  return this.wpcom.sendRequest('/me/groups', query, null, fn);
};

/**
 * A list of the current user's connections to third-party services
 *
 * @param {Object} [query]
 * @param {Function} fn
 * @api public
 */

Me.prototype.connections = function(query, fn){
  return this.wpcom.sendRequest('/me/connections', query, null, fn);
};

/**
 * Expose `Me` module
 */

module.exports = Me;

},{"debug":16}],11:[function(require,module,exports){

/**
 * Module dependencies.
 */

var fs = require('fs');
var debug = require('debug')('wpcom:media');

/**
 * Default api version
 */

var api_version = '1.1';

/**
 * Media methods
 *
 * @param {String} id
 * @param {String} sid site id
 * @param {WPCOM} wpcom
 * @api public
 */

function Media(id, sid, wpcom){
  if (!(this instanceof Media)) return new Media(id, sid, wpcom);

  this.wpcom = wpcom;
  this._sid = sid;
  this._id = id;

  if (!this._id) {
    debug('WARN: media `id` is not defined');
  }
}

/**
 * Get media
 *
 * @param {Object} [query]
 * @param {Function} fn
 * @api public
 */

Media.prototype.get = function(query, fn){
  var params = {
    apiVersion: query.apiVersion || api_version,
    path: '/sites/' + this._sid + '/media/' + this._id
  };

  return this.wpcom.sendRequest(params, query, null, fn);
};

/**
 * Edit media
 *
 * @param {Object} [query]
 * @param {Object} body
 * @param {Function} fn
 * @api public
 */

Media.prototype.update = function(query, body, fn){
  if ('function' == typeof body) {
    fn = body;
    body = query;
    query = {};
  }

  var params = {
    apiVersion: query.apiVersion || api_version,
    path: '/sites/' + this._sid + '/media/' + this._id,
    method: 'post'
  };

  return this.wpcom.sendRequest(params, query, body, fn);
};

/**
 * Add media file
 *
 * @param {Object} [query]
 * @param {String|Object|Array} files
 * @param {Function} fn
 */

Media.prototype.addFiles = function(query, files, fn){
  if ('function' == typeof files) {
    fn = files;
    files = query;
    query = {};
  }

  var params = {
    apiVersion: query.apiVersion || api_version,
    path: '/sites/' + this._sid + '/media/new',
    method: 'post',
    formData: []
  };

  // process formData
  files = Array.isArray(files) ? files : [files];

  for (var i = 0; i < files.length; i++) {
    var f = files[i];

    f = 'string' == typeof f ? fs.createReadStream(f) : f;

    var isStream = !!f._readableState;
    var isFile = 'undefined' != typeof File && f instanceof File;

    debug('is stream: %s', isStream);
    debug('is file: %s', isFile);

    if (!isFile && !isStream) {
      // process file attributes like as `title`, `description`, ...
      for (var k in f) {
        debug('add %o => %o', k, f[k]);
        if ('file' != k) {
          var param = 'attrs[' + i + '][' + k + ']';
          params.formData.push([param, f[k]]);
        }
      }
      // set file path
      f = f.file;
      f = 'string' == typeof f ? fs.createReadStream(f) : f;
    }

    params.formData.push(['media[]', f]);
  }

  return this.wpcom.sendRequest(params, query, null, fn);
};

/**
 * Add media files from URL
 *
 * @param {Object} [query]
 * @param {String|Array|Object} files
 * @param {Function} fn
 */

Media.prototype.addUrls = function(query, media, fn){
  if ('function' == typeof media) {
    fn = media;
    media = query;
    query = {};
  }

  var params = {
    apiVersion: query.apiVersion || api_version,
    path: '/sites/' + this._sid + '/media/new',
    method: 'post'
  };

  var body = { media_urls: [] };

  // process formData
  media = Array.isArray(media) ? media : [ media ];
  for (var i = 0; i < media.length; i++) {
    var m = media[i];
    var url;

    if ('string' == typeof m) {
      url = m;
    } else {
      if (!body.attrs) body.attrs = [];

      // add attributes
      body.attrs[i] = {};
      for (var k in m) {
        if ('url' != k) {
          body.attrs[i][k] = m[k];
        }
      }
      url = m[k];
    }

    // push url into [media_url]
    body.media_urls.push(url);
  }

  return this.wpcom.sendRequest(params, query, body, fn);
};

/**
 * Delete media
 *
 * @param {Object} [query]
 * @param {Function} fn
 * @api public
 */

Media.prototype['delete'] =
Media.prototype.del = function(query, fn){
  if ('function' == typeof query) {
    fn = query;
    query = {};
  }

  var params = {
    apiVersion: query.apiVersion || api_version,
    path: '/sites/' + this._sid + '/media/' + this._id + '/delete',
    method: 'post'
  };

  return this.wpcom.sendRequest(params, query, null, fn);
};

/**
 * Expose `Media` module
 */

module.exports = Media;

},{"debug":16,"fs":2}],12:[function(require,module,exports){

/**
 * Module dependencies.
 */

var Like = require('./like');
var Reblog = require('./reblog');
var Comment = require('./comment');
var debug = require('debug')('wpcom:post');

/**
 * Post methods
 *
 * @param {String} id
 * @param {String} sid site id
 * @param {WPCOM} wpcom
 * @api public
 */

function Post(id, sid, wpcom){
  if (!(this instanceof Post)) return new Post(id, sid, wpcom);

  this.wpcom = wpcom;
  this._sid = sid;

  // set `id` and/or `slug` properties
  id = id || {};
  if ('object' != typeof id) {
    this._id = id;
  } else {
    this._id = id.id;
    this._slug = id.slug;
  }
}

/**
 * Set post `id`
 *
 * @api public
 */

Post.prototype.id = function(id){
  this._id = id;
};

/**
 * Set post `slug`
 *
 * @param {String} slug
 * @api public
 */

Post.prototype.slug = function(slug){
  this._slug = slug;
};

/**
 * Get post
 *
 * @param {Object} [query]
 * @param {Function} fn
 * @api public
 */

Post.prototype.get = function(query, fn){
  if (!this._id && this._slug) {
    return this.getBySlug(query, fn);
  }

  var path = '/sites/' + this._sid + '/posts/' + this._id;
  return this.wpcom.sendRequest(path, query, null, fn);
};

/**
 * Get post by slug
 *
 * @param {Object} [query]
 * @param {Function} fn
 * @api public
 */

Post.prototype.getBySlug = function(query, fn){
  var path = '/sites/' + this._sid + '/posts/slug:' + this._slug;
  return this.wpcom.sendRequest(path, query, null, fn);
};

/**
 * Add post
 *
 * @param {Object} body
 * @param {Function} fn
 * @api public
 */

Post.prototype.add = function(body, fn){
  var path = '/sites/' + this._sid + '/posts/new';
  return this.wpcom.sendRequest({ path: path, method: 'post' }, null, body, fn);
};

/**
 * Edit post
 *
 * @param {Object} body
 * @param {Function} fn
 * @api public
 */

Post.prototype.update = function(body, fn){
  var path = '/sites/' + this._sid + '/posts/' + this._id;
  return this.wpcom.sendRequest({ path: path, method: 'post' }, null, body, fn);
};

/**
 * Delete post
 *
 * @param {Function} fn
 * @api public
 */

Post.prototype['delete'] =
Post.prototype.del = function(fn){
  var path = '/sites/' + this._sid + '/posts/' + this._id + '/delete';
  return this.wpcom.sendRequest({ path: path, method: 'post' }, null, null, fn);
};

/**
 * Get post likes list
 *
 * @param {Object} [query]
 * @param {Function} fn
 * @api public
 */

Post.prototype.likesList = function(query, fn){
  var path = '/sites/' + this._sid + '/posts/' + this._id + '/likes';
  return this.wpcom.sendRequest(path, query, null, fn);
};

/**
 * Search within a site for related posts
 *
 * @param {Object} body
 * @param {Function} fn
 * @api public
 */

Post.prototype.related = function(body, fn){
  var path = '/sites/' + this._sid + '/posts/' + this._id + '/related';
  return this.wpcom.sendRequest({ path: path, method: 'post' }, null, body, fn);
};

/**
 * Create a `Like` instance
 *
 * @api public
 */

Post.prototype.like = function(){
  return Like( this._id, this._sid, this.wpcom);
};

/**
 * Create a `Reblog` instance
 *
 * @api public
 */

Post.prototype.reblog = function(){
  return Reblog(this._id, this._sid, this.wpcom);
};

/**
 * Create a `Comment` instance
 *
 * @param {String} [cid] comment id
 * @api public
 */

Post.prototype.comment = function(cid){
  return Comment(cid, this._id, this._sid, this.wpcom);
};

/**
 * :COMMENT:
 * Return recent comments
 *
 * @param {Objecy} [query]
 * @param {String} id
 * @api public
 */

Post.prototype.comments = function(query, fn){
  var comment = Comment(null, this._id, this._sid, this.wpcom);
  comment.replies(query, fn);
  return comment;
};

/**
 * Expose `Post` module
 */

module.exports = Post;

},{"./comment":6,"./like":9,"./reblog":13,"debug":16}],13:[function(require,module,exports){

/**
 * Module dependencies.
 */

var debug = require('debug')('wpcom:reblog');

/**
 * Reblog methods
 *
 * @param {String} pid post id
 * @param {String} sid site id
 * @param {WPCOM} wpcom
 * @api public
 */

function Reblog(pid, sid, wpcom){
  if (!sid) {
    throw new Error('`side id` is not correctly defined');
  }

  if (!pid) {
    throw new Error('`post id` is not correctly defined');
  }

  if (!(this instanceof Reblog)) return new Reblog(pid, sid, wpcom);

  this.wpcom = wpcom;
  this._pid = pid;
  this._sid = sid;
}

/**
 * Get your reblog status for a Post
 *
 * @param {Object} [query]
 * @param {Function} fn
 * @api public
 */

Reblog.prototype.state =
Reblog.prototype.mine = function(query, fn){
  var path = '/sites/' + this._sid + '/posts/' + this._pid + '/reblogs/mine';
  return this.wpcom.sendRequest(path, query, null, fn);
};

/**
 * Reblog a post
 *
 * @param {Object} body
 * @param {Function} fn
 * @api public
 */

Reblog.prototype.add = function(body, fn){
  if (body && !body.destination_site_id) {
    return fn(new Error('destination_site_id is not defined'));
  }

  var path = '/sites/' + this._sid + '/posts/' + this._pid + '/reblogs/new';
  return this.wpcom.sendRequest({ path: path, method: 'post' }, null, body, fn);
};

/**
 * Reblog a post to
 * It's almost a alias of Reblogs#add()
 *
 * @param {Number} dest destination
 * @param {String} [note]
 * @param {Function} fn
 * @api public
 */

Reblog.prototype.to = function(dest, note, fn){
  if ('function' == typeof note) {
    fn = note;
    note = null;
  }

  this.add({ note: note, destination_site_id: dest }, fn);
};

/**
 * Expose `Reblog` module
 */

module.exports = Reblog;

},{"debug":16}],14:[function(require,module,exports){

/**
 * Module dependencies.
 */

var Post = require('./post');
var Category= require('./category');
var Tag= require('./tag');
var Media = require('./media');
var Comment = require('./comment');
var Follow = require('./follow');
var debug = require('debug')('wpcom:site');

/**
 * Resources array
 * A list of endpoints with the same structure
 */

var resources = [
  'categories',
  'comments',
  'follows',
  'media',
  'posts',
  [ 'stats', 'stats' ],
  [ 'statsVisits', 'stats/visits' ],
  [ 'statsReferrers', 'stats/referrers' ],
  [ 'statsTopPosts', 'stats/top-posts' ],
  [ 'statsCountryViews', 'stats/country-views' ],
  [ 'statsClicks', 'stats/clicks' ],
  [ 'statsSearchTerms', 'stats/search-terms' ],
  'tags',
  'users'
];

/**
 * Create a Site instance
 *
 * @param {WPCOM} wpcom
 * @api public
 */

function Site(id, wpcom){
  if (!(this instanceof Site)) return new Site(id, wpcom);
  this.wpcom = wpcom;

  debug('set %o site id', id);
  this._id = id;
}

/**
 * Require site information
 *
 * @param {Object} [query]
 * @param {Function} fn
 * @api public
 */

Site.prototype.get = function(query, fn){
  return this.wpcom.sendRequest('/sites/' + this._id, query, null, fn);
};

/**
 * List method builder
 *
 * @param {String} subpath
 * @param {Function}
 * @api private
 */

var list = function(subpath) {

  /**
   * Return the <names>List method
   *
   * @param {Object} [query]
   * @param {Function} fn
   * @api public
   */

  return function (query, fn){
    return this.wpcom.sendRequest('/sites/' + this._id + '/' + subpath, query, null, fn);
  };
};

// walk for each resource and create related method
for (var i = 0; i < resources.length; i++) {
  var res = resources[i];
  var isarr = Array.isArray(res);

  var name =  isarr ? res[0] : res + 'List';
  var subpath = isarr ? res[1] : res;

  debug('adding %o method in %o sub-path', 'site.' + name + '()', subpath);
  Site.prototype[name] = list(subpath);
}

/**
 * :POST:
 * Create a `Post` instance
 *
 * @param {String} id
 * @api public
 */

Site.prototype.post = function(id){
  return Post(id, this._id, this.wpcom);
};

/**
 * :POST:
 * Add a new blog post
 *
 * @param {Object} body
 * @param {Function} fn
 * @return {Post} new Post instance
 */

Site.prototype.addPost = function(body, fn){
  var post = Post(null, this._id, this.wpcom);
  return post.add(body, fn);
};

/**
 * :POST:
 * Delete a blog post
 *
 * @param {String} id
 * @param {Function} fn
 * @return {Post} remove Post instance
 */

Site.prototype.deletePost = function(id, fn){
  var post = Post(id, this._id, this.wpcom);
  return post.delete(fn);
};

/**
 * :MEDIA:
 * Create a `Media` instance
 *
 * @param {String} id
 * @api public
 */

Site.prototype.media = function(id){
  return Media(id, this._id, this.wpcom);
};

/**
 * :MEDIA:
 * Add a media from a file
 *
 * @param {Object} [query]
 * @param {Array|String} files
 * @param {Function} fn
 * @return {Post} new Post instance
 */

Site.prototype.addMediaFiles = function(query, files, fn){
  var media = Media(null, this._id, this.wpcom);
  return media.addFiles(query, files, fn);
};

/**
 * :MEDIA:
 * Add a new media from url
 *
 * @param {Object} [query]
 * @param {Array|String} files
 * @param {Function} fn
 * @return {Post} new Post instance
 */

Site.prototype.addMediaUrls = function(query, files, fn){
  var media = Media(null, this._id, this.wpcom);
  return media.addUrls(query, files, fn);
};

/**
 * :MEDIA:
 * Delete a blog media
 *
 * @param {String} id
 * @param {Function} fn
 * @return {Post} removed Media instance
 */

Site.prototype.deleteMedia = function(id, fn){
  var media = Media(id, this._id, this.wpcom);
  return media.del(fn);
};

/**
 * :COMMENT:
 * Create a `Comment` instance
 *
 * @param {String} id
 * @api public
 */

Site.prototype.comment = function(id){
  return Comment(id, null, this._id, this.wpcom);
};

/**
 * Create a `Follow` instance
 *
 * @api public
 */

Site.prototype.follow = function(){
  return Follow(this._id, this.wpcom);
};

/**
 * Create a `Category` instance
 * Set `cat` alias
 *
 * @param {String} [slug]
 * @api public
 */

Site.prototype.cat =
Site.prototype.category = function(slug){
  return Category(slug, this._id, this.wpcom);
};

/**
 * Create a `Tag` instance
 *
 * @param {String} [slug]
 * @api public
 */

Site.prototype.tag = function(slug){
  return Tag(slug, this._id, this.wpcom);
};

/**
 * Expose `Site` module
 */

module.exports = Site;

},{"./category":5,"./comment":6,"./follow":8,"./media":11,"./post":12,"./tag":15,"debug":16}],15:[function(require,module,exports){

/**
 * Module dependencies.
 */

var debug = require('debug')('wpcom:tag');

/**
 * Tag methods
 *
 * @param {String} [slug]
 * @param {String} sid site id
 * @param {WPCOM} wpcom
 * @api public
 */

function Tag(slug, sid, wpcom){
  if (!sid) {
    throw new Error('`side id` is not correctly defined');
  }

  if (!(this instanceof Tag)) return new Tag(slug, sid, wpcom);

  this.wpcom = wpcom;
  this._sid = sid;
  this._slug = slug;
}

/**
 * Set tag `slug`
 *
 * @param {String} slug
 * @api public
 */

Tag.prototype.slug = function(slug){
  this._slug = slug;
};

/**
 * Get tag
 *
 * @param {Object} [query]
 * @param {Function} fn
 * @api public
 */

Tag.prototype.get = function(query, fn){
  var path = '/sites/' + this._sid + '/tags/slug:' + this._slug;
  return this.wpcom.sendRequest(path, query, null, fn);
};

/**
 * Add tag
 *
 * @param {Object} body
 * @param {Function} fn
 * @api public
 */

Tag.prototype.add = function(body, fn){
  var path = '/sites/' + this._sid + '/tags/new';
  return this.wpcom.sendRequest({ path: path, method: 'post' }, null, body, fn);
};

/**
 * Edit tag
 *
 * @param {Object} body
 * @param {Function} fn
 * @api public
 */

Tag.prototype.update = function(body, fn){
  var path = '/sites/' + this._sid + '/tags/slug:' + this._slug;
  return this.wpcom.sendRequest({ path: path, method: 'post' }, null, body, fn);
};

/**
 * Delete tag
 *
 * @param {Function} fn
 * @api public
 */

Tag.prototype['delete'] =
Tag.prototype.del = function(fn){
  var path = '/sites/' + this._sid + '/tags/slug:' + this._slug + '/delete';
  return this.wpcom.sendRequest({ path: path, method: 'post' }, null, null, fn);
};

/**
 * Expose `Tag` module
 */

module.exports = Tag;

},{"debug":16}],16:[function(require,module,exports){

/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // is webkit? http://stackoverflow.com/a/16459606/376773
  return ('WebkitAppearance' in document.documentElement.style) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (window.console && (console.firebug || (console.exception && console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  return JSON.stringify(v);
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs() {
  var args = arguments;
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return args;

  var c = 'color: ' + this.color;
  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
  return args;
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // This hackery is required for IE8,
  // where the `console.log` function doesn't have 'apply'
  return 'object' == typeof console
    && 'function' == typeof console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      localStorage.removeItem('debug');
    } else {
      localStorage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = localStorage.debug;
  } catch(e) {}
  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

},{"./debug":17}],17:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = debug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lowercased letter, i.e. "n".
 */

exports.formatters = {};

/**
 * Previously assigned color.
 */

var prevColor = 0;

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 *
 * @return {Number}
 * @api private
 */

function selectColor() {
  return exports.colors[prevColor++ % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function debug(namespace) {

  // define the `disabled` version
  function disabled() {
  }
  disabled.enabled = false;

  // define the `enabled` version
  function enabled() {

    var self = enabled;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // add the `color` if not set
    if (null == self.useColors) self.useColors = exports.useColors();
    if (null == self.color && self.useColors) self.color = selectColor();

    var args = Array.prototype.slice.call(arguments);

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %o
      args = ['%o'].concat(args);
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    if ('function' === typeof exports.formatArgs) {
      args = exports.formatArgs.apply(self, args);
    }
    var logFn = enabled.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }
  enabled.enabled = true;

  var fn = exports.enabled(namespace) ? enabled : disabled;

  fn.namespace = namespace;

  return fn;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  var split = (namespaces || '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":18}],18:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} options
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options){
  options = options || {};
  if ('string' == typeof val) return parse(val);
  return options.long
    ? long(val)
    : short(val);
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  var match = /^((?:\d+)?\.?\d+) *(ms|seconds?|s|minutes?|m|hours?|h|days?|d|years?|y)?$/i.exec(str);
  if (!match) return;
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 's':
      return n * s;
    case 'ms':
      return n;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function short(ms) {
  if (ms >= d) return Math.round(ms / d) + 'd';
  if (ms >= h) return Math.round(ms / h) + 'h';
  if (ms >= m) return Math.round(ms / m) + 'm';
  if (ms >= s) return Math.round(ms / s) + 's';
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function long(ms) {
  return plural(ms, d, 'day')
    || plural(ms, h, 'hour')
    || plural(ms, m, 'minute')
    || plural(ms, s, 'second')
    || ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) return;
  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],19:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],20:[function(require,module,exports){

/**
 * Module dependencies.
 */

var superagent = require('superagent');
var debug = require('debug')('wpcom-xhr-request');

/**
 * Export a single `request` function.
 */

module.exports = request;

/**
 * WordPress.com REST API base endpoint.
 */

var proxyOrigin = 'https://public-api.wordpress.com';

/**
 * Default WordPress.com REST API Version.
 */

var defaultApiVersion = '1';

/**
 * Performs an XMLHttpRequest against the WordPress.com REST API.
 *
 * @param {Object|String} params
 * @param {Function} fn
 * @api public
 */

function request (params, fn) {

  if ('string' == typeof params) {
    params = { path: params };
  }

  var method = (params.method || 'GET').toLowerCase();
  debug('API HTTP Method: %o', method);
  delete params.method;

  var apiVersion = params.apiVersion || defaultApiVersion;
  delete params.apiVersion;

  var url = proxyOrigin + '/rest/v' + apiVersion + params.path;
  debug('API URL: %o', url);
  delete params.path;

  // create HTTP Request object
  var req = superagent[method](url);

  // Token authentication
  if (params.authToken) {
    req.set('Authorization', 'Bearer ' + params.authToken);
    delete params.authToken;
  }

  // URL querystring values
  if (params.query) {
    req.query(params.query);
    debug('API send URL querystring: %o', params.query);
    delete params.query;
  }

  // POST API request body
  if (params.body) {
    req.send(params.body);
    debug('API send POST body: ', params.body);
    delete params.body;
  }

  // POST FormData (for `multipart/form-data`, usually a file upload)
  if (params.formData) {
    for (var i = 0; i < params.formData.length; i++) {
      var data = params.formData[i];
      var key = data[0];
      var value = data[1];
      debug('adding FormData field %o', key);
      req.field(key, value);
    }
  }

  // start the request
  req.end(function (err, res){
    if (err) return fn(err);
    var body = res.body;
    var headers = res.headers;
    var statusCode = res.status;
    debug('%o -> %o status code', url, statusCode);

    if (body && headers) {
      body._headers = headers;
    }

    if (2 === Math.floor(statusCode / 100)) {
      // 2xx status code, success
      fn(null, body);
    } else {
      // any other status code is a failure
      err = new Error();
      err.statusCode = statusCode;
      for (var i in body) err[i] = body[i];
      if (body && body.error) err.name = toTitle(body.error) + 'Error';
      fn(err);
    }
  });

  return req.xhr;
}

function toTitle (str) {
  if (!str || 'string' !== typeof str) return '';
  return str.replace(/((^|_)[a-z])/g, function ($1) {
    return $1.toUpperCase().replace('_', '');
  });
}

},{"debug":16,"superagent":21}],21:[function(require,module,exports){
/**
 * Module dependencies.
 */

var Emitter = require('emitter');
var reduce = require('reduce');

/**
 * Root reference for iframes.
 */

var root = 'undefined' == typeof window
  ? this
  : window;

/**
 * Noop.
 */

function noop(){};

/**
 * Check if `obj` is a host object,
 * we don't want to serialize these :)
 *
 * TODO: future proof, move to compoent land
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isHost(obj) {
  var str = {}.toString.call(obj);

  switch (str) {
    case '[object File]':
    case '[object Blob]':
    case '[object FormData]':
      return true;
    default:
      return false;
  }
}

/**
 * Determine XHR.
 */

function getXHR() {
  if (root.XMLHttpRequest
    && ('file:' != root.location.protocol || !root.ActiveXObject)) {
    return new XMLHttpRequest;
  } else {
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
  }
  return false;
}

/**
 * Removes leading and trailing whitespace, added to support IE.
 *
 * @param {String} s
 * @return {String}
 * @api private
 */

var trim = ''.trim
  ? function(s) { return s.trim(); }
  : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };

/**
 * Check if `obj` is an object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isObject(obj) {
  return obj === Object(obj);
}

/**
 * Serialize the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api private
 */

function serialize(obj) {
  if (!isObject(obj)) return obj;
  var pairs = [];
  for (var key in obj) {
    if (null != obj[key]) {
      pairs.push(encodeURIComponent(key)
        + '=' + encodeURIComponent(obj[key]));
    }
  }
  return pairs.join('&');
}

/**
 * Expose serialization method.
 */

 request.serializeObject = serialize;

 /**
  * Parse the given x-www-form-urlencoded `str`.
  *
  * @param {String} str
  * @return {Object}
  * @api private
  */

function parseString(str) {
  var obj = {};
  var pairs = str.split('&');
  var parts;
  var pair;

  for (var i = 0, len = pairs.length; i < len; ++i) {
    pair = pairs[i];
    parts = pair.split('=');
    obj[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
  }

  return obj;
}

/**
 * Expose parser.
 */

request.parseString = parseString;

/**
 * Default MIME type map.
 *
 *     superagent.types.xml = 'application/xml';
 *
 */

request.types = {
  html: 'text/html',
  json: 'application/json',
  xml: 'application/xml',
  urlencoded: 'application/x-www-form-urlencoded',
  'form': 'application/x-www-form-urlencoded',
  'form-data': 'application/x-www-form-urlencoded'
};

/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */

 request.serialize = {
   'application/x-www-form-urlencoded': serialize,
   'application/json': JSON.stringify
 };

 /**
  * Default parsers.
  *
  *     superagent.parse['application/xml'] = function(str){
  *       return { object parsed from str };
  *     };
  *
  */

request.parse = {
  'application/x-www-form-urlencoded': parseString,
  'application/json': JSON.parse
};

/**
 * Parse the given header `str` into
 * an object containing the mapped fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parseHeader(str) {
  var lines = str.split(/\r?\n/);
  var fields = {};
  var index;
  var line;
  var field;
  var val;

  lines.pop(); // trailing CRLF

  for (var i = 0, len = lines.length; i < len; ++i) {
    line = lines[i];
    index = line.indexOf(':');
    field = line.slice(0, index).toLowerCase();
    val = trim(line.slice(index + 1));
    fields[field] = val;
  }

  return fields;
}

/**
 * Return the mime type for the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function type(str){
  return str.split(/ *; */).shift();
};

/**
 * Return header field parameters.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function params(str){
  return reduce(str.split(/ *; */), function(obj, str){
    var parts = str.split(/ *= */)
      , key = parts.shift()
      , val = parts.shift();

    if (key && val) obj[key] = val;
    return obj;
  }, {});
};

/**
 * Initialize a new `Response` with the given `xhr`.
 *
 *  - set flags (.ok, .error, etc)
 *  - parse header
 *
 * Examples:
 *
 *  Aliasing `superagent` as `request` is nice:
 *
 *      request = superagent;
 *
 *  We can use the promise-like API, or pass callbacks:
 *
 *      request.get('/').end(function(res){});
 *      request.get('/', function(res){});
 *
 *  Sending data can be chained:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' })
 *        .end(function(res){});
 *
 *  Or passed to `.send()`:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' }, function(res){});
 *
 *  Or passed to `.post()`:
 *
 *      request
 *        .post('/user', { name: 'tj' })
 *        .end(function(res){});
 *
 * Or further reduced to a single call for simple cases:
 *
 *      request
 *        .post('/user', { name: 'tj' }, function(res){});
 *
 * @param {XMLHTTPRequest} xhr
 * @param {Object} options
 * @api private
 */

function Response(req, options) {
  options = options || {};
  this.req = req;
  this.xhr = this.req.xhr;
  this.text = this.xhr.responseText;
  this.setStatusProperties(this.xhr.status);
  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
  // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
  // getResponseHeader still works. so we get content-type even if getting
  // other headers fails.
  this.header['content-type'] = this.xhr.getResponseHeader('content-type');
  this.setHeaderProperties(this.header);
  this.body = this.req.method != 'HEAD'
    ? this.parseBody(this.text)
    : null;
}

/**
 * Get case-insensitive `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

Response.prototype.get = function(field){
  return this.header[field.toLowerCase()];
};

/**
 * Set header related properties:
 *
 *   - `.type` the content type without params
 *
 * A response of "Content-Type: text/plain; charset=utf-8"
 * will provide you with a `.type` of "text/plain".
 *
 * @param {Object} header
 * @api private
 */

Response.prototype.setHeaderProperties = function(header){
  // content-type
  var ct = this.header['content-type'] || '';
  this.type = type(ct);

  // params
  var obj = params(ct);
  for (var key in obj) this[key] = obj[key];
};

/**
 * Parse the given body `str`.
 *
 * Used for auto-parsing of bodies. Parsers
 * are defined on the `superagent.parse` object.
 *
 * @param {String} str
 * @return {Mixed}
 * @api private
 */

Response.prototype.parseBody = function(str){
  var parse = request.parse[this.type];
  return parse && str && str.length
    ? parse(str)
    : null;
};

/**
 * Set flags such as `.ok` based on `status`.
 *
 * For example a 2xx response will give you a `.ok` of __true__
 * whereas 5xx will be __false__ and `.error` will be __true__. The
 * `.clientError` and `.serverError` are also available to be more
 * specific, and `.statusType` is the class of error ranging from 1..5
 * sometimes useful for mapping respond colors etc.
 *
 * "sugar" properties are also defined for common cases. Currently providing:
 *
 *   - .noContent
 *   - .badRequest
 *   - .unauthorized
 *   - .notAcceptable
 *   - .notFound
 *
 * @param {Number} status
 * @api private
 */

Response.prototype.setStatusProperties = function(status){
  var type = status / 100 | 0;

  // status / class
  this.status = status;
  this.statusType = type;

  // basics
  this.info = 1 == type;
  this.ok = 2 == type;
  this.clientError = 4 == type;
  this.serverError = 5 == type;
  this.error = (4 == type || 5 == type)
    ? this.toError()
    : false;

  // sugar
  this.accepted = 202 == status;
  this.noContent = 204 == status || 1223 == status;
  this.badRequest = 400 == status;
  this.unauthorized = 401 == status;
  this.notAcceptable = 406 == status;
  this.notFound = 404 == status;
  this.forbidden = 403 == status;
};

/**
 * Return an `Error` representative of this response.
 *
 * @return {Error}
 * @api public
 */

Response.prototype.toError = function(){
  var req = this.req;
  var method = req.method;
  var url = req.url;

  var msg = 'cannot ' + method + ' ' + url + ' (' + this.status + ')';
  var err = new Error(msg);
  err.status = this.status;
  err.method = method;
  err.url = url;

  return err;
};

/**
 * Expose `Response`.
 */

request.Response = Response;

/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String} url
 * @api public
 */

function Request(method, url) {
  var self = this;
  Emitter.call(this);
  this._query = this._query || [];
  this.method = method;
  this.url = url;
  this.header = {};
  this._header = {};
  this.on('end', function(){
    try {
      var res = new Response(self);
      if ('HEAD' == method) res.text = null;
      self.callback(null, res);
    } catch(e) {
      var err = new Error('Parser is unable to parse the response');
      err.parse = true;
      err.original = e;
      self.callback(err);
    }
  });
}

/**
 * Mixin `Emitter`.
 */

Emitter(Request.prototype);

/**
 * Allow for extension
 */

Request.prototype.use = function(fn) {
  fn(this);
  return this;
}

/**
 * Set timeout to `ms`.
 *
 * @param {Number} ms
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.timeout = function(ms){
  this._timeout = ms;
  return this;
};

/**
 * Clear previous timeout.
 *
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.clearTimeout = function(){
  this._timeout = 0;
  clearTimeout(this._timer);
  return this;
};

/**
 * Abort the request, and clear potential timeout.
 *
 * @return {Request}
 * @api public
 */

Request.prototype.abort = function(){
  if (this.aborted) return;
  this.aborted = true;
  this.xhr.abort();
  this.clearTimeout();
  this.emit('abort');
  return this;
};

/**
 * Set header `field` to `val`, or multiple fields with one object.
 *
 * Examples:
 *
 *      req.get('/')
 *        .set('Accept', 'application/json')
 *        .set('X-API-Key', 'foobar')
 *        .end(callback);
 *
 *      req.get('/')
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
 *        .end(callback);
 *
 * @param {String|Object} field
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.set = function(field, val){
  if (isObject(field)) {
    for (var key in field) {
      this.set(key, field[key]);
    }
    return this;
  }
  this._header[field.toLowerCase()] = val;
  this.header[field] = val;
  return this;
};

/**
 * Remove header `field`.
 *
 * Example:
 *
 *      req.get('/')
 *        .unset('User-Agent')
 *        .end(callback);
 *
 * @param {String} field
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.unset = function(field){
  delete this._header[field.toLowerCase()];
  delete this.header[field];
  return this;
};

/**
 * Get case-insensitive header `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api private
 */

Request.prototype.getHeader = function(field){
  return this._header[field.toLowerCase()];
};

/**
 * Set Content-Type to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.xml = 'application/xml';
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.type = function(type){
  this.set('Content-Type', request.types[type] || type);
  return this;
};

/**
 * Set Accept to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.json = 'application/json';
 *
 *      request.get('/agent')
 *        .accept('json')
 *        .end(callback);
 *
 *      request.get('/agent')
 *        .accept('application/json')
 *        .end(callback);
 *
 * @param {String} accept
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.accept = function(type){
  this.set('Accept', request.types[type] || type);
  return this;
};

/**
 * Set Authorization field value with `user` and `pass`.
 *
 * @param {String} user
 * @param {String} pass
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.auth = function(user, pass){
  var str = btoa(user + ':' + pass);
  this.set('Authorization', 'Basic ' + str);
  return this;
};

/**
* Add query-string `val`.
*
* Examples:
*
*   request.get('/shoes')
*     .query('size=10')
*     .query({ color: 'blue' })
*
* @param {Object|String} val
* @return {Request} for chaining
* @api public
*/

Request.prototype.query = function(val){
  if ('string' != typeof val) val = serialize(val);
  if (val) this._query.push(val);
  return this;
};

/**
 * Write the field `name` and `val` for "multipart/form-data"
 * request bodies.
 *
 * ``` js
 * request.post('/upload')
 *   .field('foo', 'bar')
 *   .end(callback);
 * ```
 *
 * @param {String} name
 * @param {String|Blob|File} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.field = function(name, val){
  if (!this._formData) this._formData = new FormData();
  this._formData.append(name, val);
  return this;
};

/**
 * Queue the given `file` as an attachment to the specified `field`,
 * with optional `filename`.
 *
 * ``` js
 * request.post('/upload')
 *   .attach(new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
 *   .end(callback);
 * ```
 *
 * @param {String} field
 * @param {Blob|File} file
 * @param {String} filename
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.attach = function(field, file, filename){
  if (!this._formData) this._formData = new FormData();
  this._formData.append(field, file, filename);
  return this;
};

/**
 * Send `data`, defaulting the `.type()` to "json" when
 * an object is given.
 *
 * Examples:
 *
 *       // querystring
 *       request.get('/search')
 *         .end(callback)
 *
 *       // multiple data "writes"
 *       request.get('/search')
 *         .send({ search: 'query' })
 *         .send({ range: '1..5' })
 *         .send({ order: 'desc' })
 *         .end(callback)
 *
 *       // manual json
 *       request.post('/user')
 *         .type('json')
 *         .send('{"name":"tj"})
 *         .end(callback)
 *
 *       // auto json
 *       request.post('/user')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // manual x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send('name=tj')
 *         .end(callback)
 *
 *       // auto x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // defaults to x-www-form-urlencoded
  *      request.post('/user')
  *        .send('name=tobi')
  *        .send('species=ferret')
  *        .end(callback)
 *
 * @param {String|Object} data
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.send = function(data){
  var obj = isObject(data);
  var type = this.getHeader('Content-Type');

  // merge
  if (obj && isObject(this._data)) {
    for (var key in data) {
      this._data[key] = data[key];
    }
  } else if ('string' == typeof data) {
    if (!type) this.type('form');
    type = this.getHeader('Content-Type');
    if ('application/x-www-form-urlencoded' == type) {
      this._data = this._data
        ? this._data + '&' + data
        : data;
    } else {
      this._data = (this._data || '') + data;
    }
  } else {
    this._data = data;
  }

  if (!obj) return this;
  if (!type) this.type('json');
  return this;
};

/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */

Request.prototype.callback = function(err, res){
  var fn = this._callback;
  if (2 == fn.length) return fn(err, res);
  if (err) return this.emit('error', err);
  fn(res);
};

/**
 * Invoke callback with x-domain error.
 *
 * @api private
 */

Request.prototype.crossDomainError = function(){
  var err = new Error('Origin is not allowed by Access-Control-Allow-Origin');
  err.crossDomain = true;
  this.callback(err);
};

/**
 * Invoke callback with timeout error.
 *
 * @api private
 */

Request.prototype.timeoutError = function(){
  var timeout = this._timeout;
  var err = new Error('timeout of ' + timeout + 'ms exceeded');
  err.timeout = timeout;
  this.callback(err);
};

/**
 * Enable transmission of cookies with x-domain requests.
 *
 * Note that for this to work the origin must not be
 * using "Access-Control-Allow-Origin" with a wildcard,
 * and also must set "Access-Control-Allow-Credentials"
 * to "true".
 *
 * @api public
 */

Request.prototype.withCredentials = function(){
  this._withCredentials = true;
  return this;
};

/**
 * Initiate request, invoking callback `fn(res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.end = function(fn){
  var self = this;
  var xhr = this.xhr = getXHR();
  var query = this._query.join('&');
  var timeout = this._timeout;
  var data = this._formData || this._data;

  // store callback
  this._callback = fn || noop;

  // state change
  xhr.onreadystatechange = function(){
    if (4 != xhr.readyState) return;
    if (0 == xhr.status) {
      if (self.aborted) return self.timeoutError();
      return self.crossDomainError();
    }
    self.emit('end');
  };

  // progress
  if (xhr.upload) {
    xhr.upload.onprogress = function(e){
      e.percent = e.loaded / e.total * 100;
      self.emit('progress', e);
    };
  }

  // timeout
  if (timeout && !this._timer) {
    this._timer = setTimeout(function(){
      self.abort();
    }, timeout);
  }

  // querystring
  if (query) {
    query = request.serializeObject(query);
    this.url += ~this.url.indexOf('?')
      ? '&' + query
      : '?' + query;
  }

  // initiate request
  xhr.open(this.method, this.url, true);

  // CORS
  if (this._withCredentials) xhr.withCredentials = true;

  // body
  if ('GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !isHost(data)) {
    // serialize stuff
    var serialize = request.serialize[this.getHeader('Content-Type')];
    if (serialize) data = serialize(data);
  }

  // set header fields
  for (var field in this.header) {
    if (null == this.header[field]) continue;
    xhr.setRequestHeader(field, this.header[field]);
  }

  // send stuff
  this.emit('request', this);
  xhr.send(data);
  return this;
};

/**
 * Expose `Request`.
 */

request.Request = Request;

/**
 * Issue a request:
 *
 * Examples:
 *
 *    request('GET', '/users').end(callback)
 *    request('/users').end(callback)
 *    request('/users', callback)
 *
 * @param {String} method
 * @param {String|Function} url or callback
 * @return {Request}
 * @api public
 */

function request(method, url) {
  // callback
  if ('function' == typeof url) {
    return new Request('GET', method).end(url);
  }

  // url first
  if (1 == arguments.length) {
    return new Request('GET', method);
  }

  return new Request(method, url);
}

/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.get = function(url, data, fn){
  var req = request('GET', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * HEAD `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.head = function(url, data, fn){
  var req = request('HEAD', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * DELETE `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.del = function(url, fn){
  var req = request('DELETE', url);
  if (fn) req.end(fn);
  return req;
};

/**
 * PATCH `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.patch = function(url, data, fn){
  var req = request('PATCH', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * POST `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.post = function(url, data, fn){
  var req = request('POST', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * PUT `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.put = function(url, data, fn){
  var req = request('PUT', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * Expose `request`.
 */

module.exports = request;

},{"emitter":22,"reduce":23}],22:[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],23:[function(require,module,exports){

/**
 * Reduce `arr` with `fn`.
 *
 * @param {Array} arr
 * @param {Function} fn
 * @param {Mixed} initial
 *
 * TODO: combatible error handling?
 */

module.exports = function(arr, fn, initial){  
  var idx = 0;
  var len = arr.length;
  var curr = arguments.length == 3
    ? initial
    : arr[idx++];

  while (idx < len) {
    curr = fn.call(null, curr, arr[idx], ++idx, arr);
  }
  
  return curr;
};
},{}],24:[function(require,module,exports){

/**
 * Module dependencies.
 */

var _WPCOM = require('./index.js');
var request = require('wpcom-xhr-request');
var inherits = require('inherits');

/**
 * Module exports.
 */

module.exports = WPCOM;

/**
 * WordPress.com REST API class.
 *
 * XMLHttpRequest (and CORS) API access method.
 * API authentication is done via an (optional) access `token`,
 * which needs to be retrieved via OAuth (see `wpcom-oauth` on npm).
 *
 * @param {String} token (optional) OAuth API access token
 * @api public
 */

function WPCOM (token) {
  if (!(this instanceof WPCOM)) return new WPCOM(token);
  _WPCOM.call(this, request);
  this.token = token;
}

inherits(WPCOM, _WPCOM);

/**
 * Set access token.
 *
 * @param {String} token - API token to use for requests
 * @public
 */

WPCOM.prototype.setToken = function (token) {
  this.token = token;
};

/**
 * Overwrite the parent `sendRequest()` function so that we can
 * add the `authToken` to every API request if it's present.
 *
 * @api private
 */

WPCOM.prototype.sendRequest = function (params, query, body, fn){
  if ('string' == typeof params) params = { path: params };

  // token
  var token = params.token || this.token;
  if (token) params.authToken = token;

  return _WPCOM.prototype.sendRequest.call(this, params, query, body, fn);
};

},{"./index.js":3,"inherits":19,"wpcom-xhr-request":20}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvcmV0cm9mb3gvbGFiL2pzY29uZmFyLXdvcmtzaG9wL21vZHVsZS0wMi9hLm1ha2UvY2xpZW50LmpzIiwiL1VzZXJzL3JldHJvZm94L2xhYi9qc2NvbmZhci13b3Jrc2hvcC9tb2R1bGUtMDIvYS5tYWtlL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L2xpYi9fZW1wdHkuanMiLCIvVXNlcnMvcmV0cm9mb3gvbGFiL2pzY29uZmFyLXdvcmtzaG9wL21vZHVsZS0wMi9hLm1ha2Uvbm9kZV9tb2R1bGVzL3dwY29tL2luZGV4LmpzIiwiL1VzZXJzL3JldHJvZm94L2xhYi9qc2NvbmZhci13b3Jrc2hvcC9tb2R1bGUtMDIvYS5tYWtlL25vZGVfbW9kdWxlcy93cGNvbS9saWIvYmF0Y2guanMiLCIvVXNlcnMvcmV0cm9mb3gvbGFiL2pzY29uZmFyLXdvcmtzaG9wL21vZHVsZS0wMi9hLm1ha2Uvbm9kZV9tb2R1bGVzL3dwY29tL2xpYi9jYXRlZ29yeS5qcyIsIi9Vc2Vycy9yZXRyb2ZveC9sYWIvanNjb25mYXItd29ya3Nob3AvbW9kdWxlLTAyL2EubWFrZS9ub2RlX21vZHVsZXMvd3Bjb20vbGliL2NvbW1lbnQuanMiLCIvVXNlcnMvcmV0cm9mb3gvbGFiL2pzY29uZmFyLXdvcmtzaG9wL21vZHVsZS0wMi9hLm1ha2Uvbm9kZV9tb2R1bGVzL3dwY29tL2xpYi9jb21tZW50bGlrZS5qcyIsIi9Vc2Vycy9yZXRyb2ZveC9sYWIvanNjb25mYXItd29ya3Nob3AvbW9kdWxlLTAyL2EubWFrZS9ub2RlX21vZHVsZXMvd3Bjb20vbGliL2ZvbGxvdy5qcyIsIi9Vc2Vycy9yZXRyb2ZveC9sYWIvanNjb25mYXItd29ya3Nob3AvbW9kdWxlLTAyL2EubWFrZS9ub2RlX21vZHVsZXMvd3Bjb20vbGliL2xpa2UuanMiLCIvVXNlcnMvcmV0cm9mb3gvbGFiL2pzY29uZmFyLXdvcmtzaG9wL21vZHVsZS0wMi9hLm1ha2Uvbm9kZV9tb2R1bGVzL3dwY29tL2xpYi9tZS5qcyIsIi9Vc2Vycy9yZXRyb2ZveC9sYWIvanNjb25mYXItd29ya3Nob3AvbW9kdWxlLTAyL2EubWFrZS9ub2RlX21vZHVsZXMvd3Bjb20vbGliL21lZGlhLmpzIiwiL1VzZXJzL3JldHJvZm94L2xhYi9qc2NvbmZhci13b3Jrc2hvcC9tb2R1bGUtMDIvYS5tYWtlL25vZGVfbW9kdWxlcy93cGNvbS9saWIvcG9zdC5qcyIsIi9Vc2Vycy9yZXRyb2ZveC9sYWIvanNjb25mYXItd29ya3Nob3AvbW9kdWxlLTAyL2EubWFrZS9ub2RlX21vZHVsZXMvd3Bjb20vbGliL3JlYmxvZy5qcyIsIi9Vc2Vycy9yZXRyb2ZveC9sYWIvanNjb25mYXItd29ya3Nob3AvbW9kdWxlLTAyL2EubWFrZS9ub2RlX21vZHVsZXMvd3Bjb20vbGliL3NpdGUuanMiLCIvVXNlcnMvcmV0cm9mb3gvbGFiL2pzY29uZmFyLXdvcmtzaG9wL21vZHVsZS0wMi9hLm1ha2Uvbm9kZV9tb2R1bGVzL3dwY29tL2xpYi90YWcuanMiLCIvVXNlcnMvcmV0cm9mb3gvbGFiL2pzY29uZmFyLXdvcmtzaG9wL21vZHVsZS0wMi9hLm1ha2Uvbm9kZV9tb2R1bGVzL3dwY29tL25vZGVfbW9kdWxlcy9kZWJ1Zy9icm93c2VyLmpzIiwiL1VzZXJzL3JldHJvZm94L2xhYi9qc2NvbmZhci13b3Jrc2hvcC9tb2R1bGUtMDIvYS5tYWtlL25vZGVfbW9kdWxlcy93cGNvbS9ub2RlX21vZHVsZXMvZGVidWcvZGVidWcuanMiLCIvVXNlcnMvcmV0cm9mb3gvbGFiL2pzY29uZmFyLXdvcmtzaG9wL21vZHVsZS0wMi9hLm1ha2Uvbm9kZV9tb2R1bGVzL3dwY29tL25vZGVfbW9kdWxlcy9kZWJ1Zy9ub2RlX21vZHVsZXMvbXMvaW5kZXguanMiLCIvVXNlcnMvcmV0cm9mb3gvbGFiL2pzY29uZmFyLXdvcmtzaG9wL21vZHVsZS0wMi9hLm1ha2Uvbm9kZV9tb2R1bGVzL3dwY29tL25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwiL1VzZXJzL3JldHJvZm94L2xhYi9qc2NvbmZhci13b3Jrc2hvcC9tb2R1bGUtMDIvYS5tYWtlL25vZGVfbW9kdWxlcy93cGNvbS9ub2RlX21vZHVsZXMvd3Bjb20teGhyLXJlcXVlc3QvaW5kZXguanMiLCIvVXNlcnMvcmV0cm9mb3gvbGFiL2pzY29uZmFyLXdvcmtzaG9wL21vZHVsZS0wMi9hLm1ha2Uvbm9kZV9tb2R1bGVzL3dwY29tL25vZGVfbW9kdWxlcy93cGNvbS14aHItcmVxdWVzdC9ub2RlX21vZHVsZXMvc3VwZXJhZ2VudC9saWIvY2xpZW50LmpzIiwiL1VzZXJzL3JldHJvZm94L2xhYi9qc2NvbmZhci13b3Jrc2hvcC9tb2R1bGUtMDIvYS5tYWtlL25vZGVfbW9kdWxlcy93cGNvbS9ub2RlX21vZHVsZXMvd3Bjb20teGhyLXJlcXVlc3Qvbm9kZV9tb2R1bGVzL3N1cGVyYWdlbnQvbm9kZV9tb2R1bGVzL2NvbXBvbmVudC1lbWl0dGVyL2luZGV4LmpzIiwiL1VzZXJzL3JldHJvZm94L2xhYi9qc2NvbmZhci13b3Jrc2hvcC9tb2R1bGUtMDIvYS5tYWtlL25vZGVfbW9kdWxlcy93cGNvbS9ub2RlX21vZHVsZXMvd3Bjb20teGhyLXJlcXVlc3Qvbm9kZV9tb2R1bGVzL3N1cGVyYWdlbnQvbm9kZV9tb2R1bGVzL3JlZHVjZS1jb21wb25lbnQvaW5kZXguanMiLCIvVXNlcnMvcmV0cm9mb3gvbGFiL2pzY29uZmFyLXdvcmtzaG9wL21vZHVsZS0wMi9hLm1ha2Uvbm9kZV9tb2R1bGVzL3dwY29tL3dwY29tK3hoci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlxuLyoqXG4gKiBKU0NPTkZBUiBhcHBsaWNhdGlvblxuICovXG5cbnZhciB3cGNvbSA9IHJlcXVpcmUoJ3dwY29tJyk7XG4iLG51bGwsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBNZSA9IHJlcXVpcmUoJy4vbGliL21lJyk7XG52YXIgU2l0ZSA9IHJlcXVpcmUoJy4vbGliL3NpdGUnKTtcbnZhciBCYXRjaCA9IHJlcXVpcmUoJy4vbGliL2JhdGNoJyk7XG52YXIgZGVidWcgPSByZXF1aXJlKCdkZWJ1ZycpKCd3cGNvbScpO1xuXG4vKipcbiAqIFdvcmRQcmVzcy5jb20gUkVTVCBBUEkgY2xhc3MuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBXUENPTShyZXF1ZXN0KXtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFdQQ09NKSkgcmV0dXJuIG5ldyBXUENPTShyZXF1ZXN0KTtcbiAgaWYgKCdmdW5jdGlvbicgIT09IHR5cGVvZiByZXF1ZXN0KSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignYSBgcmVxdWVzdGAgV1AuY29tIGZ1bmN0aW9uIG11c3QgYmUgcGFzc2VkIGluJyk7XG4gIH1cblxuICB0aGlzLnJlcXVlc3QgPSByZXF1ZXN0O1xufVxuXG4vKipcbiAqIEdldCBgTWVgIG9iamVjdCBpbnN0YW5jZVxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuV1BDT00ucHJvdG90eXBlLm1lID0gZnVuY3Rpb24oKXtcbiAgcmV0dXJuIG5ldyBNZSh0aGlzKTtcbn07XG5cbi8qKlxuICogR2V0IGBTaXRlYCBvYmplY3QgaW5zdGFuY2VcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gaWRcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuV1BDT00ucHJvdG90eXBlLnNpdGUgPSBmdW5jdGlvbihpZCl7XG4gIHJldHVybiBuZXcgU2l0ZShpZCwgdGhpcyk7XG59O1xuXG5cbldQQ09NLnByb3RvdHlwZS5iYXRjaCA9IGZ1bmN0aW9uKCl7XG4gIHJldHVybiBuZXcgQmF0Y2godGhpcyk7XG59O1xuXG4vKipcbiAqIExpc3QgRnJlc2hseSBQcmVzc2VkIFBvc3RzXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IFtxdWVyeV1cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIGNhbGxiYWNrIGZ1bmN0aW9uXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbldQQ09NLnByb3RvdHlwZS5mcmVzaGx5UHJlc3NlZCA9IGZ1bmN0aW9uKHF1ZXJ5LCBmbil7XG4gIHJldHVybiB0aGlzLnNlbmRSZXF1ZXN0KCcvZnJlc2hseS1wcmVzc2VkJywgcXVlcnksIG51bGwsIGZuKTtcbn07XG5cbi8qKlxuICogUmVxdWVzdCB0byBXb3JkUHJlc3MgUkVTVCBBUElcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R9IHBhcmFtc1xuICogQHBhcmFtIHtPYmplY3R9IFtxdWVyeV1cbiAqIEBwYXJhbSB7T2JqZWN0fSBbYm9keV1cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5XUENPTS5wcm90b3R5cGUuc2VuZFJlcXVlc3QgPSBmdW5jdGlvbiAocGFyYW1zLCBxdWVyeSwgYm9keSwgZm4pe1xuICAvLyBgcGFyYW1zYCBjYW4gYmUganVzdCB0aGUgcGF0aCAoU3RyaW5nKVxuICBpZiAoJ3N0cmluZycgPT0gdHlwZW9mIHBhcmFtcykge1xuICAgIHBhcmFtcyA9IHsgcGF0aDogcGFyYW1zIH07XG4gIH1cblxuICBkZWJ1Zygnc2VuZFJlcXVlc3QoJW8pJywgcGFyYW1zLnBhdGgpO1xuXG4gIC8vIHNldCBgbWV0aG9kYCByZXF1ZXN0IHBhcmFtXG4gIHBhcmFtcy5tZXRob2QgPSAocGFyYW1zLm1ldGhvZCB8fCAnZ2V0JykudG9VcHBlckNhc2UoKTtcblxuICAvLyBgcXVlcnlgIGlzIG9wdGlvbmFsXG4gIGlmICgnZnVuY3Rpb24nID09IHR5cGVvZiBxdWVyeSkge1xuICAgIGZuID0gcXVlcnk7XG4gICAgcXVlcnkgPSBudWxsO1xuICB9XG5cbiAgLy8gYGJvZHlgIGlzIG9wdGlvbmFsXG4gIGlmICgnZnVuY3Rpb24nID09IHR5cGVvZiBib2R5KSB7XG4gICAgZm4gPSBib2R5O1xuICAgIGJvZHkgPSBudWxsO1xuICB9XG5cbiAgLy8gcGFzcyBgcXVlcnlgIGFuZC9vciBgYm9keWAgdG8gcmVxdWVzdCBwYXJhbXNcbiAgaWYgKHF1ZXJ5KSB7XG4gICAgcGFyYW1zLnF1ZXJ5ID0gcXVlcnk7XG4gICAgZGVsZXRlIHF1ZXJ5LmFwaVZlcnNpb247XG4gIH1cblxuICBpZiAoYm9keSkgcGFyYW1zLmJvZHkgPSBib2R5O1xuXG4gIC8vIGNhbGxiYWNrIGBmbmAgZnVuY3Rpb24gaXMgb3B0aW9uYWxcbiAgaWYgKCFmbikgZm4gPSBmdW5jdGlvbihlcnIpeyBpZiAoZXJyKSB0aHJvdyBlcnI7IH07XG5cbiAgLy8gcmVxdWVzdCBtZXRob2RcbiAgcmV0dXJuIHRoaXMucmVxdWVzdChwYXJhbXMsIGZuKTtcbn07XG5cbi8qKlxuICogRXhwb3NlIGBXUENPTWAgbW9kdWxlXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBXUENPTTtcbiIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBkZWJ1ZyA9IHJlcXVpcmUoJ2RlYnVnJykoJ3dwY29tOmJhdGNoJyk7XG5cbi8qKlxuICogQ3JlYXRlIGEgYEJhdGNoYCBpbnN0YW5jZVxuICpcbiAqIEBwYXJhbSB7V1BDT019IHdwY29tXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIEJhdGNoKHdwY29tKXtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEJhdGNoKSkgcmV0dXJuIG5ldyBCYXRjaCh3cGNvbSk7XG4gIHRoaXMud3Bjb20gPSB3cGNvbTtcblxuICB0aGlzLnVybHMgPSBbXTtcbn1cblxuLyoqXG4gKiBBZGQgdXJsIHRvIGJhdGNoIHJlcXVlc3RzXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHVybFxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5CYXRjaC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24odXJsKXtcbiAgdGhpcy51cmxzLnB1c2godXJsKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJ1biB0aGUgYmF0Y2ggcmVxdWVzdFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBbcXVlcnldXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5CYXRjaC5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24ocXVlcnksIGZuKXtcbiAgLy8gYWRkIHVybHMgdG8gcXVlcnkgb2JqZWN0XG4gIGlmICgnZnVuY3Rpb24nID09IHR5cGVvZiBxdWVyeSkge1xuICAgIGZuID0gcXVlcnk7XG4gICAgcXVlcnkgPSB7fTtcbiAgfVxuICBxdWVyeS51cmxzID0gdGhpcy51cmxzO1xuXG4gIHJldHVybiB0aGlzLndwY29tLnNlbmRSZXF1ZXN0KCcvYmF0Y2gnLCBxdWVyeSwgbnVsbCwgZm4pO1xufTtcblxuLyoqXG4gKiBFeHBvc2UgYEJhdGNoYCBtb2R1bGVcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJhdGNoO1xuIiwiXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIGRlYnVnID0gcmVxdWlyZSgnZGVidWcnKSgnd3Bjb206Y2F0ZWdvcnknKTtcblxuLyoqXG4gKiBDYXRlZ29yeSBtZXRob2RzXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IFtzbHVnXVxuICogQHBhcmFtIHtTdHJpbmd9IHNpZCBzaXRlIGlkXG4gKiBAcGFyYW0ge1dQQ09NfSB3cGNvbVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBDYXRlZ29yeShzbHVnLCBzaWQsIHdwY29tKXtcbiAgaWYgKCFzaWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2BzaWRlIGlkYCBpcyBub3QgY29ycmVjdGx5IGRlZmluZWQnKTtcbiAgfVxuXG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBDYXRlZ29yeSkpIHJldHVybiBuZXcgQ2F0ZWdvcnkoc2x1Zywgc2lkLCB3cGNvbSk7XG5cbiAgdGhpcy53cGNvbSA9IHdwY29tO1xuICB0aGlzLl9zaWQgPSBzaWQ7XG4gIHRoaXMuX3NsdWcgPSBzbHVnO1xufVxuXG4vKipcbiAqIFNldCBjYXRlZ29yeSBgc2x1Z2BcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc2x1Z1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5DYXRlZ29yeS5wcm90b3R5cGUuc2x1ZyA9IGZ1bmN0aW9uKHNsdWcpe1xuICB0aGlzLl9zbHVnID0gc2x1Zztcbn07XG5cbi8qKlxuICogR2V0IGNhdGVnb3J5XG4gKlxuICogQHBhcmFtIHtPYmplY3R9IFtxdWVyeV1cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkNhdGVnb3J5LnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihxdWVyeSwgZm4pe1xuICB2YXIgcGF0aCA9ICcvc2l0ZXMvJyArIHRoaXMuX3NpZCArICcvY2F0ZWdvcmllcy9zbHVnOicgKyB0aGlzLl9zbHVnO1xuICByZXR1cm4gdGhpcy53cGNvbS5zZW5kUmVxdWVzdChwYXRoLCBxdWVyeSwgbnVsbCwgZm4pO1xufTtcblxuLyoqXG4gKiBBZGQgY2F0ZWdvcnlcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gYm9keVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuQ2F0ZWdvcnkucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKGJvZHksIGZuKXtcbiAgdmFyIHBhdGggPSAnL3NpdGVzLycgKyB0aGlzLl9zaWQgKyAnL2NhdGVnb3JpZXMvbmV3JztcbiAgcmV0dXJuIHRoaXMud3Bjb20uc2VuZFJlcXVlc3QoeyBwYXRoOiBwYXRoLCBtZXRob2Q6ICdwb3N0JyB9LCBudWxsLCBib2R5LCBmbik7XG59O1xuXG4vKipcbiAqIEVkaXQgY2F0ZWdvcnlcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gYm9keVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuQ2F0ZWdvcnkucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKGJvZHksIGZuKXtcbiAgdmFyIHBhdGggPSAnL3NpdGVzLycgKyB0aGlzLl9zaWQgKyAnL2NhdGVnb3JpZXMvc2x1ZzonICsgdGhpcy5fc2x1ZztcbiAgcmV0dXJuIHRoaXMud3Bjb20uc2VuZFJlcXVlc3QoeyBwYXRoOiBwYXRoLCBtZXRob2Q6ICdwb3N0JyB9LCBudWxsLCBib2R5LCBmbik7XG59O1xuXG4vKipcbiAqIERlbGV0ZSBjYXRlZ29yeVxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkNhdGVnb3J5LnByb3RvdHlwZVsnZGVsZXRlJ10gPVxuQ2F0ZWdvcnkucHJvdG90eXBlLmRlbCA9IGZ1bmN0aW9uKGZuKXtcbiAgdmFyIHBhdGggPSAnL3NpdGVzLycgKyB0aGlzLl9zaWQgKyAnL2NhdGVnb3JpZXMvc2x1ZzonICsgdGhpcy5fc2x1ZyArICcvZGVsZXRlJztcbiAgcmV0dXJuIHRoaXMud3Bjb20uc2VuZFJlcXVlc3QoeyBwYXRoOiBwYXRoLCBtZXRob2Q6ICdwb3N0JyB9LCBudWxsLCBudWxsLCBmbik7XG59O1xuXG4vKipcbiAqIEV4cG9zZSBgQ2F0ZWdvcnlgIG1vZHVsZVxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gQ2F0ZWdvcnk7XG4iLCJcbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgQ29tbWVudExpa2UgPSByZXF1aXJlKCcuL2NvbW1lbnRsaWtlJyk7XG52YXIgZGVidWcgPSByZXF1aXJlKCdkZWJ1ZycpKCd3cGNvbTpjb21tZW50Jyk7XG5cbi8qKlxuICogQ29tbWVudCBtZXRob2RzXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IFtjaWRdIGNvbW1lbnQgaWRcbiAqIEBwYXJhbSB7U3RyaW5nfSBbcGlkXSBwb3N0IGlkXG4gKiBAcGFyYW0ge1N0cmluZ30gc2lkIHNpdGUgaWRcbiAqIEBwYXJhbSB7V1BDT019IHdwY29tXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIENvbW1lbnQoY2lkLCBwaWQsIHNpZCwgd3Bjb20pe1xuICBpZiAoIXNpZCkge1xuICAgIHRocm93IG5ldyBFcnJvcignYHNpZGUgaWRgIGlzIG5vdCBjb3JyZWN0bHkgZGVmaW5lZCcpO1xuICB9XG5cbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIENvbW1lbnQpKSByZXR1cm4gbmV3IENvbW1lbnQoY2lkLCBwaWQsIHNpZCwgd3Bjb20pO1xuXG4gIHRoaXMud3Bjb20gPSB3cGNvbTtcbiAgdGhpcy5fY2lkID0gY2lkO1xuICB0aGlzLl9waWQgPSBwaWQ7XG4gIHRoaXMuX3NpZCA9IHNpZDtcbn1cblxuLyoqXG4gKiBSZXR1cm4gYSBzaW5nbGUgQ29tbWVudFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBbcXVlcnldXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5Db21tZW50LnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihxdWVyeSwgZm4pe1xuICB2YXIgcGF0aCA9ICcvc2l0ZXMvJyArIHRoaXMuX3NpZCArICcvY29tbWVudHMvJyArIHRoaXMuX2NpZDtcbiAgcmV0dXJuIHRoaXMud3Bjb20uc2VuZFJlcXVlc3QocGF0aCwgcXVlcnksIG51bGwsIGZuKTtcbn07XG5cbi8qKlxuICogUmV0dXJuIHJlY2VudCBjb21tZW50cyBmb3IgYSBwb3N0XG4gKlxuICogQHBhcmFtIHtPYmplY3R9IFtxdWVyeV1cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkNvbW1lbnQucHJvdG90eXBlLnJlcGxpZXMgPSBmdW5jdGlvbihxdWVyeSwgZm4pe1xuICB2YXIgcGF0aCA9ICcvc2l0ZXMvJyArIHRoaXMuX3NpZCArICcvcG9zdHMvJyArIHRoaXMuX3BpZCArICcvcmVwbGllcy8nO1xuICByZXR1cm4gdGhpcy53cGNvbS5zZW5kUmVxdWVzdChwYXRoLCBxdWVyeSwgbnVsbCwgZm4pO1xufTtcblxuLyoqXG4gKiBDcmVhdGUgYSBjb21tZW50IG9uIGEgcG9zdFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdH0gYm9keVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuQ29tbWVudC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24oYm9keSwgZm4pe1xuICBib2R5ID0gJ3N0cmluZycgPT0gdHlwZW9mIGJvZHkgPyB7IGNvbnRlbnQ6IGJvZHkgfSA6IGJvZHk7XG5cbiAgdmFyIHBhdGggPSAnL3NpdGVzLycgKyB0aGlzLl9zaWQgKyAnL3Bvc3RzLycgKyB0aGlzLl9waWQgKyAnL3JlcGxpZXMvbmV3JztcbiAgcmV0dXJuIHRoaXMud3Bjb20uc2VuZFJlcXVlc3QoeyBwYXRoOiBwYXRoLCBtZXRob2Q6ICdwb3N0JyB9LCBudWxsLCBib2R5LCBmbik7XG59O1xuXG4vKipcbiAqIEVkaXQgYSBjb21tZW50XG4gKlxuIHIgQHBhcmFtIHtTdHJpbmd8T2JqZWN0fSBib2R5XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5Db21tZW50LnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbihib2R5LCBmbil7XG4gIGJvZHkgPSAnc3RyaW5nJyA9PSB0eXBlb2YgYm9keSA/IHsgY29udGVudDogYm9keSB9IDogYm9keTtcblxuICB2YXIgcGF0aCA9ICcvc2l0ZXMvJyArIHRoaXMuX3NpZCArICcvY29tbWVudHMvJyArIHRoaXMuX2NpZDtcbiAgcmV0dXJuIHRoaXMud3Bjb20uc2VuZFJlcXVlc3QoeyBwYXRoOiBwYXRoLCBtZXRob2Q6ICdwb3N0JyB9LCBudWxsLCBib2R5LCBmbik7XG59O1xuXG4vKipcbiAqIENyZWF0ZSBhIENvbW1lbnQgYXMgYSByZXBseSB0byBhbm90aGVyIENvbW1lbnRcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R9IGJvZHlcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkNvbW1lbnQucHJvdG90eXBlLnJlcGx5ID0gZnVuY3Rpb24oYm9keSwgZm4pe1xuICBib2R5ID0gJ3N0cmluZycgPT0gdHlwZW9mIGJvZHkgPyB7IGNvbnRlbnQ6IGJvZHkgfSA6IGJvZHk7XG5cbiAgdmFyIHBhdGggPSAnL3NpdGVzLycgKyB0aGlzLl9zaWQgKyAnL2NvbW1lbnRzLycgKyB0aGlzLl9jaWQgKyAnL3JlcGxpZXMvbmV3JztcbiAgcmV0dXJuIHRoaXMud3Bjb20uc2VuZFJlcXVlc3QoeyBwYXRoOiBwYXRoLCBtZXRob2Q6ICdwb3N0JyB9LCBudWxsLCBib2R5LCBmbik7XG59O1xuXG4vKipcbiAqIERlbGV0ZSBhIGNvbW1lbnRcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5Db21tZW50LnByb3RvdHlwZVsnZGVsZXRlJ10gPVxuQ29tbWVudC5wcm90b3R5cGUuZGVsID0gZnVuY3Rpb24oZm4pe1xuICB2YXIgcGF0aCA9ICcvc2l0ZXMvJyArIHRoaXMuX3NpZCArICcvY29tbWVudHMvJyArIHRoaXMuX2NpZCArICcvZGVsZXRlJztcbiAgcmV0dXJuIHRoaXMud3Bjb20uc2VuZFJlcXVlc3QoeyBwYXRoOiBwYXRoLCBtZXRob2Q6ICdwb3N0JyB9LCBudWxsLCBudWxsLCBmbik7XG59O1xuXG4vKipcbiAqIENyZWF0ZSBhIGBDb21tZW50TGlrZWAgaW5zdGFuY2VcbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkNvbW1lbnQucHJvdG90eXBlLmxpa2UgPSBmdW5jdGlvbigpe1xuICByZXR1cm4gQ29tbWVudExpa2UodGhpcy5fY2lkLCB0aGlzLl9zaWQsIHRoaXMud3Bjb20pO1xufTtcblxuLyoqXG4gKiBHZXQgY29tbWVudCBsaWtlcyBsaXN0XG4gKlxuICogQHBhcmFtIHtPYmplY3R9IFtxdWVyeV1cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkNvbW1lbnQucHJvdG90eXBlLmxpa2VzTGlzdCA9IGZ1bmN0aW9uKHF1ZXJ5LCBmbil7XG4gIHZhciBwYXRoID0gJy9zaXRlcy8nICsgdGhpcy5fc2lkICsgJy9jb21tZW50cy8nICsgdGhpcy5fY2lkICsgJy9saWtlcyc7XG4gIHJldHVybiB0aGlzLndwY29tLnNlbmRSZXF1ZXN0KHBhdGgsIHF1ZXJ5LCBudWxsLCBmbik7XG59O1xuXG4vKipcbiAqIEV4cG9zZSBgQ29tbWVudGAgbW9kdWxlXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBDb21tZW50O1xuIiwiXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIGRlYnVnID0gcmVxdWlyZSgnZGVidWcnKSgnd3Bjb206Y29tbWVudGxpa2UnKTtcblxuLyoqXG4gKiBDb21tZW50TGlrZSBtZXRob2RzXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGNpZCBjb21tZW50IGlkXG4gKiBAcGFyYW0ge1N0cmluZ30gc2lkIHNpdGUgaWRcbiAqIEBwYXJhbSB7V1BDT019IHdwY29tXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIENvbW1lbnRMaWtlKGNpZCwgc2lkLCB3cGNvbSl7XG4gIGlmICghc2lkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdgc2lkZSBpZGAgaXMgbm90IGNvcnJlY3RseSBkZWZpbmVkJyk7XG4gIH1cblxuICBpZiAoIWNpZCkge1xuICAgIHRocm93IG5ldyBFcnJvcignYGNvbW1lbnQgaWRgIGlzIG5vdCBjb3JyZWN0bHkgZGVmaW5lZCcpO1xuICB9XG5cbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIENvbW1lbnRMaWtlKSkgcmV0dXJuIG5ldyBDb21tZW50TGlrZShjaWQsIHNpZCwgd3Bjb20pO1xuXG4gIHRoaXMud3Bjb20gPSB3cGNvbTtcbiAgdGhpcy5fY2lkID0gY2lkO1xuICB0aGlzLl9zaWQgPSBzaWQ7XG59XG5cbi8qKlxuICogR2V0IHlvdXIgTGlrZSBzdGF0dXMgZm9yIGEgQ29tbWVudFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBbcXVlcnldXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5Db21tZW50TGlrZS5wcm90b3R5cGUuc3RhdGUgPVxuQ29tbWVudExpa2UucHJvdG90eXBlLm1pbmUgPSBmdW5jdGlvbihxdWVyeSwgZm4pe1xuICB2YXIgcGF0aCA9ICcvc2l0ZXMvJyArIHRoaXMuX3NpZCArICcvY29tbWVudHMvJyArIHRoaXMuX2NpZCArICcvbGlrZXMvbWluZSc7XG4gIHJldHVybiB0aGlzLndwY29tLnNlbmRSZXF1ZXN0KHBhdGgsIHF1ZXJ5LCBudWxsLCBmbik7XG59O1xuXG4vKipcbiAqIExpa2UgYSBjb21tZW50XG4gKlxuICogQHBhcmFtIHtPYmplY3R9IFtxdWVyeV1cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkNvbW1lbnRMaWtlLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbihxdWVyeSwgZm4pe1xuICB2YXIgcGF0aCA9ICcvc2l0ZXMvJyArIHRoaXMuX3NpZCArICcvY29tbWVudHMvJyArIHRoaXMuX2NpZCArICcvbGlrZXMvbmV3JztcbiAgcmV0dXJuIHRoaXMud3Bjb20uc2VuZFJlcXVlc3QoeyBwYXRoOiBwYXRoLCBtZXRob2Q6ICdwb3N0JyB9LCBxdWVyeSwgbnVsbCwgZm4pO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgeW91ciBMaWtlIGZyb20gYSBDb21tZW50XG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuQ29tbWVudExpa2UucHJvdG90eXBlWydkZWxldGUnXSA9XG5Db21tZW50TGlrZS5wcm90b3R5cGUuZGVsID0gZnVuY3Rpb24oZm4pe1xuICB2YXIgcGF0aCA9ICcvc2l0ZXMvJyArIHRoaXMuX3NpZCArICcvY29tbWVudHMvJyArIHRoaXMuX2NpZCArICcvbGlrZXMvbWluZS9kZWxldGUnO1xuICByZXR1cm4gdGhpcy53cGNvbS5zZW5kUmVxdWVzdCh7IHBhdGg6IHBhdGgsIG1ldGhvZDogJ3Bvc3QnIH0sIG51bGwsIG51bGwsIGZuKTtcbn07XG5cbi8qKlxuICogRXhwb3NlIGBDb21tZW50TGlrZWAgbW9kdWxlXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBDb21tZW50TGlrZTtcbiIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBkZWJ1ZyA9IHJlcXVpcmUoJ2RlYnVnJykoJ3dwY29tOmZvbGxvdycpO1xuXG4vKipcbiAqIEZvbGxvdyBcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc2l0ZV9pZCAtIHNpdGUgaWRcbiAqIEBwYXJhbSB7V1BDT019IHdwY29tXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIEZvbGxvdyhzaXRlX2lkLCB3cGNvbSl7XG4gIGlmICghc2l0ZV9pZCkge1xuICAgIHRocm93IG5ldyBFcnJvcignYHNpdGUgaWRgIGlzIG5vdCBjb3JyZWN0bHkgZGVmaW5lZCcpO1xuICB9XG5cbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEZvbGxvdykpIHJldHVybiBuZXcgRm9sbG93KHNpdGVfaWQsIHdwY29tKTtcblxuICB0aGlzLndwY29tID0gd3Bjb207XG4gIHRoaXMuX3NpZCA9IHNpdGVfaWQ7XG59XG5cbi8qKlxuICogRm9sbG93IHRoZSBzaXRlXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IFtxdWVyeV1cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKi9cblxuRm9sbG93LnByb3RvdHlwZS5mb2xsb3cgPVxuRm9sbG93LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbihxdWVyeSwgZm4pIHtcbiAgdmFyIHBhdGggPSAnL3NpdGVzLycgKyB0aGlzLl9zaWQgKyAnL2ZvbGxvd3MvbmV3JztcbiAgcmV0dXJuIHRoaXMud3Bjb20uc2VuZFJlcXVlc3QoeyBtZXRob2Q6ICdQT1NUJywgcGF0aDogcGF0aCB9LCBxdWVyeSwgbnVsbCwgZm4pO1xufTtcblxuLyoqXG4gKiBVbmZvbGxvdyB0aGUgc2l0ZVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBbcXVlcnldXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICovXG5cbkZvbGxvdy5wcm90b3R5cGUudW5mb2xsb3cgPVxuRm9sbG93LnByb3RvdHlwZS5kZWwgPSBmdW5jdGlvbihxdWVyeSwgZm4pIHtcbiAgdmFyIHBhdGggPSAnL3NpdGVzLycgKyB0aGlzLl9zaWQgKyAnL2ZvbGxvd3MvbWluZS9kZWxldGUnO1xuICByZXR1cm4gdGhpcy53cGNvbS5zZW5kUmVxdWVzdCh7bWV0aG9kOiAnUE9TVCcsIHBhdGg6IHBhdGh9LCBxdWVyeSwgbnVsbCwgZm4pO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIGZvbGxvdyBzdGF0dXMgZm9yIGN1cnJlbnQgXG4gKiB1c2VyIG9uIGN1cnJlbnQgYmxvZyBzaXRlXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IFtxdWVyeV1cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKi9cblxuRm9sbG93LnByb3RvdHlwZS5zdGF0ZSA9XG5Gb2xsb3cucHJvdG90eXBlLm1pbmUgPSBmdW5jdGlvbihxdWVyeSwgZm4pIHtcbiAgdmFyIHBhdGggPSAnL3NpdGVzLycgKyB0aGlzLl9zaWQgKyAnL2ZvbGxvd3MvbWluZSc7XG4gIHJldHVybiB0aGlzLndwY29tLnNlbmRSZXF1ZXN0KHBhdGgsIHF1ZXJ5LCBudWxsLCBmbik7XG59O1xuXG4vKipcbiAqIEV4cG9zZSBgRm9sbG93YCBtb2R1bGVcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZvbGxvdztcbiIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBkZWJ1ZyA9IHJlcXVpcmUoJ2RlYnVnJykoJ3dwY29tOmxpa2UnKTtcblxuLyoqXG4gKiBMaWtlIG1ldGhvZHNcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcGlkIHBvc3QgaWRcbiAqIEBwYXJhbSB7U3RyaW5nfSBzaWQgc2l0ZSBpZFxuICogQHBhcmFtIHtXUENPTX0gd3Bjb21cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gTGlrZShwaWQsIHNpZCwgd3Bjb20pe1xuICBpZiAoIXNpZCkge1xuICAgIHRocm93IG5ldyBFcnJvcignYHNpZGUgaWRgIGlzIG5vdCBjb3JyZWN0bHkgZGVmaW5lZCcpO1xuICB9XG5cbiAgaWYgKCFwaWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2Bwb3N0IGlkYCBpcyBub3QgY29ycmVjdGx5IGRlZmluZWQnKTtcbiAgfVxuXG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBMaWtlKSkgcmV0dXJuIG5ldyBMaWtlKHBpZCwgc2lkLCB3cGNvbSk7XG5cbiAgdGhpcy53cGNvbSA9IHdwY29tO1xuICB0aGlzLl9waWQgPSBwaWQ7XG4gIHRoaXMuX3NpZCA9IHNpZDtcbn1cblxuLyoqXG4gKiBHZXQgeW91ciBMaWtlIHN0YXR1cyBmb3IgYSBQb3N0XG4gKlxuICogQHBhcmFtIHtPYmplY3R9IFtxdWVyeV1cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkxpa2UucHJvdG90eXBlLnN0YXRlID1cbkxpa2UucHJvdG90eXBlLm1pbmUgPSBmdW5jdGlvbihxdWVyeSwgZm4pe1xuICB2YXIgcGF0aCA9ICcvc2l0ZXMvJyArIHRoaXMuX3NpZCArICcvcG9zdHMvJyArIHRoaXMuX3BpZCArICcvbGlrZXMvbWluZSc7XG4gIHJldHVybiB0aGlzLndwY29tLnNlbmRSZXF1ZXN0KHBhdGgsIHF1ZXJ5LCBudWxsLCBmbik7XG59O1xuXG4vKipcbiAqIExpa2UgYSBwb3N0XG4gKlxuICogQHBhcmFtIHtPYmplY3R9IFtxdWVyeV1cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkxpa2UucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKHF1ZXJ5LCBmbil7XG4gIHZhciBwYXRoID0gJy9zaXRlcy8nICsgdGhpcy5fc2lkICsgJy9wb3N0cy8nICsgdGhpcy5fcGlkICsgJy9saWtlcy9uZXcnO1xuICByZXR1cm4gdGhpcy53cGNvbS5zZW5kUmVxdWVzdCh7IHBhdGg6IHBhdGgsIG1ldGhvZDogJ3Bvc3QnIH0sIHF1ZXJ5LCBudWxsLCBmbik7XG59O1xuXG4vKipcbiAqIFJlbW92ZSB5b3VyIExpa2UgZnJvbSBhIFBvc3RcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5MaWtlLnByb3RvdHlwZVsnZGVsZXRlJ10gPVxuTGlrZS5wcm90b3R5cGUuZGVsID0gZnVuY3Rpb24oZm4pe1xuICB2YXIgcGF0aCA9ICcvc2l0ZXMvJyArIHRoaXMuX3NpZCArICcvcG9zdHMvJyArIHRoaXMuX3BpZCArICcvbGlrZXMvbWluZS9kZWxldGUnO1xuICByZXR1cm4gdGhpcy53cGNvbS5zZW5kUmVxdWVzdCh7IHBhdGg6IHBhdGgsIG1ldGhvZDogJ3Bvc3QnIH0sIG51bGwsIG51bGwsIGZuKTtcbn07XG5cbi8qKlxuICogRXhwb3NlIGBMaWtlYCBtb2R1bGVcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IExpa2U7XG4iLCJcbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgZGVidWcgPSByZXF1aXJlKCdkZWJ1ZycpKCd3cGNvbTptZScpO1xuXG4vKipcbiAqIENyZWF0ZSBhIGBNZWAgaW5zdGFuY2VcbiAqXG4gKiBAcGFyYW0ge1dQQ09NfSB3cGNvbVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBNZSh3cGNvbSl7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBNZSkpIHJldHVybiBuZXcgTWUod3Bjb20pO1xuICB0aGlzLndwY29tID0gd3Bjb207XG59XG5cbi8qKlxuICogTWV0YSBkYXRhIGFib3V0IGF1dGggdG9rZW4ncyBVc2VyXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IFtxdWVyeV1cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbk1lLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihxdWVyeSwgZm4pe1xuICByZXR1cm4gdGhpcy53cGNvbS5zZW5kUmVxdWVzdCgnL21lJywgcXVlcnksIG51bGwsIGZuKTtcbn07XG5cbi8qKlxuICogQSBsaXN0IG9mIHRoZSBjdXJyZW50IHVzZXIncyBzaXRlc1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBbcXVlcnldXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuTWUucHJvdG90eXBlLnNpdGVzID0gZnVuY3Rpb24ocXVlcnksIGZuKXtcbiAgcmV0dXJuIHRoaXMud3Bjb20uc2VuZFJlcXVlc3QoJy9tZS9zaXRlcycsIHF1ZXJ5LCBudWxsLCBmbik7XG59O1xuXG4vKipcbiAqIExpc3QgdGhlIGN1cnJlbnRseSBhdXRob3JpemVkIHVzZXIncyBsaWtlc1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBbcXVlcnldXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5NZS5wcm90b3R5cGUubGlrZXMgPSBmdW5jdGlvbihxdWVyeSwgZm4pe1xuICByZXR1cm4gdGhpcy53cGNvbS5zZW5kUmVxdWVzdCgnL21lL2xpa2VzJywgcXVlcnksIG51bGwsIGZuKTtcbn07XG5cbi8qKlxuICogQSBsaXN0IG9mIHRoZSBjdXJyZW50IHVzZXIncyBncm91cFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBbcXVlcnldXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5NZS5wcm90b3R5cGUuZ3JvdXBzID0gZnVuY3Rpb24ocXVlcnksIGZuKXtcbiAgcmV0dXJuIHRoaXMud3Bjb20uc2VuZFJlcXVlc3QoJy9tZS9ncm91cHMnLCBxdWVyeSwgbnVsbCwgZm4pO1xufTtcblxuLyoqXG4gKiBBIGxpc3Qgb2YgdGhlIGN1cnJlbnQgdXNlcidzIGNvbm5lY3Rpb25zIHRvIHRoaXJkLXBhcnR5IHNlcnZpY2VzXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IFtxdWVyeV1cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbk1lLnByb3RvdHlwZS5jb25uZWN0aW9ucyA9IGZ1bmN0aW9uKHF1ZXJ5LCBmbil7XG4gIHJldHVybiB0aGlzLndwY29tLnNlbmRSZXF1ZXN0KCcvbWUvY29ubmVjdGlvbnMnLCBxdWVyeSwgbnVsbCwgZm4pO1xufTtcblxuLyoqXG4gKiBFeHBvc2UgYE1lYCBtb2R1bGVcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1lO1xuIiwiXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIGZzID0gcmVxdWlyZSgnZnMnKTtcbnZhciBkZWJ1ZyA9IHJlcXVpcmUoJ2RlYnVnJykoJ3dwY29tOm1lZGlhJyk7XG5cbi8qKlxuICogRGVmYXVsdCBhcGkgdmVyc2lvblxuICovXG5cbnZhciBhcGlfdmVyc2lvbiA9ICcxLjEnO1xuXG4vKipcbiAqIE1lZGlhIG1ldGhvZHNcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gaWRcbiAqIEBwYXJhbSB7U3RyaW5nfSBzaWQgc2l0ZSBpZFxuICogQHBhcmFtIHtXUENPTX0gd3Bjb21cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gTWVkaWEoaWQsIHNpZCwgd3Bjb20pe1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgTWVkaWEpKSByZXR1cm4gbmV3IE1lZGlhKGlkLCBzaWQsIHdwY29tKTtcblxuICB0aGlzLndwY29tID0gd3Bjb207XG4gIHRoaXMuX3NpZCA9IHNpZDtcbiAgdGhpcy5faWQgPSBpZDtcblxuICBpZiAoIXRoaXMuX2lkKSB7XG4gICAgZGVidWcoJ1dBUk46IG1lZGlhIGBpZGAgaXMgbm90IGRlZmluZWQnKTtcbiAgfVxufVxuXG4vKipcbiAqIEdldCBtZWRpYVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBbcXVlcnldXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5NZWRpYS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24ocXVlcnksIGZuKXtcbiAgdmFyIHBhcmFtcyA9IHtcbiAgICBhcGlWZXJzaW9uOiBxdWVyeS5hcGlWZXJzaW9uIHx8IGFwaV92ZXJzaW9uLFxuICAgIHBhdGg6ICcvc2l0ZXMvJyArIHRoaXMuX3NpZCArICcvbWVkaWEvJyArIHRoaXMuX2lkXG4gIH07XG5cbiAgcmV0dXJuIHRoaXMud3Bjb20uc2VuZFJlcXVlc3QocGFyYW1zLCBxdWVyeSwgbnVsbCwgZm4pO1xufTtcblxuLyoqXG4gKiBFZGl0IG1lZGlhXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IFtxdWVyeV1cbiAqIEBwYXJhbSB7T2JqZWN0fSBib2R5XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5NZWRpYS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24ocXVlcnksIGJvZHksIGZuKXtcbiAgaWYgKCdmdW5jdGlvbicgPT0gdHlwZW9mIGJvZHkpIHtcbiAgICBmbiA9IGJvZHk7XG4gICAgYm9keSA9IHF1ZXJ5O1xuICAgIHF1ZXJ5ID0ge307XG4gIH1cblxuICB2YXIgcGFyYW1zID0ge1xuICAgIGFwaVZlcnNpb246IHF1ZXJ5LmFwaVZlcnNpb24gfHwgYXBpX3ZlcnNpb24sXG4gICAgcGF0aDogJy9zaXRlcy8nICsgdGhpcy5fc2lkICsgJy9tZWRpYS8nICsgdGhpcy5faWQsXG4gICAgbWV0aG9kOiAncG9zdCdcbiAgfTtcblxuICByZXR1cm4gdGhpcy53cGNvbS5zZW5kUmVxdWVzdChwYXJhbXMsIHF1ZXJ5LCBib2R5LCBmbik7XG59O1xuXG4vKipcbiAqIEFkZCBtZWRpYSBmaWxlXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IFtxdWVyeV1cbiAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdHxBcnJheX0gZmlsZXNcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKi9cblxuTWVkaWEucHJvdG90eXBlLmFkZEZpbGVzID0gZnVuY3Rpb24ocXVlcnksIGZpbGVzLCBmbil7XG4gIGlmICgnZnVuY3Rpb24nID09IHR5cGVvZiBmaWxlcykge1xuICAgIGZuID0gZmlsZXM7XG4gICAgZmlsZXMgPSBxdWVyeTtcbiAgICBxdWVyeSA9IHt9O1xuICB9XG5cbiAgdmFyIHBhcmFtcyA9IHtcbiAgICBhcGlWZXJzaW9uOiBxdWVyeS5hcGlWZXJzaW9uIHx8IGFwaV92ZXJzaW9uLFxuICAgIHBhdGg6ICcvc2l0ZXMvJyArIHRoaXMuX3NpZCArICcvbWVkaWEvbmV3JyxcbiAgICBtZXRob2Q6ICdwb3N0JyxcbiAgICBmb3JtRGF0YTogW11cbiAgfTtcblxuICAvLyBwcm9jZXNzIGZvcm1EYXRhXG4gIGZpbGVzID0gQXJyYXkuaXNBcnJheShmaWxlcykgPyBmaWxlcyA6IFtmaWxlc107XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBmaWxlcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBmID0gZmlsZXNbaV07XG5cbiAgICBmID0gJ3N0cmluZycgPT0gdHlwZW9mIGYgPyBmcy5jcmVhdGVSZWFkU3RyZWFtKGYpIDogZjtcblxuICAgIHZhciBpc1N0cmVhbSA9ICEhZi5fcmVhZGFibGVTdGF0ZTtcbiAgICB2YXIgaXNGaWxlID0gJ3VuZGVmaW5lZCcgIT0gdHlwZW9mIEZpbGUgJiYgZiBpbnN0YW5jZW9mIEZpbGU7XG5cbiAgICBkZWJ1ZygnaXMgc3RyZWFtOiAlcycsIGlzU3RyZWFtKTtcbiAgICBkZWJ1ZygnaXMgZmlsZTogJXMnLCBpc0ZpbGUpO1xuXG4gICAgaWYgKCFpc0ZpbGUgJiYgIWlzU3RyZWFtKSB7XG4gICAgICAvLyBwcm9jZXNzIGZpbGUgYXR0cmlidXRlcyBsaWtlIGFzIGB0aXRsZWAsIGBkZXNjcmlwdGlvbmAsIC4uLlxuICAgICAgZm9yICh2YXIgayBpbiBmKSB7XG4gICAgICAgIGRlYnVnKCdhZGQgJW8gPT4gJW8nLCBrLCBmW2tdKTtcbiAgICAgICAgaWYgKCdmaWxlJyAhPSBrKSB7XG4gICAgICAgICAgdmFyIHBhcmFtID0gJ2F0dHJzWycgKyBpICsgJ11bJyArIGsgKyAnXSc7XG4gICAgICAgICAgcGFyYW1zLmZvcm1EYXRhLnB1c2goW3BhcmFtLCBmW2tdXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIHNldCBmaWxlIHBhdGhcbiAgICAgIGYgPSBmLmZpbGU7XG4gICAgICBmID0gJ3N0cmluZycgPT0gdHlwZW9mIGYgPyBmcy5jcmVhdGVSZWFkU3RyZWFtKGYpIDogZjtcbiAgICB9XG5cbiAgICBwYXJhbXMuZm9ybURhdGEucHVzaChbJ21lZGlhW10nLCBmXSk7XG4gIH1cblxuICByZXR1cm4gdGhpcy53cGNvbS5zZW5kUmVxdWVzdChwYXJhbXMsIHF1ZXJ5LCBudWxsLCBmbik7XG59O1xuXG4vKipcbiAqIEFkZCBtZWRpYSBmaWxlcyBmcm9tIFVSTFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBbcXVlcnldXG4gKiBAcGFyYW0ge1N0cmluZ3xBcnJheXxPYmplY3R9IGZpbGVzXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICovXG5cbk1lZGlhLnByb3RvdHlwZS5hZGRVcmxzID0gZnVuY3Rpb24ocXVlcnksIG1lZGlhLCBmbil7XG4gIGlmICgnZnVuY3Rpb24nID09IHR5cGVvZiBtZWRpYSkge1xuICAgIGZuID0gbWVkaWE7XG4gICAgbWVkaWEgPSBxdWVyeTtcbiAgICBxdWVyeSA9IHt9O1xuICB9XG5cbiAgdmFyIHBhcmFtcyA9IHtcbiAgICBhcGlWZXJzaW9uOiBxdWVyeS5hcGlWZXJzaW9uIHx8IGFwaV92ZXJzaW9uLFxuICAgIHBhdGg6ICcvc2l0ZXMvJyArIHRoaXMuX3NpZCArICcvbWVkaWEvbmV3JyxcbiAgICBtZXRob2Q6ICdwb3N0J1xuICB9O1xuXG4gIHZhciBib2R5ID0geyBtZWRpYV91cmxzOiBbXSB9O1xuXG4gIC8vIHByb2Nlc3MgZm9ybURhdGFcbiAgbWVkaWEgPSBBcnJheS5pc0FycmF5KG1lZGlhKSA/IG1lZGlhIDogWyBtZWRpYSBdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IG1lZGlhLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIG0gPSBtZWRpYVtpXTtcbiAgICB2YXIgdXJsO1xuXG4gICAgaWYgKCdzdHJpbmcnID09IHR5cGVvZiBtKSB7XG4gICAgICB1cmwgPSBtO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIWJvZHkuYXR0cnMpIGJvZHkuYXR0cnMgPSBbXTtcblxuICAgICAgLy8gYWRkIGF0dHJpYnV0ZXNcbiAgICAgIGJvZHkuYXR0cnNbaV0gPSB7fTtcbiAgICAgIGZvciAodmFyIGsgaW4gbSkge1xuICAgICAgICBpZiAoJ3VybCcgIT0gaykge1xuICAgICAgICAgIGJvZHkuYXR0cnNbaV1ba10gPSBtW2tdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB1cmwgPSBtW2tdO1xuICAgIH1cblxuICAgIC8vIHB1c2ggdXJsIGludG8gW21lZGlhX3VybF1cbiAgICBib2R5Lm1lZGlhX3VybHMucHVzaCh1cmwpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXMud3Bjb20uc2VuZFJlcXVlc3QocGFyYW1zLCBxdWVyeSwgYm9keSwgZm4pO1xufTtcblxuLyoqXG4gKiBEZWxldGUgbWVkaWFcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gW3F1ZXJ5XVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuTWVkaWEucHJvdG90eXBlWydkZWxldGUnXSA9XG5NZWRpYS5wcm90b3R5cGUuZGVsID0gZnVuY3Rpb24ocXVlcnksIGZuKXtcbiAgaWYgKCdmdW5jdGlvbicgPT0gdHlwZW9mIHF1ZXJ5KSB7XG4gICAgZm4gPSBxdWVyeTtcbiAgICBxdWVyeSA9IHt9O1xuICB9XG5cbiAgdmFyIHBhcmFtcyA9IHtcbiAgICBhcGlWZXJzaW9uOiBxdWVyeS5hcGlWZXJzaW9uIHx8IGFwaV92ZXJzaW9uLFxuICAgIHBhdGg6ICcvc2l0ZXMvJyArIHRoaXMuX3NpZCArICcvbWVkaWEvJyArIHRoaXMuX2lkICsgJy9kZWxldGUnLFxuICAgIG1ldGhvZDogJ3Bvc3QnXG4gIH07XG5cbiAgcmV0dXJuIHRoaXMud3Bjb20uc2VuZFJlcXVlc3QocGFyYW1zLCBxdWVyeSwgbnVsbCwgZm4pO1xufTtcblxuLyoqXG4gKiBFeHBvc2UgYE1lZGlhYCBtb2R1bGVcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1lZGlhO1xuIiwiXG4vKipcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gKi9cblxudmFyIExpa2UgPSByZXF1aXJlKCcuL2xpa2UnKTtcbnZhciBSZWJsb2cgPSByZXF1aXJlKCcuL3JlYmxvZycpO1xudmFyIENvbW1lbnQgPSByZXF1aXJlKCcuL2NvbW1lbnQnKTtcbnZhciBkZWJ1ZyA9IHJlcXVpcmUoJ2RlYnVnJykoJ3dwY29tOnBvc3QnKTtcblxuLyoqXG4gKiBQb3N0IG1ldGhvZHNcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gaWRcbiAqIEBwYXJhbSB7U3RyaW5nfSBzaWQgc2l0ZSBpZFxuICogQHBhcmFtIHtXUENPTX0gd3Bjb21cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gUG9zdChpZCwgc2lkLCB3cGNvbSl7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBQb3N0KSkgcmV0dXJuIG5ldyBQb3N0KGlkLCBzaWQsIHdwY29tKTtcblxuICB0aGlzLndwY29tID0gd3Bjb207XG4gIHRoaXMuX3NpZCA9IHNpZDtcblxuICAvLyBzZXQgYGlkYCBhbmQvb3IgYHNsdWdgIHByb3BlcnRpZXNcbiAgaWQgPSBpZCB8fCB7fTtcbiAgaWYgKCdvYmplY3QnICE9IHR5cGVvZiBpZCkge1xuICAgIHRoaXMuX2lkID0gaWQ7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5faWQgPSBpZC5pZDtcbiAgICB0aGlzLl9zbHVnID0gaWQuc2x1ZztcbiAgfVxufVxuXG4vKipcbiAqIFNldCBwb3N0IGBpZGBcbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblBvc3QucHJvdG90eXBlLmlkID0gZnVuY3Rpb24oaWQpe1xuICB0aGlzLl9pZCA9IGlkO1xufTtcblxuLyoqXG4gKiBTZXQgcG9zdCBgc2x1Z2BcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc2x1Z1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5Qb3N0LnByb3RvdHlwZS5zbHVnID0gZnVuY3Rpb24oc2x1Zyl7XG4gIHRoaXMuX3NsdWcgPSBzbHVnO1xufTtcblxuLyoqXG4gKiBHZXQgcG9zdFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBbcXVlcnldXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5Qb3N0LnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihxdWVyeSwgZm4pe1xuICBpZiAoIXRoaXMuX2lkICYmIHRoaXMuX3NsdWcpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRCeVNsdWcocXVlcnksIGZuKTtcbiAgfVxuXG4gIHZhciBwYXRoID0gJy9zaXRlcy8nICsgdGhpcy5fc2lkICsgJy9wb3N0cy8nICsgdGhpcy5faWQ7XG4gIHJldHVybiB0aGlzLndwY29tLnNlbmRSZXF1ZXN0KHBhdGgsIHF1ZXJ5LCBudWxsLCBmbik7XG59O1xuXG4vKipcbiAqIEdldCBwb3N0IGJ5IHNsdWdcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gW3F1ZXJ5XVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUG9zdC5wcm90b3R5cGUuZ2V0QnlTbHVnID0gZnVuY3Rpb24ocXVlcnksIGZuKXtcbiAgdmFyIHBhdGggPSAnL3NpdGVzLycgKyB0aGlzLl9zaWQgKyAnL3Bvc3RzL3NsdWc6JyArIHRoaXMuX3NsdWc7XG4gIHJldHVybiB0aGlzLndwY29tLnNlbmRSZXF1ZXN0KHBhdGgsIHF1ZXJ5LCBudWxsLCBmbik7XG59O1xuXG4vKipcbiAqIEFkZCBwb3N0XG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGJvZHlcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblBvc3QucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKGJvZHksIGZuKXtcbiAgdmFyIHBhdGggPSAnL3NpdGVzLycgKyB0aGlzLl9zaWQgKyAnL3Bvc3RzL25ldyc7XG4gIHJldHVybiB0aGlzLndwY29tLnNlbmRSZXF1ZXN0KHsgcGF0aDogcGF0aCwgbWV0aG9kOiAncG9zdCcgfSwgbnVsbCwgYm9keSwgZm4pO1xufTtcblxuLyoqXG4gKiBFZGl0IHBvc3RcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gYm9keVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUG9zdC5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oYm9keSwgZm4pe1xuICB2YXIgcGF0aCA9ICcvc2l0ZXMvJyArIHRoaXMuX3NpZCArICcvcG9zdHMvJyArIHRoaXMuX2lkO1xuICByZXR1cm4gdGhpcy53cGNvbS5zZW5kUmVxdWVzdCh7IHBhdGg6IHBhdGgsIG1ldGhvZDogJ3Bvc3QnIH0sIG51bGwsIGJvZHksIGZuKTtcbn07XG5cbi8qKlxuICogRGVsZXRlIHBvc3RcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5Qb3N0LnByb3RvdHlwZVsnZGVsZXRlJ10gPVxuUG9zdC5wcm90b3R5cGUuZGVsID0gZnVuY3Rpb24oZm4pe1xuICB2YXIgcGF0aCA9ICcvc2l0ZXMvJyArIHRoaXMuX3NpZCArICcvcG9zdHMvJyArIHRoaXMuX2lkICsgJy9kZWxldGUnO1xuICByZXR1cm4gdGhpcy53cGNvbS5zZW5kUmVxdWVzdCh7IHBhdGg6IHBhdGgsIG1ldGhvZDogJ3Bvc3QnIH0sIG51bGwsIG51bGwsIGZuKTtcbn07XG5cbi8qKlxuICogR2V0IHBvc3QgbGlrZXMgbGlzdFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBbcXVlcnldXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5Qb3N0LnByb3RvdHlwZS5saWtlc0xpc3QgPSBmdW5jdGlvbihxdWVyeSwgZm4pe1xuICB2YXIgcGF0aCA9ICcvc2l0ZXMvJyArIHRoaXMuX3NpZCArICcvcG9zdHMvJyArIHRoaXMuX2lkICsgJy9saWtlcyc7XG4gIHJldHVybiB0aGlzLndwY29tLnNlbmRSZXF1ZXN0KHBhdGgsIHF1ZXJ5LCBudWxsLCBmbik7XG59O1xuXG4vKipcbiAqIFNlYXJjaCB3aXRoaW4gYSBzaXRlIGZvciByZWxhdGVkIHBvc3RzXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGJvZHlcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblBvc3QucHJvdG90eXBlLnJlbGF0ZWQgPSBmdW5jdGlvbihib2R5LCBmbil7XG4gIHZhciBwYXRoID0gJy9zaXRlcy8nICsgdGhpcy5fc2lkICsgJy9wb3N0cy8nICsgdGhpcy5faWQgKyAnL3JlbGF0ZWQnO1xuICByZXR1cm4gdGhpcy53cGNvbS5zZW5kUmVxdWVzdCh7IHBhdGg6IHBhdGgsIG1ldGhvZDogJ3Bvc3QnIH0sIG51bGwsIGJvZHksIGZuKTtcbn07XG5cbi8qKlxuICogQ3JlYXRlIGEgYExpa2VgIGluc3RhbmNlXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5Qb3N0LnByb3RvdHlwZS5saWtlID0gZnVuY3Rpb24oKXtcbiAgcmV0dXJuIExpa2UoIHRoaXMuX2lkLCB0aGlzLl9zaWQsIHRoaXMud3Bjb20pO1xufTtcblxuLyoqXG4gKiBDcmVhdGUgYSBgUmVibG9nYCBpbnN0YW5jZVxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUG9zdC5wcm90b3R5cGUucmVibG9nID0gZnVuY3Rpb24oKXtcbiAgcmV0dXJuIFJlYmxvZyh0aGlzLl9pZCwgdGhpcy5fc2lkLCB0aGlzLndwY29tKTtcbn07XG5cbi8qKlxuICogQ3JlYXRlIGEgYENvbW1lbnRgIGluc3RhbmNlXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IFtjaWRdIGNvbW1lbnQgaWRcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUG9zdC5wcm90b3R5cGUuY29tbWVudCA9IGZ1bmN0aW9uKGNpZCl7XG4gIHJldHVybiBDb21tZW50KGNpZCwgdGhpcy5faWQsIHRoaXMuX3NpZCwgdGhpcy53cGNvbSk7XG59O1xuXG4vKipcbiAqIDpDT01NRU5UOlxuICogUmV0dXJuIHJlY2VudCBjb21tZW50c1xuICpcbiAqIEBwYXJhbSB7T2JqZWN5fSBbcXVlcnldXG4gKiBAcGFyYW0ge1N0cmluZ30gaWRcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUG9zdC5wcm90b3R5cGUuY29tbWVudHMgPSBmdW5jdGlvbihxdWVyeSwgZm4pe1xuICB2YXIgY29tbWVudCA9IENvbW1lbnQobnVsbCwgdGhpcy5faWQsIHRoaXMuX3NpZCwgdGhpcy53cGNvbSk7XG4gIGNvbW1lbnQucmVwbGllcyhxdWVyeSwgZm4pO1xuICByZXR1cm4gY29tbWVudDtcbn07XG5cbi8qKlxuICogRXhwb3NlIGBQb3N0YCBtb2R1bGVcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBvc3Q7XG4iLCJcbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgZGVidWcgPSByZXF1aXJlKCdkZWJ1ZycpKCd3cGNvbTpyZWJsb2cnKTtcblxuLyoqXG4gKiBSZWJsb2cgbWV0aG9kc1xuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBwaWQgcG9zdCBpZFxuICogQHBhcmFtIHtTdHJpbmd9IHNpZCBzaXRlIGlkXG4gKiBAcGFyYW0ge1dQQ09NfSB3cGNvbVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBSZWJsb2cocGlkLCBzaWQsIHdwY29tKXtcbiAgaWYgKCFzaWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2BzaWRlIGlkYCBpcyBub3QgY29ycmVjdGx5IGRlZmluZWQnKTtcbiAgfVxuXG4gIGlmICghcGlkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdgcG9zdCBpZGAgaXMgbm90IGNvcnJlY3RseSBkZWZpbmVkJyk7XG4gIH1cblxuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgUmVibG9nKSkgcmV0dXJuIG5ldyBSZWJsb2cocGlkLCBzaWQsIHdwY29tKTtcblxuICB0aGlzLndwY29tID0gd3Bjb207XG4gIHRoaXMuX3BpZCA9IHBpZDtcbiAgdGhpcy5fc2lkID0gc2lkO1xufVxuXG4vKipcbiAqIEdldCB5b3VyIHJlYmxvZyBzdGF0dXMgZm9yIGEgUG9zdFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBbcXVlcnldXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5SZWJsb2cucHJvdG90eXBlLnN0YXRlID1cblJlYmxvZy5wcm90b3R5cGUubWluZSA9IGZ1bmN0aW9uKHF1ZXJ5LCBmbil7XG4gIHZhciBwYXRoID0gJy9zaXRlcy8nICsgdGhpcy5fc2lkICsgJy9wb3N0cy8nICsgdGhpcy5fcGlkICsgJy9yZWJsb2dzL21pbmUnO1xuICByZXR1cm4gdGhpcy53cGNvbS5zZW5kUmVxdWVzdChwYXRoLCBxdWVyeSwgbnVsbCwgZm4pO1xufTtcblxuLyoqXG4gKiBSZWJsb2cgYSBwb3N0XG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGJvZHlcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlYmxvZy5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24oYm9keSwgZm4pe1xuICBpZiAoYm9keSAmJiAhYm9keS5kZXN0aW5hdGlvbl9zaXRlX2lkKSB7XG4gICAgcmV0dXJuIGZuKG5ldyBFcnJvcignZGVzdGluYXRpb25fc2l0ZV9pZCBpcyBub3QgZGVmaW5lZCcpKTtcbiAgfVxuXG4gIHZhciBwYXRoID0gJy9zaXRlcy8nICsgdGhpcy5fc2lkICsgJy9wb3N0cy8nICsgdGhpcy5fcGlkICsgJy9yZWJsb2dzL25ldyc7XG4gIHJldHVybiB0aGlzLndwY29tLnNlbmRSZXF1ZXN0KHsgcGF0aDogcGF0aCwgbWV0aG9kOiAncG9zdCcgfSwgbnVsbCwgYm9keSwgZm4pO1xufTtcblxuLyoqXG4gKiBSZWJsb2cgYSBwb3N0IHRvXG4gKiBJdCdzIGFsbW9zdCBhIGFsaWFzIG9mIFJlYmxvZ3MjYWRkKClcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gZGVzdCBkZXN0aW5hdGlvblxuICogQHBhcmFtIHtTdHJpbmd9IFtub3RlXVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVibG9nLnByb3RvdHlwZS50byA9IGZ1bmN0aW9uKGRlc3QsIG5vdGUsIGZuKXtcbiAgaWYgKCdmdW5jdGlvbicgPT0gdHlwZW9mIG5vdGUpIHtcbiAgICBmbiA9IG5vdGU7XG4gICAgbm90ZSA9IG51bGw7XG4gIH1cblxuICB0aGlzLmFkZCh7IG5vdGU6IG5vdGUsIGRlc3RpbmF0aW9uX3NpdGVfaWQ6IGRlc3QgfSwgZm4pO1xufTtcblxuLyoqXG4gKiBFeHBvc2UgYFJlYmxvZ2AgbW9kdWxlXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBSZWJsb2c7XG4iLCJcbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgUG9zdCA9IHJlcXVpcmUoJy4vcG9zdCcpO1xudmFyIENhdGVnb3J5PSByZXF1aXJlKCcuL2NhdGVnb3J5Jyk7XG52YXIgVGFnPSByZXF1aXJlKCcuL3RhZycpO1xudmFyIE1lZGlhID0gcmVxdWlyZSgnLi9tZWRpYScpO1xudmFyIENvbW1lbnQgPSByZXF1aXJlKCcuL2NvbW1lbnQnKTtcbnZhciBGb2xsb3cgPSByZXF1aXJlKCcuL2ZvbGxvdycpO1xudmFyIGRlYnVnID0gcmVxdWlyZSgnZGVidWcnKSgnd3Bjb206c2l0ZScpO1xuXG4vKipcbiAqIFJlc291cmNlcyBhcnJheVxuICogQSBsaXN0IG9mIGVuZHBvaW50cyB3aXRoIHRoZSBzYW1lIHN0cnVjdHVyZVxuICovXG5cbnZhciByZXNvdXJjZXMgPSBbXG4gICdjYXRlZ29yaWVzJyxcbiAgJ2NvbW1lbnRzJyxcbiAgJ2ZvbGxvd3MnLFxuICAnbWVkaWEnLFxuICAncG9zdHMnLFxuICBbICdzdGF0cycsICdzdGF0cycgXSxcbiAgWyAnc3RhdHNWaXNpdHMnLCAnc3RhdHMvdmlzaXRzJyBdLFxuICBbICdzdGF0c1JlZmVycmVycycsICdzdGF0cy9yZWZlcnJlcnMnIF0sXG4gIFsgJ3N0YXRzVG9wUG9zdHMnLCAnc3RhdHMvdG9wLXBvc3RzJyBdLFxuICBbICdzdGF0c0NvdW50cnlWaWV3cycsICdzdGF0cy9jb3VudHJ5LXZpZXdzJyBdLFxuICBbICdzdGF0c0NsaWNrcycsICdzdGF0cy9jbGlja3MnIF0sXG4gIFsgJ3N0YXRzU2VhcmNoVGVybXMnLCAnc3RhdHMvc2VhcmNoLXRlcm1zJyBdLFxuICAndGFncycsXG4gICd1c2Vycydcbl07XG5cbi8qKlxuICogQ3JlYXRlIGEgU2l0ZSBpbnN0YW5jZVxuICpcbiAqIEBwYXJhbSB7V1BDT019IHdwY29tXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIFNpdGUoaWQsIHdwY29tKXtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFNpdGUpKSByZXR1cm4gbmV3IFNpdGUoaWQsIHdwY29tKTtcbiAgdGhpcy53cGNvbSA9IHdwY29tO1xuXG4gIGRlYnVnKCdzZXQgJW8gc2l0ZSBpZCcsIGlkKTtcbiAgdGhpcy5faWQgPSBpZDtcbn1cblxuLyoqXG4gKiBSZXF1aXJlIHNpdGUgaW5mb3JtYXRpb25cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gW3F1ZXJ5XVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuU2l0ZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24ocXVlcnksIGZuKXtcbiAgcmV0dXJuIHRoaXMud3Bjb20uc2VuZFJlcXVlc3QoJy9zaXRlcy8nICsgdGhpcy5faWQsIHF1ZXJ5LCBudWxsLCBmbik7XG59O1xuXG4vKipcbiAqIExpc3QgbWV0aG9kIGJ1aWxkZXJcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3VicGF0aFxuICogQHBhcmFtIHtGdW5jdGlvbn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbnZhciBsaXN0ID0gZnVuY3Rpb24oc3VicGF0aCkge1xuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIDxuYW1lcz5MaXN0IG1ldGhvZFxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gW3F1ZXJ5XVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICByZXR1cm4gZnVuY3Rpb24gKHF1ZXJ5LCBmbil7XG4gICAgcmV0dXJuIHRoaXMud3Bjb20uc2VuZFJlcXVlc3QoJy9zaXRlcy8nICsgdGhpcy5faWQgKyAnLycgKyBzdWJwYXRoLCBxdWVyeSwgbnVsbCwgZm4pO1xuICB9O1xufTtcblxuLy8gd2FsayBmb3IgZWFjaCByZXNvdXJjZSBhbmQgY3JlYXRlIHJlbGF0ZWQgbWV0aG9kXG5mb3IgKHZhciBpID0gMDsgaSA8IHJlc291cmNlcy5sZW5ndGg7IGkrKykge1xuICB2YXIgcmVzID0gcmVzb3VyY2VzW2ldO1xuICB2YXIgaXNhcnIgPSBBcnJheS5pc0FycmF5KHJlcyk7XG5cbiAgdmFyIG5hbWUgPSAgaXNhcnIgPyByZXNbMF0gOiByZXMgKyAnTGlzdCc7XG4gIHZhciBzdWJwYXRoID0gaXNhcnIgPyByZXNbMV0gOiByZXM7XG5cbiAgZGVidWcoJ2FkZGluZyAlbyBtZXRob2QgaW4gJW8gc3ViLXBhdGgnLCAnc2l0ZS4nICsgbmFtZSArICcoKScsIHN1YnBhdGgpO1xuICBTaXRlLnByb3RvdHlwZVtuYW1lXSA9IGxpc3Qoc3VicGF0aCk7XG59XG5cbi8qKlxuICogOlBPU1Q6XG4gKiBDcmVhdGUgYSBgUG9zdGAgaW5zdGFuY2VcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gaWRcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuU2l0ZS5wcm90b3R5cGUucG9zdCA9IGZ1bmN0aW9uKGlkKXtcbiAgcmV0dXJuIFBvc3QoaWQsIHRoaXMuX2lkLCB0aGlzLndwY29tKTtcbn07XG5cbi8qKlxuICogOlBPU1Q6XG4gKiBBZGQgYSBuZXcgYmxvZyBwb3N0XG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGJvZHlcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtQb3N0fSBuZXcgUG9zdCBpbnN0YW5jZVxuICovXG5cblNpdGUucHJvdG90eXBlLmFkZFBvc3QgPSBmdW5jdGlvbihib2R5LCBmbil7XG4gIHZhciBwb3N0ID0gUG9zdChudWxsLCB0aGlzLl9pZCwgdGhpcy53cGNvbSk7XG4gIHJldHVybiBwb3N0LmFkZChib2R5LCBmbik7XG59O1xuXG4vKipcbiAqIDpQT1NUOlxuICogRGVsZXRlIGEgYmxvZyBwb3N0XG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGlkXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7UG9zdH0gcmVtb3ZlIFBvc3QgaW5zdGFuY2VcbiAqL1xuXG5TaXRlLnByb3RvdHlwZS5kZWxldGVQb3N0ID0gZnVuY3Rpb24oaWQsIGZuKXtcbiAgdmFyIHBvc3QgPSBQb3N0KGlkLCB0aGlzLl9pZCwgdGhpcy53cGNvbSk7XG4gIHJldHVybiBwb3N0LmRlbGV0ZShmbik7XG59O1xuXG4vKipcbiAqIDpNRURJQTpcbiAqIENyZWF0ZSBhIGBNZWRpYWAgaW5zdGFuY2VcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gaWRcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuU2l0ZS5wcm90b3R5cGUubWVkaWEgPSBmdW5jdGlvbihpZCl7XG4gIHJldHVybiBNZWRpYShpZCwgdGhpcy5faWQsIHRoaXMud3Bjb20pO1xufTtcblxuLyoqXG4gKiA6TUVESUE6XG4gKiBBZGQgYSBtZWRpYSBmcm9tIGEgZmlsZVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBbcXVlcnldXG4gKiBAcGFyYW0ge0FycmF5fFN0cmluZ30gZmlsZXNcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtQb3N0fSBuZXcgUG9zdCBpbnN0YW5jZVxuICovXG5cblNpdGUucHJvdG90eXBlLmFkZE1lZGlhRmlsZXMgPSBmdW5jdGlvbihxdWVyeSwgZmlsZXMsIGZuKXtcbiAgdmFyIG1lZGlhID0gTWVkaWEobnVsbCwgdGhpcy5faWQsIHRoaXMud3Bjb20pO1xuICByZXR1cm4gbWVkaWEuYWRkRmlsZXMocXVlcnksIGZpbGVzLCBmbik7XG59O1xuXG4vKipcbiAqIDpNRURJQTpcbiAqIEFkZCBhIG5ldyBtZWRpYSBmcm9tIHVybFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBbcXVlcnldXG4gKiBAcGFyYW0ge0FycmF5fFN0cmluZ30gZmlsZXNcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtQb3N0fSBuZXcgUG9zdCBpbnN0YW5jZVxuICovXG5cblNpdGUucHJvdG90eXBlLmFkZE1lZGlhVXJscyA9IGZ1bmN0aW9uKHF1ZXJ5LCBmaWxlcywgZm4pe1xuICB2YXIgbWVkaWEgPSBNZWRpYShudWxsLCB0aGlzLl9pZCwgdGhpcy53cGNvbSk7XG4gIHJldHVybiBtZWRpYS5hZGRVcmxzKHF1ZXJ5LCBmaWxlcywgZm4pO1xufTtcblxuLyoqXG4gKiA6TUVESUE6XG4gKiBEZWxldGUgYSBibG9nIG1lZGlhXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGlkXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7UG9zdH0gcmVtb3ZlZCBNZWRpYSBpbnN0YW5jZVxuICovXG5cblNpdGUucHJvdG90eXBlLmRlbGV0ZU1lZGlhID0gZnVuY3Rpb24oaWQsIGZuKXtcbiAgdmFyIG1lZGlhID0gTWVkaWEoaWQsIHRoaXMuX2lkLCB0aGlzLndwY29tKTtcbiAgcmV0dXJuIG1lZGlhLmRlbChmbik7XG59O1xuXG4vKipcbiAqIDpDT01NRU5UOlxuICogQ3JlYXRlIGEgYENvbW1lbnRgIGluc3RhbmNlXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGlkXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblNpdGUucHJvdG90eXBlLmNvbW1lbnQgPSBmdW5jdGlvbihpZCl7XG4gIHJldHVybiBDb21tZW50KGlkLCBudWxsLCB0aGlzLl9pZCwgdGhpcy53cGNvbSk7XG59O1xuXG4vKipcbiAqIENyZWF0ZSBhIGBGb2xsb3dgIGluc3RhbmNlXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5TaXRlLnByb3RvdHlwZS5mb2xsb3cgPSBmdW5jdGlvbigpe1xuICByZXR1cm4gRm9sbG93KHRoaXMuX2lkLCB0aGlzLndwY29tKTtcbn07XG5cbi8qKlxuICogQ3JlYXRlIGEgYENhdGVnb3J5YCBpbnN0YW5jZVxuICogU2V0IGBjYXRgIGFsaWFzXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IFtzbHVnXVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5TaXRlLnByb3RvdHlwZS5jYXQgPVxuU2l0ZS5wcm90b3R5cGUuY2F0ZWdvcnkgPSBmdW5jdGlvbihzbHVnKXtcbiAgcmV0dXJuIENhdGVnb3J5KHNsdWcsIHRoaXMuX2lkLCB0aGlzLndwY29tKTtcbn07XG5cbi8qKlxuICogQ3JlYXRlIGEgYFRhZ2AgaW5zdGFuY2VcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gW3NsdWddXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblNpdGUucHJvdG90eXBlLnRhZyA9IGZ1bmN0aW9uKHNsdWcpe1xuICByZXR1cm4gVGFnKHNsdWcsIHRoaXMuX2lkLCB0aGlzLndwY29tKTtcbn07XG5cbi8qKlxuICogRXhwb3NlIGBTaXRlYCBtb2R1bGVcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNpdGU7XG4iLCJcbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgZGVidWcgPSByZXF1aXJlKCdkZWJ1ZycpKCd3cGNvbTp0YWcnKTtcblxuLyoqXG4gKiBUYWcgbWV0aG9kc1xuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBbc2x1Z11cbiAqIEBwYXJhbSB7U3RyaW5nfSBzaWQgc2l0ZSBpZFxuICogQHBhcmFtIHtXUENPTX0gd3Bjb21cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gVGFnKHNsdWcsIHNpZCwgd3Bjb20pe1xuICBpZiAoIXNpZCkge1xuICAgIHRocm93IG5ldyBFcnJvcignYHNpZGUgaWRgIGlzIG5vdCBjb3JyZWN0bHkgZGVmaW5lZCcpO1xuICB9XG5cbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFRhZykpIHJldHVybiBuZXcgVGFnKHNsdWcsIHNpZCwgd3Bjb20pO1xuXG4gIHRoaXMud3Bjb20gPSB3cGNvbTtcbiAgdGhpcy5fc2lkID0gc2lkO1xuICB0aGlzLl9zbHVnID0gc2x1Zztcbn1cblxuLyoqXG4gKiBTZXQgdGFnIGBzbHVnYFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzbHVnXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblRhZy5wcm90b3R5cGUuc2x1ZyA9IGZ1bmN0aW9uKHNsdWcpe1xuICB0aGlzLl9zbHVnID0gc2x1Zztcbn07XG5cbi8qKlxuICogR2V0IHRhZ1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBbcXVlcnldXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5UYWcucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKHF1ZXJ5LCBmbil7XG4gIHZhciBwYXRoID0gJy9zaXRlcy8nICsgdGhpcy5fc2lkICsgJy90YWdzL3NsdWc6JyArIHRoaXMuX3NsdWc7XG4gIHJldHVybiB0aGlzLndwY29tLnNlbmRSZXF1ZXN0KHBhdGgsIHF1ZXJ5LCBudWxsLCBmbik7XG59O1xuXG4vKipcbiAqIEFkZCB0YWdcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gYm9keVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuVGFnLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbihib2R5LCBmbil7XG4gIHZhciBwYXRoID0gJy9zaXRlcy8nICsgdGhpcy5fc2lkICsgJy90YWdzL25ldyc7XG4gIHJldHVybiB0aGlzLndwY29tLnNlbmRSZXF1ZXN0KHsgcGF0aDogcGF0aCwgbWV0aG9kOiAncG9zdCcgfSwgbnVsbCwgYm9keSwgZm4pO1xufTtcblxuLyoqXG4gKiBFZGl0IHRhZ1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBib2R5XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5UYWcucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKGJvZHksIGZuKXtcbiAgdmFyIHBhdGggPSAnL3NpdGVzLycgKyB0aGlzLl9zaWQgKyAnL3RhZ3Mvc2x1ZzonICsgdGhpcy5fc2x1ZztcbiAgcmV0dXJuIHRoaXMud3Bjb20uc2VuZFJlcXVlc3QoeyBwYXRoOiBwYXRoLCBtZXRob2Q6ICdwb3N0JyB9LCBudWxsLCBib2R5LCBmbik7XG59O1xuXG4vKipcbiAqIERlbGV0ZSB0YWdcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5UYWcucHJvdG90eXBlWydkZWxldGUnXSA9XG5UYWcucHJvdG90eXBlLmRlbCA9IGZ1bmN0aW9uKGZuKXtcbiAgdmFyIHBhdGggPSAnL3NpdGVzLycgKyB0aGlzLl9zaWQgKyAnL3RhZ3Mvc2x1ZzonICsgdGhpcy5fc2x1ZyArICcvZGVsZXRlJztcbiAgcmV0dXJuIHRoaXMud3Bjb20uc2VuZFJlcXVlc3QoeyBwYXRoOiBwYXRoLCBtZXRob2Q6ICdwb3N0JyB9LCBudWxsLCBudWxsLCBmbik7XG59O1xuXG4vKipcbiAqIEV4cG9zZSBgVGFnYCBtb2R1bGVcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRhZztcbiIsIlxuLyoqXG4gKiBUaGlzIGlzIHRoZSB3ZWIgYnJvd3NlciBpbXBsZW1lbnRhdGlvbiBvZiBgZGVidWcoKWAuXG4gKlxuICogRXhwb3NlIGBkZWJ1ZygpYCBhcyB0aGUgbW9kdWxlLlxuICovXG5cbmV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vZGVidWcnKTtcbmV4cG9ydHMubG9nID0gbG9nO1xuZXhwb3J0cy5mb3JtYXRBcmdzID0gZm9ybWF0QXJncztcbmV4cG9ydHMuc2F2ZSA9IHNhdmU7XG5leHBvcnRzLmxvYWQgPSBsb2FkO1xuZXhwb3J0cy51c2VDb2xvcnMgPSB1c2VDb2xvcnM7XG5cbi8qKlxuICogQ29sb3JzLlxuICovXG5cbmV4cG9ydHMuY29sb3JzID0gW1xuICAnbGlnaHRzZWFncmVlbicsXG4gICdmb3Jlc3RncmVlbicsXG4gICdnb2xkZW5yb2QnLFxuICAnZG9kZ2VyYmx1ZScsXG4gICdkYXJrb3JjaGlkJyxcbiAgJ2NyaW1zb24nXG5dO1xuXG4vKipcbiAqIEN1cnJlbnRseSBvbmx5IFdlYktpdC1iYXNlZCBXZWIgSW5zcGVjdG9ycywgRmlyZWZveCA+PSB2MzEsXG4gKiBhbmQgdGhlIEZpcmVidWcgZXh0ZW5zaW9uIChhbnkgRmlyZWZveCB2ZXJzaW9uKSBhcmUga25vd25cbiAqIHRvIHN1cHBvcnQgXCIlY1wiIENTUyBjdXN0b21pemF0aW9ucy5cbiAqXG4gKiBUT0RPOiBhZGQgYSBgbG9jYWxTdG9yYWdlYCB2YXJpYWJsZSB0byBleHBsaWNpdGx5IGVuYWJsZS9kaXNhYmxlIGNvbG9yc1xuICovXG5cbmZ1bmN0aW9uIHVzZUNvbG9ycygpIHtcbiAgLy8gaXMgd2Via2l0PyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xNjQ1OTYwNi8zNzY3NzNcbiAgcmV0dXJuICgnV2Via2l0QXBwZWFyYW5jZScgaW4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlKSB8fFxuICAgIC8vIGlzIGZpcmVidWc/IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzM5ODEyMC8zNzY3NzNcbiAgICAod2luZG93LmNvbnNvbGUgJiYgKGNvbnNvbGUuZmlyZWJ1ZyB8fCAoY29uc29sZS5leGNlcHRpb24gJiYgY29uc29sZS50YWJsZSkpKSB8fFxuICAgIC8vIGlzIGZpcmVmb3ggPj0gdjMxP1xuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvVG9vbHMvV2ViX0NvbnNvbGUjU3R5bGluZ19tZXNzYWdlc1xuICAgIChuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkubWF0Y2goL2ZpcmVmb3hcXC8oXFxkKykvKSAmJiBwYXJzZUludChSZWdFeHAuJDEsIDEwKSA+PSAzMSk7XG59XG5cbi8qKlxuICogTWFwICVqIHRvIGBKU09OLnN0cmluZ2lmeSgpYCwgc2luY2Ugbm8gV2ViIEluc3BlY3RvcnMgZG8gdGhhdCBieSBkZWZhdWx0LlxuICovXG5cbmV4cG9ydHMuZm9ybWF0dGVycy5qID0gZnVuY3Rpb24odikge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodik7XG59O1xuXG5cbi8qKlxuICogQ29sb3JpemUgbG9nIGFyZ3VtZW50cyBpZiBlbmFibGVkLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZm9ybWF0QXJncygpIHtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciB1c2VDb2xvcnMgPSB0aGlzLnVzZUNvbG9ycztcblxuICBhcmdzWzBdID0gKHVzZUNvbG9ycyA/ICclYycgOiAnJylcbiAgICArIHRoaXMubmFtZXNwYWNlXG4gICAgKyAodXNlQ29sb3JzID8gJyAlYycgOiAnICcpXG4gICAgKyBhcmdzWzBdXG4gICAgKyAodXNlQ29sb3JzID8gJyVjICcgOiAnICcpXG4gICAgKyAnKycgKyBleHBvcnRzLmh1bWFuaXplKHRoaXMuZGlmZik7XG5cbiAgaWYgKCF1c2VDb2xvcnMpIHJldHVybiBhcmdzO1xuXG4gIHZhciBjID0gJ2NvbG9yOiAnICsgdGhpcy5jb2xvcjtcbiAgYXJncyA9IFthcmdzWzBdLCBjLCAnY29sb3I6IGluaGVyaXQnXS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJncywgMSkpO1xuXG4gIC8vIHRoZSBmaW5hbCBcIiVjXCIgaXMgc29tZXdoYXQgdHJpY2t5LCBiZWNhdXNlIHRoZXJlIGNvdWxkIGJlIG90aGVyXG4gIC8vIGFyZ3VtZW50cyBwYXNzZWQgZWl0aGVyIGJlZm9yZSBvciBhZnRlciB0aGUgJWMsIHNvIHdlIG5lZWQgdG9cbiAgLy8gZmlndXJlIG91dCB0aGUgY29ycmVjdCBpbmRleCB0byBpbnNlcnQgdGhlIENTUyBpbnRvXG4gIHZhciBpbmRleCA9IDA7XG4gIHZhciBsYXN0QyA9IDA7XG4gIGFyZ3NbMF0ucmVwbGFjZSgvJVthLXolXS9nLCBmdW5jdGlvbihtYXRjaCkge1xuICAgIGlmICgnJSUnID09PSBtYXRjaCkgcmV0dXJuO1xuICAgIGluZGV4Kys7XG4gICAgaWYgKCclYycgPT09IG1hdGNoKSB7XG4gICAgICAvLyB3ZSBvbmx5IGFyZSBpbnRlcmVzdGVkIGluIHRoZSAqbGFzdCogJWNcbiAgICAgIC8vICh0aGUgdXNlciBtYXkgaGF2ZSBwcm92aWRlZCB0aGVpciBvd24pXG4gICAgICBsYXN0QyA9IGluZGV4O1xuICAgIH1cbiAgfSk7XG5cbiAgYXJncy5zcGxpY2UobGFzdEMsIDAsIGMpO1xuICByZXR1cm4gYXJncztcbn1cblxuLyoqXG4gKiBJbnZva2VzIGBjb25zb2xlLmxvZygpYCB3aGVuIGF2YWlsYWJsZS5cbiAqIE5vLW9wIHdoZW4gYGNvbnNvbGUubG9nYCBpcyBub3QgYSBcImZ1bmN0aW9uXCIuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBsb2coKSB7XG4gIC8vIFRoaXMgaGFja2VyeSBpcyByZXF1aXJlZCBmb3IgSUU4LFxuICAvLyB3aGVyZSB0aGUgYGNvbnNvbGUubG9nYCBmdW5jdGlvbiBkb2Vzbid0IGhhdmUgJ2FwcGx5J1xuICByZXR1cm4gJ29iamVjdCcgPT0gdHlwZW9mIGNvbnNvbGVcbiAgICAmJiAnZnVuY3Rpb24nID09IHR5cGVvZiBjb25zb2xlLmxvZ1xuICAgICYmIEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseS5jYWxsKGNvbnNvbGUubG9nLCBjb25zb2xlLCBhcmd1bWVudHMpO1xufVxuXG4vKipcbiAqIFNhdmUgYG5hbWVzcGFjZXNgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2VzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzYXZlKG5hbWVzcGFjZXMpIHtcbiAgdHJ5IHtcbiAgICBpZiAobnVsbCA9PSBuYW1lc3BhY2VzKSB7XG4gICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnZGVidWcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbG9jYWxTdG9yYWdlLmRlYnVnID0gbmFtZXNwYWNlcztcbiAgICB9XG4gIH0gY2F0Y2goZSkge31cbn1cblxuLyoqXG4gKiBMb2FkIGBuYW1lc3BhY2VzYC5cbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IHJldHVybnMgdGhlIHByZXZpb3VzbHkgcGVyc2lzdGVkIGRlYnVnIG1vZGVzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBsb2FkKCkge1xuICB2YXIgcjtcbiAgdHJ5IHtcbiAgICByID0gbG9jYWxTdG9yYWdlLmRlYnVnO1xuICB9IGNhdGNoKGUpIHt9XG4gIHJldHVybiByO1xufVxuXG4vKipcbiAqIEVuYWJsZSBuYW1lc3BhY2VzIGxpc3RlZCBpbiBgbG9jYWxTdG9yYWdlLmRlYnVnYCBpbml0aWFsbHkuXG4gKi9cblxuZXhwb3J0cy5lbmFibGUobG9hZCgpKTtcbiIsIlxuLyoqXG4gKiBUaGlzIGlzIHRoZSBjb21tb24gbG9naWMgZm9yIGJvdGggdGhlIE5vZGUuanMgYW5kIHdlYiBicm93c2VyXG4gKiBpbXBsZW1lbnRhdGlvbnMgb2YgYGRlYnVnKClgLlxuICpcbiAqIEV4cG9zZSBgZGVidWcoKWAgYXMgdGhlIG1vZHVsZS5cbiAqL1xuXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBkZWJ1ZztcbmV4cG9ydHMuY29lcmNlID0gY29lcmNlO1xuZXhwb3J0cy5kaXNhYmxlID0gZGlzYWJsZTtcbmV4cG9ydHMuZW5hYmxlID0gZW5hYmxlO1xuZXhwb3J0cy5lbmFibGVkID0gZW5hYmxlZDtcbmV4cG9ydHMuaHVtYW5pemUgPSByZXF1aXJlKCdtcycpO1xuXG4vKipcbiAqIFRoZSBjdXJyZW50bHkgYWN0aXZlIGRlYnVnIG1vZGUgbmFtZXMsIGFuZCBuYW1lcyB0byBza2lwLlxuICovXG5cbmV4cG9ydHMubmFtZXMgPSBbXTtcbmV4cG9ydHMuc2tpcHMgPSBbXTtcblxuLyoqXG4gKiBNYXAgb2Ygc3BlY2lhbCBcIiVuXCIgaGFuZGxpbmcgZnVuY3Rpb25zLCBmb3IgdGhlIGRlYnVnIFwiZm9ybWF0XCIgYXJndW1lbnQuXG4gKlxuICogVmFsaWQga2V5IG5hbWVzIGFyZSBhIHNpbmdsZSwgbG93ZXJjYXNlZCBsZXR0ZXIsIGkuZS4gXCJuXCIuXG4gKi9cblxuZXhwb3J0cy5mb3JtYXR0ZXJzID0ge307XG5cbi8qKlxuICogUHJldmlvdXNseSBhc3NpZ25lZCBjb2xvci5cbiAqL1xuXG52YXIgcHJldkNvbG9yID0gMDtcblxuLyoqXG4gKiBQcmV2aW91cyBsb2cgdGltZXN0YW1wLlxuICovXG5cbnZhciBwcmV2VGltZTtcblxuLyoqXG4gKiBTZWxlY3QgYSBjb2xvci5cbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBzZWxlY3RDb2xvcigpIHtcbiAgcmV0dXJuIGV4cG9ydHMuY29sb3JzW3ByZXZDb2xvcisrICUgZXhwb3J0cy5jb2xvcnMubGVuZ3RoXTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBkZWJ1Z2dlciB3aXRoIHRoZSBnaXZlbiBgbmFtZXNwYWNlYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gZGVidWcobmFtZXNwYWNlKSB7XG5cbiAgLy8gZGVmaW5lIHRoZSBgZGlzYWJsZWRgIHZlcnNpb25cbiAgZnVuY3Rpb24gZGlzYWJsZWQoKSB7XG4gIH1cbiAgZGlzYWJsZWQuZW5hYmxlZCA9IGZhbHNlO1xuXG4gIC8vIGRlZmluZSB0aGUgYGVuYWJsZWRgIHZlcnNpb25cbiAgZnVuY3Rpb24gZW5hYmxlZCgpIHtcblxuICAgIHZhciBzZWxmID0gZW5hYmxlZDtcblxuICAgIC8vIHNldCBgZGlmZmAgdGltZXN0YW1wXG4gICAgdmFyIGN1cnIgPSArbmV3IERhdGUoKTtcbiAgICB2YXIgbXMgPSBjdXJyIC0gKHByZXZUaW1lIHx8IGN1cnIpO1xuICAgIHNlbGYuZGlmZiA9IG1zO1xuICAgIHNlbGYucHJldiA9IHByZXZUaW1lO1xuICAgIHNlbGYuY3VyciA9IGN1cnI7XG4gICAgcHJldlRpbWUgPSBjdXJyO1xuXG4gICAgLy8gYWRkIHRoZSBgY29sb3JgIGlmIG5vdCBzZXRcbiAgICBpZiAobnVsbCA9PSBzZWxmLnVzZUNvbG9ycykgc2VsZi51c2VDb2xvcnMgPSBleHBvcnRzLnVzZUNvbG9ycygpO1xuICAgIGlmIChudWxsID09IHNlbGYuY29sb3IgJiYgc2VsZi51c2VDb2xvcnMpIHNlbGYuY29sb3IgPSBzZWxlY3RDb2xvcigpO1xuXG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuXG4gICAgYXJnc1swXSA9IGV4cG9ydHMuY29lcmNlKGFyZ3NbMF0pO1xuXG4gICAgaWYgKCdzdHJpbmcnICE9PSB0eXBlb2YgYXJnc1swXSkge1xuICAgICAgLy8gYW55dGhpbmcgZWxzZSBsZXQncyBpbnNwZWN0IHdpdGggJW9cbiAgICAgIGFyZ3MgPSBbJyVvJ10uY29uY2F0KGFyZ3MpO1xuICAgIH1cblxuICAgIC8vIGFwcGx5IGFueSBgZm9ybWF0dGVyc2AgdHJhbnNmb3JtYXRpb25zXG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICBhcmdzWzBdID0gYXJnc1swXS5yZXBsYWNlKC8lKFthLXolXSkvZywgZnVuY3Rpb24obWF0Y2gsIGZvcm1hdCkge1xuICAgICAgLy8gaWYgd2UgZW5jb3VudGVyIGFuIGVzY2FwZWQgJSB0aGVuIGRvbid0IGluY3JlYXNlIHRoZSBhcnJheSBpbmRleFxuICAgICAgaWYgKG1hdGNoID09PSAnJSUnKSByZXR1cm4gbWF0Y2g7XG4gICAgICBpbmRleCsrO1xuICAgICAgdmFyIGZvcm1hdHRlciA9IGV4cG9ydHMuZm9ybWF0dGVyc1tmb3JtYXRdO1xuICAgICAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBmb3JtYXR0ZXIpIHtcbiAgICAgICAgdmFyIHZhbCA9IGFyZ3NbaW5kZXhdO1xuICAgICAgICBtYXRjaCA9IGZvcm1hdHRlci5jYWxsKHNlbGYsIHZhbCk7XG5cbiAgICAgICAgLy8gbm93IHdlIG5lZWQgdG8gcmVtb3ZlIGBhcmdzW2luZGV4XWAgc2luY2UgaXQncyBpbmxpbmVkIGluIHRoZSBgZm9ybWF0YFxuICAgICAgICBhcmdzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIGluZGV4LS07XG4gICAgICB9XG4gICAgICByZXR1cm4gbWF0Y2g7XG4gICAgfSk7XG5cbiAgICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGV4cG9ydHMuZm9ybWF0QXJncykge1xuICAgICAgYXJncyA9IGV4cG9ydHMuZm9ybWF0QXJncy5hcHBseShzZWxmLCBhcmdzKTtcbiAgICB9XG4gICAgdmFyIGxvZ0ZuID0gZW5hYmxlZC5sb2cgfHwgZXhwb3J0cy5sb2cgfHwgY29uc29sZS5sb2cuYmluZChjb25zb2xlKTtcbiAgICBsb2dGbi5hcHBseShzZWxmLCBhcmdzKTtcbiAgfVxuICBlbmFibGVkLmVuYWJsZWQgPSB0cnVlO1xuXG4gIHZhciBmbiA9IGV4cG9ydHMuZW5hYmxlZChuYW1lc3BhY2UpID8gZW5hYmxlZCA6IGRpc2FibGVkO1xuXG4gIGZuLm5hbWVzcGFjZSA9IG5hbWVzcGFjZTtcblxuICByZXR1cm4gZm47XG59XG5cbi8qKlxuICogRW5hYmxlcyBhIGRlYnVnIG1vZGUgYnkgbmFtZXNwYWNlcy4gVGhpcyBjYW4gaW5jbHVkZSBtb2Rlc1xuICogc2VwYXJhdGVkIGJ5IGEgY29sb24gYW5kIHdpbGRjYXJkcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlc1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBlbmFibGUobmFtZXNwYWNlcykge1xuICBleHBvcnRzLnNhdmUobmFtZXNwYWNlcyk7XG5cbiAgdmFyIHNwbGl0ID0gKG5hbWVzcGFjZXMgfHwgJycpLnNwbGl0KC9bXFxzLF0rLyk7XG4gIHZhciBsZW4gPSBzcGxpdC5sZW5ndGg7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgIGlmICghc3BsaXRbaV0pIGNvbnRpbnVlOyAvLyBpZ25vcmUgZW1wdHkgc3RyaW5nc1xuICAgIG5hbWVzcGFjZXMgPSBzcGxpdFtpXS5yZXBsYWNlKC9cXCovZywgJy4qPycpO1xuICAgIGlmIChuYW1lc3BhY2VzWzBdID09PSAnLScpIHtcbiAgICAgIGV4cG9ydHMuc2tpcHMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWVzcGFjZXMuc3Vic3RyKDEpICsgJyQnKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV4cG9ydHMubmFtZXMucHVzaChuZXcgUmVnRXhwKCdeJyArIG5hbWVzcGFjZXMgKyAnJCcpKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBEaXNhYmxlIGRlYnVnIG91dHB1dC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGRpc2FibGUoKSB7XG4gIGV4cG9ydHMuZW5hYmxlKCcnKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgdGhlIGdpdmVuIG1vZGUgbmFtZSBpcyBlbmFibGVkLCBmYWxzZSBvdGhlcndpc2UuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIGVuYWJsZWQobmFtZSkge1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSBleHBvcnRzLnNraXBzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGV4cG9ydHMuc2tpcHNbaV0udGVzdChuYW1lKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBmb3IgKGkgPSAwLCBsZW4gPSBleHBvcnRzLm5hbWVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGV4cG9ydHMubmFtZXNbaV0udGVzdChuYW1lKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBDb2VyY2UgYHZhbGAuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gdmFsXG4gKiBAcmV0dXJuIHtNaXhlZH1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIGNvZXJjZSh2YWwpIHtcbiAgaWYgKHZhbCBpbnN0YW5jZW9mIEVycm9yKSByZXR1cm4gdmFsLnN0YWNrIHx8IHZhbC5tZXNzYWdlO1xuICByZXR1cm4gdmFsO1xufVxuIiwiLyoqXG4gKiBIZWxwZXJzLlxuICovXG5cbnZhciBzID0gMTAwMDtcbnZhciBtID0gcyAqIDYwO1xudmFyIGggPSBtICogNjA7XG52YXIgZCA9IGggKiAyNDtcbnZhciB5ID0gZCAqIDM2NS4yNTtcblxuLyoqXG4gKiBQYXJzZSBvciBmb3JtYXQgdGhlIGdpdmVuIGB2YWxgLlxuICpcbiAqIE9wdGlvbnM6XG4gKlxuICogIC0gYGxvbmdgIHZlcmJvc2UgZm9ybWF0dGluZyBbZmFsc2VdXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8TnVtYmVyfSB2YWxcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtTdHJpbmd8TnVtYmVyfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHZhbCwgb3B0aW9ucyl7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICBpZiAoJ3N0cmluZycgPT0gdHlwZW9mIHZhbCkgcmV0dXJuIHBhcnNlKHZhbCk7XG4gIHJldHVybiBvcHRpb25zLmxvbmdcbiAgICA/IGxvbmcodmFsKVxuICAgIDogc2hvcnQodmFsKTtcbn07XG5cbi8qKlxuICogUGFyc2UgdGhlIGdpdmVuIGBzdHJgIGFuZCByZXR1cm4gbWlsbGlzZWNvbmRzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHBhcnNlKHN0cikge1xuICB2YXIgbWF0Y2ggPSAvXigoPzpcXGQrKT9cXC4/XFxkKykgKihtc3xzZWNvbmRzP3xzfG1pbnV0ZXM/fG18aG91cnM/fGh8ZGF5cz98ZHx5ZWFycz98eSk/JC9pLmV4ZWMoc3RyKTtcbiAgaWYgKCFtYXRjaCkgcmV0dXJuO1xuICB2YXIgbiA9IHBhcnNlRmxvYXQobWF0Y2hbMV0pO1xuICB2YXIgdHlwZSA9IChtYXRjaFsyXSB8fCAnbXMnKS50b0xvd2VyQ2FzZSgpO1xuICBzd2l0Y2ggKHR5cGUpIHtcbiAgICBjYXNlICd5ZWFycyc6XG4gICAgY2FzZSAneWVhcic6XG4gICAgY2FzZSAneSc6XG4gICAgICByZXR1cm4gbiAqIHk7XG4gICAgY2FzZSAnZGF5cyc6XG4gICAgY2FzZSAnZGF5JzpcbiAgICBjYXNlICdkJzpcbiAgICAgIHJldHVybiBuICogZDtcbiAgICBjYXNlICdob3Vycyc6XG4gICAgY2FzZSAnaG91cic6XG4gICAgY2FzZSAnaCc6XG4gICAgICByZXR1cm4gbiAqIGg7XG4gICAgY2FzZSAnbWludXRlcyc6XG4gICAgY2FzZSAnbWludXRlJzpcbiAgICBjYXNlICdtJzpcbiAgICAgIHJldHVybiBuICogbTtcbiAgICBjYXNlICdzZWNvbmRzJzpcbiAgICBjYXNlICdzZWNvbmQnOlxuICAgIGNhc2UgJ3MnOlxuICAgICAgcmV0dXJuIG4gKiBzO1xuICAgIGNhc2UgJ21zJzpcbiAgICAgIHJldHVybiBuO1xuICB9XG59XG5cbi8qKlxuICogU2hvcnQgZm9ybWF0IGZvciBgbXNgLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtc1xuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gc2hvcnQobXMpIHtcbiAgaWYgKG1zID49IGQpIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gZCkgKyAnZCc7XG4gIGlmIChtcyA+PSBoKSByZXR1cm4gTWF0aC5yb3VuZChtcyAvIGgpICsgJ2gnO1xuICBpZiAobXMgPj0gbSkgcmV0dXJuIE1hdGgucm91bmQobXMgLyBtKSArICdtJztcbiAgaWYgKG1zID49IHMpIHJldHVybiBNYXRoLnJvdW5kKG1zIC8gcykgKyAncyc7XG4gIHJldHVybiBtcyArICdtcyc7XG59XG5cbi8qKlxuICogTG9uZyBmb3JtYXQgZm9yIGBtc2AuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG1zXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBsb25nKG1zKSB7XG4gIHJldHVybiBwbHVyYWwobXMsIGQsICdkYXknKVxuICAgIHx8IHBsdXJhbChtcywgaCwgJ2hvdXInKVxuICAgIHx8IHBsdXJhbChtcywgbSwgJ21pbnV0ZScpXG4gICAgfHwgcGx1cmFsKG1zLCBzLCAnc2Vjb25kJylcbiAgICB8fCBtcyArICcgbXMnO1xufVxuXG4vKipcbiAqIFBsdXJhbGl6YXRpb24gaGVscGVyLlxuICovXG5cbmZ1bmN0aW9uIHBsdXJhbChtcywgbiwgbmFtZSkge1xuICBpZiAobXMgPCBuKSByZXR1cm47XG4gIGlmIChtcyA8IG4gKiAxLjUpIHJldHVybiBNYXRoLmZsb29yKG1zIC8gbikgKyAnICcgKyBuYW1lO1xuICByZXR1cm4gTWF0aC5jZWlsKG1zIC8gbikgKyAnICcgKyBuYW1lICsgJ3MnO1xufVxuIiwiaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICB9XG59XG4iLCJcbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgc3VwZXJhZ2VudCA9IHJlcXVpcmUoJ3N1cGVyYWdlbnQnKTtcbnZhciBkZWJ1ZyA9IHJlcXVpcmUoJ2RlYnVnJykoJ3dwY29tLXhoci1yZXF1ZXN0Jyk7XG5cbi8qKlxuICogRXhwb3J0IGEgc2luZ2xlIGByZXF1ZXN0YCBmdW5jdGlvbi5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVlc3Q7XG5cbi8qKlxuICogV29yZFByZXNzLmNvbSBSRVNUIEFQSSBiYXNlIGVuZHBvaW50LlxuICovXG5cbnZhciBwcm94eU9yaWdpbiA9ICdodHRwczovL3B1YmxpYy1hcGkud29yZHByZXNzLmNvbSc7XG5cbi8qKlxuICogRGVmYXVsdCBXb3JkUHJlc3MuY29tIFJFU1QgQVBJIFZlcnNpb24uXG4gKi9cblxudmFyIGRlZmF1bHRBcGlWZXJzaW9uID0gJzEnO1xuXG4vKipcbiAqIFBlcmZvcm1zIGFuIFhNTEh0dHBSZXF1ZXN0IGFnYWluc3QgdGhlIFdvcmRQcmVzcy5jb20gUkVTVCBBUEkuXG4gKlxuICogQHBhcmFtIHtPYmplY3R8U3RyaW5nfSBwYXJhbXNcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIHJlcXVlc3QgKHBhcmFtcywgZm4pIHtcblxuICBpZiAoJ3N0cmluZycgPT0gdHlwZW9mIHBhcmFtcykge1xuICAgIHBhcmFtcyA9IHsgcGF0aDogcGFyYW1zIH07XG4gIH1cblxuICB2YXIgbWV0aG9kID0gKHBhcmFtcy5tZXRob2QgfHwgJ0dFVCcpLnRvTG93ZXJDYXNlKCk7XG4gIGRlYnVnKCdBUEkgSFRUUCBNZXRob2Q6ICVvJywgbWV0aG9kKTtcbiAgZGVsZXRlIHBhcmFtcy5tZXRob2Q7XG5cbiAgdmFyIGFwaVZlcnNpb24gPSBwYXJhbXMuYXBpVmVyc2lvbiB8fCBkZWZhdWx0QXBpVmVyc2lvbjtcbiAgZGVsZXRlIHBhcmFtcy5hcGlWZXJzaW9uO1xuXG4gIHZhciB1cmwgPSBwcm94eU9yaWdpbiArICcvcmVzdC92JyArIGFwaVZlcnNpb24gKyBwYXJhbXMucGF0aDtcbiAgZGVidWcoJ0FQSSBVUkw6ICVvJywgdXJsKTtcbiAgZGVsZXRlIHBhcmFtcy5wYXRoO1xuXG4gIC8vIGNyZWF0ZSBIVFRQIFJlcXVlc3Qgb2JqZWN0XG4gIHZhciByZXEgPSBzdXBlcmFnZW50W21ldGhvZF0odXJsKTtcblxuICAvLyBUb2tlbiBhdXRoZW50aWNhdGlvblxuICBpZiAocGFyYW1zLmF1dGhUb2tlbikge1xuICAgIHJlcS5zZXQoJ0F1dGhvcml6YXRpb24nLCAnQmVhcmVyICcgKyBwYXJhbXMuYXV0aFRva2VuKTtcbiAgICBkZWxldGUgcGFyYW1zLmF1dGhUb2tlbjtcbiAgfVxuXG4gIC8vIFVSTCBxdWVyeXN0cmluZyB2YWx1ZXNcbiAgaWYgKHBhcmFtcy5xdWVyeSkge1xuICAgIHJlcS5xdWVyeShwYXJhbXMucXVlcnkpO1xuICAgIGRlYnVnKCdBUEkgc2VuZCBVUkwgcXVlcnlzdHJpbmc6ICVvJywgcGFyYW1zLnF1ZXJ5KTtcbiAgICBkZWxldGUgcGFyYW1zLnF1ZXJ5O1xuICB9XG5cbiAgLy8gUE9TVCBBUEkgcmVxdWVzdCBib2R5XG4gIGlmIChwYXJhbXMuYm9keSkge1xuICAgIHJlcS5zZW5kKHBhcmFtcy5ib2R5KTtcbiAgICBkZWJ1ZygnQVBJIHNlbmQgUE9TVCBib2R5OiAnLCBwYXJhbXMuYm9keSk7XG4gICAgZGVsZXRlIHBhcmFtcy5ib2R5O1xuICB9XG5cbiAgLy8gUE9TVCBGb3JtRGF0YSAoZm9yIGBtdWx0aXBhcnQvZm9ybS1kYXRhYCwgdXN1YWxseSBhIGZpbGUgdXBsb2FkKVxuICBpZiAocGFyYW1zLmZvcm1EYXRhKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJhbXMuZm9ybURhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBkYXRhID0gcGFyYW1zLmZvcm1EYXRhW2ldO1xuICAgICAgdmFyIGtleSA9IGRhdGFbMF07XG4gICAgICB2YXIgdmFsdWUgPSBkYXRhWzFdO1xuICAgICAgZGVidWcoJ2FkZGluZyBGb3JtRGF0YSBmaWVsZCAlbycsIGtleSk7XG4gICAgICByZXEuZmllbGQoa2V5LCB2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgLy8gc3RhcnQgdGhlIHJlcXVlc3RcbiAgcmVxLmVuZChmdW5jdGlvbiAoZXJyLCByZXMpe1xuICAgIGlmIChlcnIpIHJldHVybiBmbihlcnIpO1xuICAgIHZhciBib2R5ID0gcmVzLmJvZHk7XG4gICAgdmFyIGhlYWRlcnMgPSByZXMuaGVhZGVycztcbiAgICB2YXIgc3RhdHVzQ29kZSA9IHJlcy5zdGF0dXM7XG4gICAgZGVidWcoJyVvIC0+ICVvIHN0YXR1cyBjb2RlJywgdXJsLCBzdGF0dXNDb2RlKTtcblxuICAgIGlmIChib2R5ICYmIGhlYWRlcnMpIHtcbiAgICAgIGJvZHkuX2hlYWRlcnMgPSBoZWFkZXJzO1xuICAgIH1cblxuICAgIGlmICgyID09PSBNYXRoLmZsb29yKHN0YXR1c0NvZGUgLyAxMDApKSB7XG4gICAgICAvLyAyeHggc3RhdHVzIGNvZGUsIHN1Y2Nlc3NcbiAgICAgIGZuKG51bGwsIGJvZHkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBhbnkgb3RoZXIgc3RhdHVzIGNvZGUgaXMgYSBmYWlsdXJlXG4gICAgICBlcnIgPSBuZXcgRXJyb3IoKTtcbiAgICAgIGVyci5zdGF0dXNDb2RlID0gc3RhdHVzQ29kZTtcbiAgICAgIGZvciAodmFyIGkgaW4gYm9keSkgZXJyW2ldID0gYm9keVtpXTtcbiAgICAgIGlmIChib2R5ICYmIGJvZHkuZXJyb3IpIGVyci5uYW1lID0gdG9UaXRsZShib2R5LmVycm9yKSArICdFcnJvcic7XG4gICAgICBmbihlcnIpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIHJlcS54aHI7XG59XG5cbmZ1bmN0aW9uIHRvVGl0bGUgKHN0cikge1xuICBpZiAoIXN0ciB8fCAnc3RyaW5nJyAhPT0gdHlwZW9mIHN0cikgcmV0dXJuICcnO1xuICByZXR1cm4gc3RyLnJlcGxhY2UoLygoXnxfKVthLXpdKS9nLCBmdW5jdGlvbiAoJDEpIHtcbiAgICByZXR1cm4gJDEudG9VcHBlckNhc2UoKS5yZXBsYWNlKCdfJywgJycpO1xuICB9KTtcbn1cbiIsIi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgRW1pdHRlciA9IHJlcXVpcmUoJ2VtaXR0ZXInKTtcbnZhciByZWR1Y2UgPSByZXF1aXJlKCdyZWR1Y2UnKTtcblxuLyoqXG4gKiBSb290IHJlZmVyZW5jZSBmb3IgaWZyYW1lcy5cbiAqL1xuXG52YXIgcm9vdCA9ICd1bmRlZmluZWQnID09IHR5cGVvZiB3aW5kb3dcbiAgPyB0aGlzXG4gIDogd2luZG93O1xuXG4vKipcbiAqIE5vb3AuXG4gKi9cblxuZnVuY3Rpb24gbm9vcCgpe307XG5cbi8qKlxuICogQ2hlY2sgaWYgYG9iamAgaXMgYSBob3N0IG9iamVjdCxcbiAqIHdlIGRvbid0IHdhbnQgdG8gc2VyaWFsaXplIHRoZXNlIDopXG4gKlxuICogVE9ETzogZnV0dXJlIHByb29mLCBtb3ZlIHRvIGNvbXBvZW50IGxhbmRcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gaXNIb3N0KG9iaikge1xuICB2YXIgc3RyID0ge30udG9TdHJpbmcuY2FsbChvYmopO1xuXG4gIHN3aXRjaCAoc3RyKSB7XG4gICAgY2FzZSAnW29iamVjdCBGaWxlXSc6XG4gICAgY2FzZSAnW29iamVjdCBCbG9iXSc6XG4gICAgY2FzZSAnW29iamVjdCBGb3JtRGF0YV0nOlxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG4vKipcbiAqIERldGVybWluZSBYSFIuXG4gKi9cblxuZnVuY3Rpb24gZ2V0WEhSKCkge1xuICBpZiAocm9vdC5YTUxIdHRwUmVxdWVzdFxuICAgICYmICgnZmlsZTonICE9IHJvb3QubG9jYXRpb24ucHJvdG9jb2wgfHwgIXJvb3QuQWN0aXZlWE9iamVjdCkpIHtcbiAgICByZXR1cm4gbmV3IFhNTEh0dHBSZXF1ZXN0O1xuICB9IGVsc2Uge1xuICAgIHRyeSB7IHJldHVybiBuZXcgQWN0aXZlWE9iamVjdCgnTWljcm9zb2Z0LlhNTEhUVFAnKTsgfSBjYXRjaChlKSB7fVxuICAgIHRyeSB7IHJldHVybiBuZXcgQWN0aXZlWE9iamVjdCgnTXN4bWwyLlhNTEhUVFAuNi4wJyk7IH0gY2F0Y2goZSkge31cbiAgICB0cnkgeyByZXR1cm4gbmV3IEFjdGl2ZVhPYmplY3QoJ01zeG1sMi5YTUxIVFRQLjMuMCcpOyB9IGNhdGNoKGUpIHt9XG4gICAgdHJ5IHsgcmV0dXJuIG5ldyBBY3RpdmVYT2JqZWN0KCdNc3htbDIuWE1MSFRUUCcpOyB9IGNhdGNoKGUpIHt9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIFJlbW92ZXMgbGVhZGluZyBhbmQgdHJhaWxpbmcgd2hpdGVzcGFjZSwgYWRkZWQgdG8gc3VwcG9ydCBJRS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc1xuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxudmFyIHRyaW0gPSAnJy50cmltXG4gID8gZnVuY3Rpb24ocykgeyByZXR1cm4gcy50cmltKCk7IH1cbiAgOiBmdW5jdGlvbihzKSB7IHJldHVybiBzLnJlcGxhY2UoLyheXFxzKnxcXHMqJCkvZywgJycpOyB9O1xuXG4vKipcbiAqIENoZWNrIGlmIGBvYmpgIGlzIGFuIG9iamVjdC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gaXNPYmplY3Qob2JqKSB7XG4gIHJldHVybiBvYmogPT09IE9iamVjdChvYmopO1xufVxuXG4vKipcbiAqIFNlcmlhbGl6ZSB0aGUgZ2l2ZW4gYG9iamAuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gc2VyaWFsaXplKG9iaikge1xuICBpZiAoIWlzT2JqZWN0KG9iaikpIHJldHVybiBvYmo7XG4gIHZhciBwYWlycyA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKG51bGwgIT0gb2JqW2tleV0pIHtcbiAgICAgIHBhaXJzLnB1c2goZW5jb2RlVVJJQ29tcG9uZW50KGtleSlcbiAgICAgICAgKyAnPScgKyBlbmNvZGVVUklDb21wb25lbnQob2JqW2tleV0pKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHBhaXJzLmpvaW4oJyYnKTtcbn1cblxuLyoqXG4gKiBFeHBvc2Ugc2VyaWFsaXphdGlvbiBtZXRob2QuXG4gKi9cblxuIHJlcXVlc3Quc2VyaWFsaXplT2JqZWN0ID0gc2VyaWFsaXplO1xuXG4gLyoqXG4gICogUGFyc2UgdGhlIGdpdmVuIHgtd3d3LWZvcm0tdXJsZW5jb2RlZCBgc3RyYC5cbiAgKlxuICAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICogQGFwaSBwcml2YXRlXG4gICovXG5cbmZ1bmN0aW9uIHBhcnNlU3RyaW5nKHN0cikge1xuICB2YXIgb2JqID0ge307XG4gIHZhciBwYWlycyA9IHN0ci5zcGxpdCgnJicpO1xuICB2YXIgcGFydHM7XG4gIHZhciBwYWlyO1xuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBwYWlycy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIHBhaXIgPSBwYWlyc1tpXTtcbiAgICBwYXJ0cyA9IHBhaXIuc3BsaXQoJz0nKTtcbiAgICBvYmpbZGVjb2RlVVJJQ29tcG9uZW50KHBhcnRzWzBdKV0gPSBkZWNvZGVVUklDb21wb25lbnQocGFydHNbMV0pO1xuICB9XG5cbiAgcmV0dXJuIG9iajtcbn1cblxuLyoqXG4gKiBFeHBvc2UgcGFyc2VyLlxuICovXG5cbnJlcXVlc3QucGFyc2VTdHJpbmcgPSBwYXJzZVN0cmluZztcblxuLyoqXG4gKiBEZWZhdWx0IE1JTUUgdHlwZSBtYXAuXG4gKlxuICogICAgIHN1cGVyYWdlbnQudHlwZXMueG1sID0gJ2FwcGxpY2F0aW9uL3htbCc7XG4gKlxuICovXG5cbnJlcXVlc3QudHlwZXMgPSB7XG4gIGh0bWw6ICd0ZXh0L2h0bWwnLFxuICBqc29uOiAnYXBwbGljYXRpb24vanNvbicsXG4gIHhtbDogJ2FwcGxpY2F0aW9uL3htbCcsXG4gIHVybGVuY29kZWQ6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnLFxuICAnZm9ybSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnLFxuICAnZm9ybS1kYXRhJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCdcbn07XG5cbi8qKlxuICogRGVmYXVsdCBzZXJpYWxpemF0aW9uIG1hcC5cbiAqXG4gKiAgICAgc3VwZXJhZ2VudC5zZXJpYWxpemVbJ2FwcGxpY2F0aW9uL3htbCddID0gZnVuY3Rpb24ob2JqKXtcbiAqICAgICAgIHJldHVybiAnZ2VuZXJhdGVkIHhtbCBoZXJlJztcbiAqICAgICB9O1xuICpcbiAqL1xuXG4gcmVxdWVzdC5zZXJpYWxpemUgPSB7XG4gICAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJzogc2VyaWFsaXplLFxuICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBKU09OLnN0cmluZ2lmeVxuIH07XG5cbiAvKipcbiAgKiBEZWZhdWx0IHBhcnNlcnMuXG4gICpcbiAgKiAgICAgc3VwZXJhZ2VudC5wYXJzZVsnYXBwbGljYXRpb24veG1sJ10gPSBmdW5jdGlvbihzdHIpe1xuICAqICAgICAgIHJldHVybiB7IG9iamVjdCBwYXJzZWQgZnJvbSBzdHIgfTtcbiAgKiAgICAgfTtcbiAgKlxuICAqL1xuXG5yZXF1ZXN0LnBhcnNlID0ge1xuICAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJzogcGFyc2VTdHJpbmcsXG4gICdhcHBsaWNhdGlvbi9qc29uJzogSlNPTi5wYXJzZVxufTtcblxuLyoqXG4gKiBQYXJzZSB0aGUgZ2l2ZW4gaGVhZGVyIGBzdHJgIGludG9cbiAqIGFuIG9iamVjdCBjb250YWluaW5nIHRoZSBtYXBwZWQgZmllbGRzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIHBhcnNlSGVhZGVyKHN0cikge1xuICB2YXIgbGluZXMgPSBzdHIuc3BsaXQoL1xccj9cXG4vKTtcbiAgdmFyIGZpZWxkcyA9IHt9O1xuICB2YXIgaW5kZXg7XG4gIHZhciBsaW5lO1xuICB2YXIgZmllbGQ7XG4gIHZhciB2YWw7XG5cbiAgbGluZXMucG9wKCk7IC8vIHRyYWlsaW5nIENSTEZcblxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gbGluZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBsaW5lID0gbGluZXNbaV07XG4gICAgaW5kZXggPSBsaW5lLmluZGV4T2YoJzonKTtcbiAgICBmaWVsZCA9IGxpbmUuc2xpY2UoMCwgaW5kZXgpLnRvTG93ZXJDYXNlKCk7XG4gICAgdmFsID0gdHJpbShsaW5lLnNsaWNlKGluZGV4ICsgMSkpO1xuICAgIGZpZWxkc1tmaWVsZF0gPSB2YWw7XG4gIH1cblxuICByZXR1cm4gZmllbGRzO1xufVxuXG4vKipcbiAqIFJldHVybiB0aGUgbWltZSB0eXBlIGZvciB0aGUgZ2l2ZW4gYHN0cmAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gdHlwZShzdHIpe1xuICByZXR1cm4gc3RyLnNwbGl0KC8gKjsgKi8pLnNoaWZ0KCk7XG59O1xuXG4vKipcbiAqIFJldHVybiBoZWFkZXIgZmllbGQgcGFyYW1ldGVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBwYXJhbXMoc3RyKXtcbiAgcmV0dXJuIHJlZHVjZShzdHIuc3BsaXQoLyAqOyAqLyksIGZ1bmN0aW9uKG9iaiwgc3RyKXtcbiAgICB2YXIgcGFydHMgPSBzdHIuc3BsaXQoLyAqPSAqLylcbiAgICAgICwga2V5ID0gcGFydHMuc2hpZnQoKVxuICAgICAgLCB2YWwgPSBwYXJ0cy5zaGlmdCgpO1xuXG4gICAgaWYgKGtleSAmJiB2YWwpIG9ialtrZXldID0gdmFsO1xuICAgIHJldHVybiBvYmo7XG4gIH0sIHt9KTtcbn07XG5cbi8qKlxuICogSW5pdGlhbGl6ZSBhIG5ldyBgUmVzcG9uc2VgIHdpdGggdGhlIGdpdmVuIGB4aHJgLlxuICpcbiAqICAtIHNldCBmbGFncyAoLm9rLCAuZXJyb3IsIGV0YylcbiAqICAtIHBhcnNlIGhlYWRlclxuICpcbiAqIEV4YW1wbGVzOlxuICpcbiAqICBBbGlhc2luZyBgc3VwZXJhZ2VudGAgYXMgYHJlcXVlc3RgIGlzIG5pY2U6XG4gKlxuICogICAgICByZXF1ZXN0ID0gc3VwZXJhZ2VudDtcbiAqXG4gKiAgV2UgY2FuIHVzZSB0aGUgcHJvbWlzZS1saWtlIEFQSSwgb3IgcGFzcyBjYWxsYmFja3M6XG4gKlxuICogICAgICByZXF1ZXN0LmdldCgnLycpLmVuZChmdW5jdGlvbihyZXMpe30pO1xuICogICAgICByZXF1ZXN0LmdldCgnLycsIGZ1bmN0aW9uKHJlcyl7fSk7XG4gKlxuICogIFNlbmRpbmcgZGF0YSBjYW4gYmUgY2hhaW5lZDpcbiAqXG4gKiAgICAgIHJlcXVlc3RcbiAqICAgICAgICAucG9zdCgnL3VzZXInKVxuICogICAgICAgIC5zZW5kKHsgbmFtZTogJ3RqJyB9KVxuICogICAgICAgIC5lbmQoZnVuY3Rpb24ocmVzKXt9KTtcbiAqXG4gKiAgT3IgcGFzc2VkIHRvIGAuc2VuZCgpYDpcbiAqXG4gKiAgICAgIHJlcXVlc3RcbiAqICAgICAgICAucG9zdCgnL3VzZXInKVxuICogICAgICAgIC5zZW5kKHsgbmFtZTogJ3RqJyB9LCBmdW5jdGlvbihyZXMpe30pO1xuICpcbiAqICBPciBwYXNzZWQgdG8gYC5wb3N0KClgOlxuICpcbiAqICAgICAgcmVxdWVzdFxuICogICAgICAgIC5wb3N0KCcvdXNlcicsIHsgbmFtZTogJ3RqJyB9KVxuICogICAgICAgIC5lbmQoZnVuY3Rpb24ocmVzKXt9KTtcbiAqXG4gKiBPciBmdXJ0aGVyIHJlZHVjZWQgdG8gYSBzaW5nbGUgY2FsbCBmb3Igc2ltcGxlIGNhc2VzOlxuICpcbiAqICAgICAgcmVxdWVzdFxuICogICAgICAgIC5wb3N0KCcvdXNlcicsIHsgbmFtZTogJ3RqJyB9LCBmdW5jdGlvbihyZXMpe30pO1xuICpcbiAqIEBwYXJhbSB7WE1MSFRUUFJlcXVlc3R9IHhoclxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIFJlc3BvbnNlKHJlcSwgb3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgdGhpcy5yZXEgPSByZXE7XG4gIHRoaXMueGhyID0gdGhpcy5yZXEueGhyO1xuICB0aGlzLnRleHQgPSB0aGlzLnhoci5yZXNwb25zZVRleHQ7XG4gIHRoaXMuc2V0U3RhdHVzUHJvcGVydGllcyh0aGlzLnhoci5zdGF0dXMpO1xuICB0aGlzLmhlYWRlciA9IHRoaXMuaGVhZGVycyA9IHBhcnNlSGVhZGVyKHRoaXMueGhyLmdldEFsbFJlc3BvbnNlSGVhZGVycygpKTtcbiAgLy8gZ2V0QWxsUmVzcG9uc2VIZWFkZXJzIHNvbWV0aW1lcyBmYWxzZWx5IHJldHVybnMgXCJcIiBmb3IgQ09SUyByZXF1ZXN0cywgYnV0XG4gIC8vIGdldFJlc3BvbnNlSGVhZGVyIHN0aWxsIHdvcmtzLiBzbyB3ZSBnZXQgY29udGVudC10eXBlIGV2ZW4gaWYgZ2V0dGluZ1xuICAvLyBvdGhlciBoZWFkZXJzIGZhaWxzLlxuICB0aGlzLmhlYWRlclsnY29udGVudC10eXBlJ10gPSB0aGlzLnhoci5nZXRSZXNwb25zZUhlYWRlcignY29udGVudC10eXBlJyk7XG4gIHRoaXMuc2V0SGVhZGVyUHJvcGVydGllcyh0aGlzLmhlYWRlcik7XG4gIHRoaXMuYm9keSA9IHRoaXMucmVxLm1ldGhvZCAhPSAnSEVBRCdcbiAgICA/IHRoaXMucGFyc2VCb2R5KHRoaXMudGV4dClcbiAgICA6IG51bGw7XG59XG5cbi8qKlxuICogR2V0IGNhc2UtaW5zZW5zaXRpdmUgYGZpZWxkYCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZmllbGRcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVzcG9uc2UucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKGZpZWxkKXtcbiAgcmV0dXJuIHRoaXMuaGVhZGVyW2ZpZWxkLnRvTG93ZXJDYXNlKCldO1xufTtcblxuLyoqXG4gKiBTZXQgaGVhZGVyIHJlbGF0ZWQgcHJvcGVydGllczpcbiAqXG4gKiAgIC0gYC50eXBlYCB0aGUgY29udGVudCB0eXBlIHdpdGhvdXQgcGFyYW1zXG4gKlxuICogQSByZXNwb25zZSBvZiBcIkNvbnRlbnQtVHlwZTogdGV4dC9wbGFpbjsgY2hhcnNldD11dGYtOFwiXG4gKiB3aWxsIHByb3ZpZGUgeW91IHdpdGggYSBgLnR5cGVgIG9mIFwidGV4dC9wbGFpblwiLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBoZWFkZXJcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cblJlc3BvbnNlLnByb3RvdHlwZS5zZXRIZWFkZXJQcm9wZXJ0aWVzID0gZnVuY3Rpb24oaGVhZGVyKXtcbiAgLy8gY29udGVudC10eXBlXG4gIHZhciBjdCA9IHRoaXMuaGVhZGVyWydjb250ZW50LXR5cGUnXSB8fCAnJztcbiAgdGhpcy50eXBlID0gdHlwZShjdCk7XG5cbiAgLy8gcGFyYW1zXG4gIHZhciBvYmogPSBwYXJhbXMoY3QpO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB0aGlzW2tleV0gPSBvYmpba2V5XTtcbn07XG5cbi8qKlxuICogUGFyc2UgdGhlIGdpdmVuIGJvZHkgYHN0cmAuXG4gKlxuICogVXNlZCBmb3IgYXV0by1wYXJzaW5nIG9mIGJvZGllcy4gUGFyc2Vyc1xuICogYXJlIGRlZmluZWQgb24gdGhlIGBzdXBlcmFnZW50LnBhcnNlYCBvYmplY3QuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7TWl4ZWR9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5SZXNwb25zZS5wcm90b3R5cGUucGFyc2VCb2R5ID0gZnVuY3Rpb24oc3RyKXtcbiAgdmFyIHBhcnNlID0gcmVxdWVzdC5wYXJzZVt0aGlzLnR5cGVdO1xuICByZXR1cm4gcGFyc2UgJiYgc3RyICYmIHN0ci5sZW5ndGhcbiAgICA/IHBhcnNlKHN0cilcbiAgICA6IG51bGw7XG59O1xuXG4vKipcbiAqIFNldCBmbGFncyBzdWNoIGFzIGAub2tgIGJhc2VkIG9uIGBzdGF0dXNgLlxuICpcbiAqIEZvciBleGFtcGxlIGEgMnh4IHJlc3BvbnNlIHdpbGwgZ2l2ZSB5b3UgYSBgLm9rYCBvZiBfX3RydWVfX1xuICogd2hlcmVhcyA1eHggd2lsbCBiZSBfX2ZhbHNlX18gYW5kIGAuZXJyb3JgIHdpbGwgYmUgX190cnVlX18uIFRoZVxuICogYC5jbGllbnRFcnJvcmAgYW5kIGAuc2VydmVyRXJyb3JgIGFyZSBhbHNvIGF2YWlsYWJsZSB0byBiZSBtb3JlXG4gKiBzcGVjaWZpYywgYW5kIGAuc3RhdHVzVHlwZWAgaXMgdGhlIGNsYXNzIG9mIGVycm9yIHJhbmdpbmcgZnJvbSAxLi41XG4gKiBzb21ldGltZXMgdXNlZnVsIGZvciBtYXBwaW5nIHJlc3BvbmQgY29sb3JzIGV0Yy5cbiAqXG4gKiBcInN1Z2FyXCIgcHJvcGVydGllcyBhcmUgYWxzbyBkZWZpbmVkIGZvciBjb21tb24gY2FzZXMuIEN1cnJlbnRseSBwcm92aWRpbmc6XG4gKlxuICogICAtIC5ub0NvbnRlbnRcbiAqICAgLSAuYmFkUmVxdWVzdFxuICogICAtIC51bmF1dGhvcml6ZWRcbiAqICAgLSAubm90QWNjZXB0YWJsZVxuICogICAtIC5ub3RGb3VuZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBzdGF0dXNcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cblJlc3BvbnNlLnByb3RvdHlwZS5zZXRTdGF0dXNQcm9wZXJ0aWVzID0gZnVuY3Rpb24oc3RhdHVzKXtcbiAgdmFyIHR5cGUgPSBzdGF0dXMgLyAxMDAgfCAwO1xuXG4gIC8vIHN0YXR1cyAvIGNsYXNzXG4gIHRoaXMuc3RhdHVzID0gc3RhdHVzO1xuICB0aGlzLnN0YXR1c1R5cGUgPSB0eXBlO1xuXG4gIC8vIGJhc2ljc1xuICB0aGlzLmluZm8gPSAxID09IHR5cGU7XG4gIHRoaXMub2sgPSAyID09IHR5cGU7XG4gIHRoaXMuY2xpZW50RXJyb3IgPSA0ID09IHR5cGU7XG4gIHRoaXMuc2VydmVyRXJyb3IgPSA1ID09IHR5cGU7XG4gIHRoaXMuZXJyb3IgPSAoNCA9PSB0eXBlIHx8IDUgPT0gdHlwZSlcbiAgICA/IHRoaXMudG9FcnJvcigpXG4gICAgOiBmYWxzZTtcblxuICAvLyBzdWdhclxuICB0aGlzLmFjY2VwdGVkID0gMjAyID09IHN0YXR1cztcbiAgdGhpcy5ub0NvbnRlbnQgPSAyMDQgPT0gc3RhdHVzIHx8IDEyMjMgPT0gc3RhdHVzO1xuICB0aGlzLmJhZFJlcXVlc3QgPSA0MDAgPT0gc3RhdHVzO1xuICB0aGlzLnVuYXV0aG9yaXplZCA9IDQwMSA9PSBzdGF0dXM7XG4gIHRoaXMubm90QWNjZXB0YWJsZSA9IDQwNiA9PSBzdGF0dXM7XG4gIHRoaXMubm90Rm91bmQgPSA0MDQgPT0gc3RhdHVzO1xuICB0aGlzLmZvcmJpZGRlbiA9IDQwMyA9PSBzdGF0dXM7XG59O1xuXG4vKipcbiAqIFJldHVybiBhbiBgRXJyb3JgIHJlcHJlc2VudGF0aXZlIG9mIHRoaXMgcmVzcG9uc2UuXG4gKlxuICogQHJldHVybiB7RXJyb3J9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlc3BvbnNlLnByb3RvdHlwZS50b0Vycm9yID0gZnVuY3Rpb24oKXtcbiAgdmFyIHJlcSA9IHRoaXMucmVxO1xuICB2YXIgbWV0aG9kID0gcmVxLm1ldGhvZDtcbiAgdmFyIHVybCA9IHJlcS51cmw7XG5cbiAgdmFyIG1zZyA9ICdjYW5ub3QgJyArIG1ldGhvZCArICcgJyArIHVybCArICcgKCcgKyB0aGlzLnN0YXR1cyArICcpJztcbiAgdmFyIGVyciA9IG5ldyBFcnJvcihtc2cpO1xuICBlcnIuc3RhdHVzID0gdGhpcy5zdGF0dXM7XG4gIGVyci5tZXRob2QgPSBtZXRob2Q7XG4gIGVyci51cmwgPSB1cmw7XG5cbiAgcmV0dXJuIGVycjtcbn07XG5cbi8qKlxuICogRXhwb3NlIGBSZXNwb25zZWAuXG4gKi9cblxucmVxdWVzdC5SZXNwb25zZSA9IFJlc3BvbnNlO1xuXG4vKipcbiAqIEluaXRpYWxpemUgYSBuZXcgYFJlcXVlc3RgIHdpdGggdGhlIGdpdmVuIGBtZXRob2RgIGFuZCBgdXJsYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbWV0aG9kXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIFJlcXVlc3QobWV0aG9kLCB1cmwpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBFbWl0dGVyLmNhbGwodGhpcyk7XG4gIHRoaXMuX3F1ZXJ5ID0gdGhpcy5fcXVlcnkgfHwgW107XG4gIHRoaXMubWV0aG9kID0gbWV0aG9kO1xuICB0aGlzLnVybCA9IHVybDtcbiAgdGhpcy5oZWFkZXIgPSB7fTtcbiAgdGhpcy5faGVhZGVyID0ge307XG4gIHRoaXMub24oJ2VuZCcsIGZ1bmN0aW9uKCl7XG4gICAgdHJ5IHtcbiAgICAgIHZhciByZXMgPSBuZXcgUmVzcG9uc2Uoc2VsZik7XG4gICAgICBpZiAoJ0hFQUQnID09IG1ldGhvZCkgcmVzLnRleHQgPSBudWxsO1xuICAgICAgc2VsZi5jYWxsYmFjayhudWxsLCByZXMpO1xuICAgIH0gY2F0Y2goZSkge1xuICAgICAgdmFyIGVyciA9IG5ldyBFcnJvcignUGFyc2VyIGlzIHVuYWJsZSB0byBwYXJzZSB0aGUgcmVzcG9uc2UnKTtcbiAgICAgIGVyci5wYXJzZSA9IHRydWU7XG4gICAgICBlcnIub3JpZ2luYWwgPSBlO1xuICAgICAgc2VsZi5jYWxsYmFjayhlcnIpO1xuICAgIH1cbiAgfSk7XG59XG5cbi8qKlxuICogTWl4aW4gYEVtaXR0ZXJgLlxuICovXG5cbkVtaXR0ZXIoUmVxdWVzdC5wcm90b3R5cGUpO1xuXG4vKipcbiAqIEFsbG93IGZvciBleHRlbnNpb25cbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS51c2UgPSBmdW5jdGlvbihmbikge1xuICBmbih0aGlzKTtcbiAgcmV0dXJuIHRoaXM7XG59XG5cbi8qKlxuICogU2V0IHRpbWVvdXQgdG8gYG1zYC5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gbXNcbiAqIEByZXR1cm4ge1JlcXVlc3R9IGZvciBjaGFpbmluZ1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS50aW1lb3V0ID0gZnVuY3Rpb24obXMpe1xuICB0aGlzLl90aW1lb3V0ID0gbXM7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBDbGVhciBwcmV2aW91cyB0aW1lb3V0LlxuICpcbiAqIEByZXR1cm4ge1JlcXVlc3R9IGZvciBjaGFpbmluZ1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS5jbGVhclRpbWVvdXQgPSBmdW5jdGlvbigpe1xuICB0aGlzLl90aW1lb3V0ID0gMDtcbiAgY2xlYXJUaW1lb3V0KHRoaXMuX3RpbWVyKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFib3J0IHRoZSByZXF1ZXN0LCBhbmQgY2xlYXIgcG90ZW50aWFsIHRpbWVvdXQuXG4gKlxuICogQHJldHVybiB7UmVxdWVzdH1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuYWJvcnQgPSBmdW5jdGlvbigpe1xuICBpZiAodGhpcy5hYm9ydGVkKSByZXR1cm47XG4gIHRoaXMuYWJvcnRlZCA9IHRydWU7XG4gIHRoaXMueGhyLmFib3J0KCk7XG4gIHRoaXMuY2xlYXJUaW1lb3V0KCk7XG4gIHRoaXMuZW1pdCgnYWJvcnQnKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFNldCBoZWFkZXIgYGZpZWxkYCB0byBgdmFsYCwgb3IgbXVsdGlwbGUgZmllbGRzIHdpdGggb25lIG9iamVjdC5cbiAqXG4gKiBFeGFtcGxlczpcbiAqXG4gKiAgICAgIHJlcS5nZXQoJy8nKVxuICogICAgICAgIC5zZXQoJ0FjY2VwdCcsICdhcHBsaWNhdGlvbi9qc29uJylcbiAqICAgICAgICAuc2V0KCdYLUFQSS1LZXknLCAnZm9vYmFyJylcbiAqICAgICAgICAuZW5kKGNhbGxiYWNrKTtcbiAqXG4gKiAgICAgIHJlcS5nZXQoJy8nKVxuICogICAgICAgIC5zZXQoeyBBY2NlcHQ6ICdhcHBsaWNhdGlvbi9qc29uJywgJ1gtQVBJLUtleSc6ICdmb29iYXInIH0pXG4gKiAgICAgICAgLmVuZChjYWxsYmFjayk7XG4gKlxuICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fSBmaWVsZFxuICogQHBhcmFtIHtTdHJpbmd9IHZhbFxuICogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlcXVlc3QucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKGZpZWxkLCB2YWwpe1xuICBpZiAoaXNPYmplY3QoZmllbGQpKSB7XG4gICAgZm9yICh2YXIga2V5IGluIGZpZWxkKSB7XG4gICAgICB0aGlzLnNldChrZXksIGZpZWxkW2tleV0pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICB0aGlzLl9oZWFkZXJbZmllbGQudG9Mb3dlckNhc2UoKV0gPSB2YWw7XG4gIHRoaXMuaGVhZGVyW2ZpZWxkXSA9IHZhbDtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBoZWFkZXIgYGZpZWxkYC5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqICAgICAgcmVxLmdldCgnLycpXG4gKiAgICAgICAgLnVuc2V0KCdVc2VyLUFnZW50JylcbiAqICAgICAgICAuZW5kKGNhbGxiYWNrKTtcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZmllbGRcbiAqIEByZXR1cm4ge1JlcXVlc3R9IGZvciBjaGFpbmluZ1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS51bnNldCA9IGZ1bmN0aW9uKGZpZWxkKXtcbiAgZGVsZXRlIHRoaXMuX2hlYWRlcltmaWVsZC50b0xvd2VyQ2FzZSgpXTtcbiAgZGVsZXRlIHRoaXMuaGVhZGVyW2ZpZWxkXTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEdldCBjYXNlLWluc2Vuc2l0aXZlIGhlYWRlciBgZmllbGRgIHZhbHVlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBmaWVsZFxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuZ2V0SGVhZGVyID0gZnVuY3Rpb24oZmllbGQpe1xuICByZXR1cm4gdGhpcy5faGVhZGVyW2ZpZWxkLnRvTG93ZXJDYXNlKCldO1xufTtcblxuLyoqXG4gKiBTZXQgQ29udGVudC1UeXBlIHRvIGB0eXBlYCwgbWFwcGluZyB2YWx1ZXMgZnJvbSBgcmVxdWVzdC50eXBlc2AuXG4gKlxuICogRXhhbXBsZXM6XG4gKlxuICogICAgICBzdXBlcmFnZW50LnR5cGVzLnhtbCA9ICdhcHBsaWNhdGlvbi94bWwnO1xuICpcbiAqICAgICAgcmVxdWVzdC5wb3N0KCcvJylcbiAqICAgICAgICAudHlwZSgneG1sJylcbiAqICAgICAgICAuc2VuZCh4bWxzdHJpbmcpXG4gKiAgICAgICAgLmVuZChjYWxsYmFjayk7XG4gKlxuICogICAgICByZXF1ZXN0LnBvc3QoJy8nKVxuICogICAgICAgIC50eXBlKCdhcHBsaWNhdGlvbi94bWwnKVxuICogICAgICAgIC5zZW5kKHhtbHN0cmluZylcbiAqICAgICAgICAuZW5kKGNhbGxiYWNrKTtcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZVxuICogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlcXVlc3QucHJvdG90eXBlLnR5cGUgPSBmdW5jdGlvbih0eXBlKXtcbiAgdGhpcy5zZXQoJ0NvbnRlbnQtVHlwZScsIHJlcXVlc3QudHlwZXNbdHlwZV0gfHwgdHlwZSk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTZXQgQWNjZXB0IHRvIGB0eXBlYCwgbWFwcGluZyB2YWx1ZXMgZnJvbSBgcmVxdWVzdC50eXBlc2AuXG4gKlxuICogRXhhbXBsZXM6XG4gKlxuICogICAgICBzdXBlcmFnZW50LnR5cGVzLmpzb24gPSAnYXBwbGljYXRpb24vanNvbic7XG4gKlxuICogICAgICByZXF1ZXN0LmdldCgnL2FnZW50JylcbiAqICAgICAgICAuYWNjZXB0KCdqc29uJylcbiAqICAgICAgICAuZW5kKGNhbGxiYWNrKTtcbiAqXG4gKiAgICAgIHJlcXVlc3QuZ2V0KCcvYWdlbnQnKVxuICogICAgICAgIC5hY2NlcHQoJ2FwcGxpY2F0aW9uL2pzb24nKVxuICogICAgICAgIC5lbmQoY2FsbGJhY2spO1xuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBhY2NlcHRcbiAqIEByZXR1cm4ge1JlcXVlc3R9IGZvciBjaGFpbmluZ1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS5hY2NlcHQgPSBmdW5jdGlvbih0eXBlKXtcbiAgdGhpcy5zZXQoJ0FjY2VwdCcsIHJlcXVlc3QudHlwZXNbdHlwZV0gfHwgdHlwZSk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTZXQgQXV0aG9yaXphdGlvbiBmaWVsZCB2YWx1ZSB3aXRoIGB1c2VyYCBhbmQgYHBhc3NgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB1c2VyXG4gKiBAcGFyYW0ge1N0cmluZ30gcGFzc1xuICogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlcXVlc3QucHJvdG90eXBlLmF1dGggPSBmdW5jdGlvbih1c2VyLCBwYXNzKXtcbiAgdmFyIHN0ciA9IGJ0b2EodXNlciArICc6JyArIHBhc3MpO1xuICB0aGlzLnNldCgnQXV0aG9yaXphdGlvbicsICdCYXNpYyAnICsgc3RyKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiogQWRkIHF1ZXJ5LXN0cmluZyBgdmFsYC5cbipcbiogRXhhbXBsZXM6XG4qXG4qICAgcmVxdWVzdC5nZXQoJy9zaG9lcycpXG4qICAgICAucXVlcnkoJ3NpemU9MTAnKVxuKiAgICAgLnF1ZXJ5KHsgY29sb3I6ICdibHVlJyB9KVxuKlxuKiBAcGFyYW0ge09iamVjdHxTdHJpbmd9IHZhbFxuKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiogQGFwaSBwdWJsaWNcbiovXG5cblJlcXVlc3QucHJvdG90eXBlLnF1ZXJ5ID0gZnVuY3Rpb24odmFsKXtcbiAgaWYgKCdzdHJpbmcnICE9IHR5cGVvZiB2YWwpIHZhbCA9IHNlcmlhbGl6ZSh2YWwpO1xuICBpZiAodmFsKSB0aGlzLl9xdWVyeS5wdXNoKHZhbCk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBXcml0ZSB0aGUgZmllbGQgYG5hbWVgIGFuZCBgdmFsYCBmb3IgXCJtdWx0aXBhcnQvZm9ybS1kYXRhXCJcbiAqIHJlcXVlc3QgYm9kaWVzLlxuICpcbiAqIGBgYCBqc1xuICogcmVxdWVzdC5wb3N0KCcvdXBsb2FkJylcbiAqICAgLmZpZWxkKCdmb28nLCAnYmFyJylcbiAqICAgLmVuZChjYWxsYmFjayk7XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICogQHBhcmFtIHtTdHJpbmd8QmxvYnxGaWxlfSB2YWxcbiAqIEByZXR1cm4ge1JlcXVlc3R9IGZvciBjaGFpbmluZ1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS5maWVsZCA9IGZ1bmN0aW9uKG5hbWUsIHZhbCl7XG4gIGlmICghdGhpcy5fZm9ybURhdGEpIHRoaXMuX2Zvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCk7XG4gIHRoaXMuX2Zvcm1EYXRhLmFwcGVuZChuYW1lLCB2YWwpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUXVldWUgdGhlIGdpdmVuIGBmaWxlYCBhcyBhbiBhdHRhY2htZW50IHRvIHRoZSBzcGVjaWZpZWQgYGZpZWxkYCxcbiAqIHdpdGggb3B0aW9uYWwgYGZpbGVuYW1lYC5cbiAqXG4gKiBgYGAganNcbiAqIHJlcXVlc3QucG9zdCgnL3VwbG9hZCcpXG4gKiAgIC5hdHRhY2gobmV3IEJsb2IoWyc8YSBpZD1cImFcIj48YiBpZD1cImJcIj5oZXkhPC9iPjwvYT4nXSwgeyB0eXBlOiBcInRleHQvaHRtbFwifSkpXG4gKiAgIC5lbmQoY2FsbGJhY2spO1xuICogYGBgXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGZpZWxkXG4gKiBAcGFyYW0ge0Jsb2J8RmlsZX0gZmlsZVxuICogQHBhcmFtIHtTdHJpbmd9IGZpbGVuYW1lXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fSBmb3IgY2hhaW5pbmdcbiAqIEBhcGkgcHVibGljXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUuYXR0YWNoID0gZnVuY3Rpb24oZmllbGQsIGZpbGUsIGZpbGVuYW1lKXtcbiAgaWYgKCF0aGlzLl9mb3JtRGF0YSkgdGhpcy5fZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoKTtcbiAgdGhpcy5fZm9ybURhdGEuYXBwZW5kKGZpZWxkLCBmaWxlLCBmaWxlbmFtZSk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTZW5kIGBkYXRhYCwgZGVmYXVsdGluZyB0aGUgYC50eXBlKClgIHRvIFwianNvblwiIHdoZW5cbiAqIGFuIG9iamVjdCBpcyBnaXZlbi5cbiAqXG4gKiBFeGFtcGxlczpcbiAqXG4gKiAgICAgICAvLyBxdWVyeXN0cmluZ1xuICogICAgICAgcmVxdWVzdC5nZXQoJy9zZWFyY2gnKVxuICogICAgICAgICAuZW5kKGNhbGxiYWNrKVxuICpcbiAqICAgICAgIC8vIG11bHRpcGxlIGRhdGEgXCJ3cml0ZXNcIlxuICogICAgICAgcmVxdWVzdC5nZXQoJy9zZWFyY2gnKVxuICogICAgICAgICAuc2VuZCh7IHNlYXJjaDogJ3F1ZXJ5JyB9KVxuICogICAgICAgICAuc2VuZCh7IHJhbmdlOiAnMS4uNScgfSlcbiAqICAgICAgICAgLnNlbmQoeyBvcmRlcjogJ2Rlc2MnIH0pXG4gKiAgICAgICAgIC5lbmQoY2FsbGJhY2spXG4gKlxuICogICAgICAgLy8gbWFudWFsIGpzb25cbiAqICAgICAgIHJlcXVlc3QucG9zdCgnL3VzZXInKVxuICogICAgICAgICAudHlwZSgnanNvbicpXG4gKiAgICAgICAgIC5zZW5kKCd7XCJuYW1lXCI6XCJ0alwifSlcbiAqICAgICAgICAgLmVuZChjYWxsYmFjaylcbiAqXG4gKiAgICAgICAvLyBhdXRvIGpzb25cbiAqICAgICAgIHJlcXVlc3QucG9zdCgnL3VzZXInKVxuICogICAgICAgICAuc2VuZCh7IG5hbWU6ICd0aicgfSlcbiAqICAgICAgICAgLmVuZChjYWxsYmFjaylcbiAqXG4gKiAgICAgICAvLyBtYW51YWwgeC13d3ctZm9ybS11cmxlbmNvZGVkXG4gKiAgICAgICByZXF1ZXN0LnBvc3QoJy91c2VyJylcbiAqICAgICAgICAgLnR5cGUoJ2Zvcm0nKVxuICogICAgICAgICAuc2VuZCgnbmFtZT10aicpXG4gKiAgICAgICAgIC5lbmQoY2FsbGJhY2spXG4gKlxuICogICAgICAgLy8gYXV0byB4LXd3dy1mb3JtLXVybGVuY29kZWRcbiAqICAgICAgIHJlcXVlc3QucG9zdCgnL3VzZXInKVxuICogICAgICAgICAudHlwZSgnZm9ybScpXG4gKiAgICAgICAgIC5zZW5kKHsgbmFtZTogJ3RqJyB9KVxuICogICAgICAgICAuZW5kKGNhbGxiYWNrKVxuICpcbiAqICAgICAgIC8vIGRlZmF1bHRzIHRvIHgtd3d3LWZvcm0tdXJsZW5jb2RlZFxuICAqICAgICAgcmVxdWVzdC5wb3N0KCcvdXNlcicpXG4gICogICAgICAgIC5zZW5kKCduYW1lPXRvYmknKVxuICAqICAgICAgICAuc2VuZCgnc3BlY2llcz1mZXJyZXQnKVxuICAqICAgICAgICAuZW5kKGNhbGxiYWNrKVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdH0gZGF0YVxuICogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlcXVlc3QucHJvdG90eXBlLnNlbmQgPSBmdW5jdGlvbihkYXRhKXtcbiAgdmFyIG9iaiA9IGlzT2JqZWN0KGRhdGEpO1xuICB2YXIgdHlwZSA9IHRoaXMuZ2V0SGVhZGVyKCdDb250ZW50LVR5cGUnKTtcblxuICAvLyBtZXJnZVxuICBpZiAob2JqICYmIGlzT2JqZWN0KHRoaXMuX2RhdGEpKSB7XG4gICAgZm9yICh2YXIga2V5IGluIGRhdGEpIHtcbiAgICAgIHRoaXMuX2RhdGFba2V5XSA9IGRhdGFba2V5XTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoJ3N0cmluZycgPT0gdHlwZW9mIGRhdGEpIHtcbiAgICBpZiAoIXR5cGUpIHRoaXMudHlwZSgnZm9ybScpO1xuICAgIHR5cGUgPSB0aGlzLmdldEhlYWRlcignQ29udGVudC1UeXBlJyk7XG4gICAgaWYgKCdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnID09IHR5cGUpIHtcbiAgICAgIHRoaXMuX2RhdGEgPSB0aGlzLl9kYXRhXG4gICAgICAgID8gdGhpcy5fZGF0YSArICcmJyArIGRhdGFcbiAgICAgICAgOiBkYXRhO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9kYXRhID0gKHRoaXMuX2RhdGEgfHwgJycpICsgZGF0YTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5fZGF0YSA9IGRhdGE7XG4gIH1cblxuICBpZiAoIW9iaikgcmV0dXJuIHRoaXM7XG4gIGlmICghdHlwZSkgdGhpcy50eXBlKCdqc29uJyk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBJbnZva2UgdGhlIGNhbGxiYWNrIHdpdGggYGVycmAgYW5kIGByZXNgXG4gKiBhbmQgaGFuZGxlIGFyaXR5IGNoZWNrLlxuICpcbiAqIEBwYXJhbSB7RXJyb3J9IGVyclxuICogQHBhcmFtIHtSZXNwb25zZX0gcmVzXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS5jYWxsYmFjayA9IGZ1bmN0aW9uKGVyciwgcmVzKXtcbiAgdmFyIGZuID0gdGhpcy5fY2FsbGJhY2s7XG4gIGlmICgyID09IGZuLmxlbmd0aCkgcmV0dXJuIGZuKGVyciwgcmVzKTtcbiAgaWYgKGVycikgcmV0dXJuIHRoaXMuZW1pdCgnZXJyb3InLCBlcnIpO1xuICBmbihyZXMpO1xufTtcblxuLyoqXG4gKiBJbnZva2UgY2FsbGJhY2sgd2l0aCB4LWRvbWFpbiBlcnJvci5cbiAqXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS5jcm9zc0RvbWFpbkVycm9yID0gZnVuY3Rpb24oKXtcbiAgdmFyIGVyciA9IG5ldyBFcnJvcignT3JpZ2luIGlzIG5vdCBhbGxvd2VkIGJ5IEFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbicpO1xuICBlcnIuY3Jvc3NEb21haW4gPSB0cnVlO1xuICB0aGlzLmNhbGxiYWNrKGVycik7XG59O1xuXG4vKipcbiAqIEludm9rZSBjYWxsYmFjayB3aXRoIHRpbWVvdXQgZXJyb3IuXG4gKlxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuUmVxdWVzdC5wcm90b3R5cGUudGltZW91dEVycm9yID0gZnVuY3Rpb24oKXtcbiAgdmFyIHRpbWVvdXQgPSB0aGlzLl90aW1lb3V0O1xuICB2YXIgZXJyID0gbmV3IEVycm9yKCd0aW1lb3V0IG9mICcgKyB0aW1lb3V0ICsgJ21zIGV4Y2VlZGVkJyk7XG4gIGVyci50aW1lb3V0ID0gdGltZW91dDtcbiAgdGhpcy5jYWxsYmFjayhlcnIpO1xufTtcblxuLyoqXG4gKiBFbmFibGUgdHJhbnNtaXNzaW9uIG9mIGNvb2tpZXMgd2l0aCB4LWRvbWFpbiByZXF1ZXN0cy5cbiAqXG4gKiBOb3RlIHRoYXQgZm9yIHRoaXMgdG8gd29yayB0aGUgb3JpZ2luIG11c3Qgbm90IGJlXG4gKiB1c2luZyBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiIHdpdGggYSB3aWxkY2FyZCxcbiAqIGFuZCBhbHNvIG11c3Qgc2V0IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctQ3JlZGVudGlhbHNcIlxuICogdG8gXCJ0cnVlXCIuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5SZXF1ZXN0LnByb3RvdHlwZS53aXRoQ3JlZGVudGlhbHMgPSBmdW5jdGlvbigpe1xuICB0aGlzLl93aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogSW5pdGlhdGUgcmVxdWVzdCwgaW52b2tpbmcgY2FsbGJhY2sgYGZuKHJlcylgXG4gKiB3aXRoIGFuIGluc3RhbmNlb2YgYFJlc3BvbnNlYC5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7UmVxdWVzdH0gZm9yIGNoYWluaW5nXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cblJlcXVlc3QucHJvdG90eXBlLmVuZCA9IGZ1bmN0aW9uKGZuKXtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB2YXIgeGhyID0gdGhpcy54aHIgPSBnZXRYSFIoKTtcbiAgdmFyIHF1ZXJ5ID0gdGhpcy5fcXVlcnkuam9pbignJicpO1xuICB2YXIgdGltZW91dCA9IHRoaXMuX3RpbWVvdXQ7XG4gIHZhciBkYXRhID0gdGhpcy5fZm9ybURhdGEgfHwgdGhpcy5fZGF0YTtcblxuICAvLyBzdG9yZSBjYWxsYmFja1xuICB0aGlzLl9jYWxsYmFjayA9IGZuIHx8IG5vb3A7XG5cbiAgLy8gc3RhdGUgY2hhbmdlXG4gIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpe1xuICAgIGlmICg0ICE9IHhoci5yZWFkeVN0YXRlKSByZXR1cm47XG4gICAgaWYgKDAgPT0geGhyLnN0YXR1cykge1xuICAgICAgaWYgKHNlbGYuYWJvcnRlZCkgcmV0dXJuIHNlbGYudGltZW91dEVycm9yKCk7XG4gICAgICByZXR1cm4gc2VsZi5jcm9zc0RvbWFpbkVycm9yKCk7XG4gICAgfVxuICAgIHNlbGYuZW1pdCgnZW5kJyk7XG4gIH07XG5cbiAgLy8gcHJvZ3Jlc3NcbiAgaWYgKHhoci51cGxvYWQpIHtcbiAgICB4aHIudXBsb2FkLm9ucHJvZ3Jlc3MgPSBmdW5jdGlvbihlKXtcbiAgICAgIGUucGVyY2VudCA9IGUubG9hZGVkIC8gZS50b3RhbCAqIDEwMDtcbiAgICAgIHNlbGYuZW1pdCgncHJvZ3Jlc3MnLCBlKTtcbiAgICB9O1xuICB9XG5cbiAgLy8gdGltZW91dFxuICBpZiAodGltZW91dCAmJiAhdGhpcy5fdGltZXIpIHtcbiAgICB0aGlzLl90aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIHNlbGYuYWJvcnQoKTtcbiAgICB9LCB0aW1lb3V0KTtcbiAgfVxuXG4gIC8vIHF1ZXJ5c3RyaW5nXG4gIGlmIChxdWVyeSkge1xuICAgIHF1ZXJ5ID0gcmVxdWVzdC5zZXJpYWxpemVPYmplY3QocXVlcnkpO1xuICAgIHRoaXMudXJsICs9IH50aGlzLnVybC5pbmRleE9mKCc/JylcbiAgICAgID8gJyYnICsgcXVlcnlcbiAgICAgIDogJz8nICsgcXVlcnk7XG4gIH1cblxuICAvLyBpbml0aWF0ZSByZXF1ZXN0XG4gIHhoci5vcGVuKHRoaXMubWV0aG9kLCB0aGlzLnVybCwgdHJ1ZSk7XG5cbiAgLy8gQ09SU1xuICBpZiAodGhpcy5fd2l0aENyZWRlbnRpYWxzKSB4aHIud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcblxuICAvLyBib2R5XG4gIGlmICgnR0VUJyAhPSB0aGlzLm1ldGhvZCAmJiAnSEVBRCcgIT0gdGhpcy5tZXRob2QgJiYgJ3N0cmluZycgIT0gdHlwZW9mIGRhdGEgJiYgIWlzSG9zdChkYXRhKSkge1xuICAgIC8vIHNlcmlhbGl6ZSBzdHVmZlxuICAgIHZhciBzZXJpYWxpemUgPSByZXF1ZXN0LnNlcmlhbGl6ZVt0aGlzLmdldEhlYWRlcignQ29udGVudC1UeXBlJyldO1xuICAgIGlmIChzZXJpYWxpemUpIGRhdGEgPSBzZXJpYWxpemUoZGF0YSk7XG4gIH1cblxuICAvLyBzZXQgaGVhZGVyIGZpZWxkc1xuICBmb3IgKHZhciBmaWVsZCBpbiB0aGlzLmhlYWRlcikge1xuICAgIGlmIChudWxsID09IHRoaXMuaGVhZGVyW2ZpZWxkXSkgY29udGludWU7XG4gICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoZmllbGQsIHRoaXMuaGVhZGVyW2ZpZWxkXSk7XG4gIH1cblxuICAvLyBzZW5kIHN0dWZmXG4gIHRoaXMuZW1pdCgncmVxdWVzdCcsIHRoaXMpO1xuICB4aHIuc2VuZChkYXRhKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEV4cG9zZSBgUmVxdWVzdGAuXG4gKi9cblxucmVxdWVzdC5SZXF1ZXN0ID0gUmVxdWVzdDtcblxuLyoqXG4gKiBJc3N1ZSBhIHJlcXVlc3Q6XG4gKlxuICogRXhhbXBsZXM6XG4gKlxuICogICAgcmVxdWVzdCgnR0VUJywgJy91c2VycycpLmVuZChjYWxsYmFjaylcbiAqICAgIHJlcXVlc3QoJy91c2VycycpLmVuZChjYWxsYmFjaylcbiAqICAgIHJlcXVlc3QoJy91c2VycycsIGNhbGxiYWNrKVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBtZXRob2RcbiAqIEBwYXJhbSB7U3RyaW5nfEZ1bmN0aW9ufSB1cmwgb3IgY2FsbGJhY2tcbiAqIEByZXR1cm4ge1JlcXVlc3R9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIHJlcXVlc3QobWV0aG9kLCB1cmwpIHtcbiAgLy8gY2FsbGJhY2tcbiAgaWYgKCdmdW5jdGlvbicgPT0gdHlwZW9mIHVybCkge1xuICAgIHJldHVybiBuZXcgUmVxdWVzdCgnR0VUJywgbWV0aG9kKS5lbmQodXJsKTtcbiAgfVxuXG4gIC8vIHVybCBmaXJzdFxuICBpZiAoMSA9PSBhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIG5ldyBSZXF1ZXN0KCdHRVQnLCBtZXRob2QpO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBSZXF1ZXN0KG1ldGhvZCwgdXJsKTtcbn1cblxuLyoqXG4gKiBHRVQgYHVybGAgd2l0aCBvcHRpb25hbCBjYWxsYmFjayBgZm4ocmVzKWAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHVybFxuICogQHBhcmFtIHtNaXhlZHxGdW5jdGlvbn0gZGF0YSBvciBmblxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge1JlcXVlc3R9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbnJlcXVlc3QuZ2V0ID0gZnVuY3Rpb24odXJsLCBkYXRhLCBmbil7XG4gIHZhciByZXEgPSByZXF1ZXN0KCdHRVQnLCB1cmwpO1xuICBpZiAoJ2Z1bmN0aW9uJyA9PSB0eXBlb2YgZGF0YSkgZm4gPSBkYXRhLCBkYXRhID0gbnVsbDtcbiAgaWYgKGRhdGEpIHJlcS5xdWVyeShkYXRhKTtcbiAgaWYgKGZuKSByZXEuZW5kKGZuKTtcbiAgcmV0dXJuIHJlcTtcbn07XG5cbi8qKlxuICogSEVBRCBgdXJsYCB3aXRoIG9wdGlvbmFsIGNhbGxiYWNrIGBmbihyZXMpYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsXG4gKiBAcGFyYW0ge01peGVkfEZ1bmN0aW9ufSBkYXRhIG9yIGZuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7UmVxdWVzdH1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxucmVxdWVzdC5oZWFkID0gZnVuY3Rpb24odXJsLCBkYXRhLCBmbil7XG4gIHZhciByZXEgPSByZXF1ZXN0KCdIRUFEJywgdXJsKTtcbiAgaWYgKCdmdW5jdGlvbicgPT0gdHlwZW9mIGRhdGEpIGZuID0gZGF0YSwgZGF0YSA9IG51bGw7XG4gIGlmIChkYXRhKSByZXEuc2VuZChkYXRhKTtcbiAgaWYgKGZuKSByZXEuZW5kKGZuKTtcbiAgcmV0dXJuIHJlcTtcbn07XG5cbi8qKlxuICogREVMRVRFIGB1cmxgIHdpdGggb3B0aW9uYWwgY2FsbGJhY2sgYGZuKHJlcylgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmxcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5yZXF1ZXN0LmRlbCA9IGZ1bmN0aW9uKHVybCwgZm4pe1xuICB2YXIgcmVxID0gcmVxdWVzdCgnREVMRVRFJywgdXJsKTtcbiAgaWYgKGZuKSByZXEuZW5kKGZuKTtcbiAgcmV0dXJuIHJlcTtcbn07XG5cbi8qKlxuICogUEFUQ0ggYHVybGAgd2l0aCBvcHRpb25hbCBgZGF0YWAgYW5kIGNhbGxiYWNrIGBmbihyZXMpYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsXG4gKiBAcGFyYW0ge01peGVkfSBkYXRhXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7UmVxdWVzdH1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxucmVxdWVzdC5wYXRjaCA9IGZ1bmN0aW9uKHVybCwgZGF0YSwgZm4pe1xuICB2YXIgcmVxID0gcmVxdWVzdCgnUEFUQ0gnLCB1cmwpO1xuICBpZiAoJ2Z1bmN0aW9uJyA9PSB0eXBlb2YgZGF0YSkgZm4gPSBkYXRhLCBkYXRhID0gbnVsbDtcbiAgaWYgKGRhdGEpIHJlcS5zZW5kKGRhdGEpO1xuICBpZiAoZm4pIHJlcS5lbmQoZm4pO1xuICByZXR1cm4gcmVxO1xufTtcblxuLyoqXG4gKiBQT1NUIGB1cmxgIHdpdGggb3B0aW9uYWwgYGRhdGFgIGFuZCBjYWxsYmFjayBgZm4ocmVzKWAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHVybFxuICogQHBhcmFtIHtNaXhlZH0gZGF0YVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge1JlcXVlc3R9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbnJlcXVlc3QucG9zdCA9IGZ1bmN0aW9uKHVybCwgZGF0YSwgZm4pe1xuICB2YXIgcmVxID0gcmVxdWVzdCgnUE9TVCcsIHVybCk7XG4gIGlmICgnZnVuY3Rpb24nID09IHR5cGVvZiBkYXRhKSBmbiA9IGRhdGEsIGRhdGEgPSBudWxsO1xuICBpZiAoZGF0YSkgcmVxLnNlbmQoZGF0YSk7XG4gIGlmIChmbikgcmVxLmVuZChmbik7XG4gIHJldHVybiByZXE7XG59O1xuXG4vKipcbiAqIFBVVCBgdXJsYCB3aXRoIG9wdGlvbmFsIGBkYXRhYCBhbmQgY2FsbGJhY2sgYGZuKHJlcylgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmxcbiAqIEBwYXJhbSB7TWl4ZWR8RnVuY3Rpb259IGRhdGEgb3IgZm5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtSZXF1ZXN0fVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5yZXF1ZXN0LnB1dCA9IGZ1bmN0aW9uKHVybCwgZGF0YSwgZm4pe1xuICB2YXIgcmVxID0gcmVxdWVzdCgnUFVUJywgdXJsKTtcbiAgaWYgKCdmdW5jdGlvbicgPT0gdHlwZW9mIGRhdGEpIGZuID0gZGF0YSwgZGF0YSA9IG51bGw7XG4gIGlmIChkYXRhKSByZXEuc2VuZChkYXRhKTtcbiAgaWYgKGZuKSByZXEuZW5kKGZuKTtcbiAgcmV0dXJuIHJlcTtcbn07XG5cbi8qKlxuICogRXhwb3NlIGByZXF1ZXN0YC5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVlc3Q7XG4iLCJcbi8qKlxuICogRXhwb3NlIGBFbWl0dGVyYC5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVtaXR0ZXI7XG5cbi8qKlxuICogSW5pdGlhbGl6ZSBhIG5ldyBgRW1pdHRlcmAuXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiBFbWl0dGVyKG9iaikge1xuICBpZiAob2JqKSByZXR1cm4gbWl4aW4ob2JqKTtcbn07XG5cbi8qKlxuICogTWl4aW4gdGhlIGVtaXR0ZXIgcHJvcGVydGllcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5mdW5jdGlvbiBtaXhpbihvYmopIHtcbiAgZm9yICh2YXIga2V5IGluIEVtaXR0ZXIucHJvdG90eXBlKSB7XG4gICAgb2JqW2tleV0gPSBFbWl0dGVyLnByb3RvdHlwZVtrZXldO1xuICB9XG4gIHJldHVybiBvYmo7XG59XG5cbi8qKlxuICogTGlzdGVuIG9uIHRoZSBnaXZlbiBgZXZlbnRgIHdpdGggYGZuYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtFbWl0dGVyfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5vbiA9XG5FbWl0dGVyLnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyID0gZnVuY3Rpb24oZXZlbnQsIGZuKXtcbiAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzIHx8IHt9O1xuICAodGhpcy5fY2FsbGJhY2tzW2V2ZW50XSA9IHRoaXMuX2NhbGxiYWNrc1tldmVudF0gfHwgW10pXG4gICAgLnB1c2goZm4pO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWRkcyBhbiBgZXZlbnRgIGxpc3RlbmVyIHRoYXQgd2lsbCBiZSBpbnZva2VkIGEgc2luZ2xlXG4gKiB0aW1lIHRoZW4gYXV0b21hdGljYWxseSByZW1vdmVkLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbihldmVudCwgZm4pe1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcblxuICBmdW5jdGlvbiBvbigpIHtcbiAgICBzZWxmLm9mZihldmVudCwgb24pO1xuICAgIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICBvbi5mbiA9IGZuO1xuICB0aGlzLm9uKGV2ZW50LCBvbik7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZW1vdmUgdGhlIGdpdmVuIGNhbGxiYWNrIGZvciBgZXZlbnRgIG9yIGFsbFxuICogcmVnaXN0ZXJlZCBjYWxsYmFja3MuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7RW1pdHRlcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUub2ZmID1cbkVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID1cbkVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9XG5FbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyID0gZnVuY3Rpb24oZXZlbnQsIGZuKXtcbiAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzIHx8IHt9O1xuXG4gIC8vIGFsbFxuICBpZiAoMCA9PSBhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgdGhpcy5fY2FsbGJhY2tzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBzcGVjaWZpYyBldmVudFxuICB2YXIgY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzW2V2ZW50XTtcbiAgaWYgKCFjYWxsYmFja3MpIHJldHVybiB0aGlzO1xuXG4gIC8vIHJlbW92ZSBhbGwgaGFuZGxlcnNcbiAgaWYgKDEgPT0gYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIGRlbGV0ZSB0aGlzLl9jYWxsYmFja3NbZXZlbnRdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gcmVtb3ZlIHNwZWNpZmljIGhhbmRsZXJcbiAgdmFyIGNiO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgIGNiID0gY2FsbGJhY2tzW2ldO1xuICAgIGlmIChjYiA9PT0gZm4gfHwgY2IuZm4gPT09IGZuKSB7XG4gICAgICBjYWxsYmFja3Muc3BsaWNlKGksIDEpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBFbWl0IGBldmVudGAgd2l0aCB0aGUgZ2l2ZW4gYXJncy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEBwYXJhbSB7TWl4ZWR9IC4uLlxuICogQHJldHVybiB7RW1pdHRlcn1cbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24oZXZlbnQpe1xuICB0aGlzLl9jYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3MgfHwge307XG4gIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpXG4gICAgLCBjYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3NbZXZlbnRdO1xuXG4gIGlmIChjYWxsYmFja3MpIHtcbiAgICBjYWxsYmFja3MgPSBjYWxsYmFja3Muc2xpY2UoMCk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGNhbGxiYWNrcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAgY2FsbGJhY2tzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gYXJyYXkgb2YgY2FsbGJhY2tzIGZvciBgZXZlbnRgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHJldHVybiB7QXJyYXl9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzIHx8IHt9O1xuICByZXR1cm4gdGhpcy5fY2FsbGJhY2tzW2V2ZW50XSB8fCBbXTtcbn07XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhpcyBlbWl0dGVyIGhhcyBgZXZlbnRgIGhhbmRsZXJzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUuaGFzTGlzdGVuZXJzID0gZnVuY3Rpb24oZXZlbnQpe1xuICByZXR1cm4gISEgdGhpcy5saXN0ZW5lcnMoZXZlbnQpLmxlbmd0aDtcbn07XG4iLCJcbi8qKlxuICogUmVkdWNlIGBhcnJgIHdpdGggYGZuYC5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcGFyYW0ge01peGVkfSBpbml0aWFsXG4gKlxuICogVE9ETzogY29tYmF0aWJsZSBlcnJvciBoYW5kbGluZz9cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGFyciwgZm4sIGluaXRpYWwpeyAgXG4gIHZhciBpZHggPSAwO1xuICB2YXIgbGVuID0gYXJyLmxlbmd0aDtcbiAgdmFyIGN1cnIgPSBhcmd1bWVudHMubGVuZ3RoID09IDNcbiAgICA/IGluaXRpYWxcbiAgICA6IGFycltpZHgrK107XG5cbiAgd2hpbGUgKGlkeCA8IGxlbikge1xuICAgIGN1cnIgPSBmbi5jYWxsKG51bGwsIGN1cnIsIGFycltpZHhdLCArK2lkeCwgYXJyKTtcbiAgfVxuICBcbiAgcmV0dXJuIGN1cnI7XG59OyIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBfV1BDT00gPSByZXF1aXJlKCcuL2luZGV4LmpzJyk7XG52YXIgcmVxdWVzdCA9IHJlcXVpcmUoJ3dwY29tLXhoci1yZXF1ZXN0Jyk7XG52YXIgaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuXG4vKipcbiAqIE1vZHVsZSBleHBvcnRzLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gV1BDT007XG5cbi8qKlxuICogV29yZFByZXNzLmNvbSBSRVNUIEFQSSBjbGFzcy5cbiAqXG4gKiBYTUxIdHRwUmVxdWVzdCAoYW5kIENPUlMpIEFQSSBhY2Nlc3MgbWV0aG9kLlxuICogQVBJIGF1dGhlbnRpY2F0aW9uIGlzIGRvbmUgdmlhIGFuIChvcHRpb25hbCkgYWNjZXNzIGB0b2tlbmAsXG4gKiB3aGljaCBuZWVkcyB0byBiZSByZXRyaWV2ZWQgdmlhIE9BdXRoIChzZWUgYHdwY29tLW9hdXRoYCBvbiBucG0pLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB0b2tlbiAob3B0aW9uYWwpIE9BdXRoIEFQSSBhY2Nlc3MgdG9rZW5cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuZnVuY3Rpb24gV1BDT00gKHRva2VuKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBXUENPTSkpIHJldHVybiBuZXcgV1BDT00odG9rZW4pO1xuICBfV1BDT00uY2FsbCh0aGlzLCByZXF1ZXN0KTtcbiAgdGhpcy50b2tlbiA9IHRva2VuO1xufVxuXG5pbmhlcml0cyhXUENPTSwgX1dQQ09NKTtcblxuLyoqXG4gKiBTZXQgYWNjZXNzIHRva2VuLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB0b2tlbiAtIEFQSSB0b2tlbiB0byB1c2UgZm9yIHJlcXVlc3RzXG4gKiBAcHVibGljXG4gKi9cblxuV1BDT00ucHJvdG90eXBlLnNldFRva2VuID0gZnVuY3Rpb24gKHRva2VuKSB7XG4gIHRoaXMudG9rZW4gPSB0b2tlbjtcbn07XG5cbi8qKlxuICogT3ZlcndyaXRlIHRoZSBwYXJlbnQgYHNlbmRSZXF1ZXN0KClgIGZ1bmN0aW9uIHNvIHRoYXQgd2UgY2FuXG4gKiBhZGQgdGhlIGBhdXRoVG9rZW5gIHRvIGV2ZXJ5IEFQSSByZXF1ZXN0IGlmIGl0J3MgcHJlc2VudC5cbiAqXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5XUENPTS5wcm90b3R5cGUuc2VuZFJlcXVlc3QgPSBmdW5jdGlvbiAocGFyYW1zLCBxdWVyeSwgYm9keSwgZm4pe1xuICBpZiAoJ3N0cmluZycgPT0gdHlwZW9mIHBhcmFtcykgcGFyYW1zID0geyBwYXRoOiBwYXJhbXMgfTtcblxuICAvLyB0b2tlblxuICB2YXIgdG9rZW4gPSBwYXJhbXMudG9rZW4gfHwgdGhpcy50b2tlbjtcbiAgaWYgKHRva2VuKSBwYXJhbXMuYXV0aFRva2VuID0gdG9rZW47XG5cbiAgcmV0dXJuIF9XUENPTS5wcm90b3R5cGUuc2VuZFJlcXVlc3QuY2FsbCh0aGlzLCBwYXJhbXMsIHF1ZXJ5LCBib2R5LCBmbik7XG59O1xuIl19
