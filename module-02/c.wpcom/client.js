
/**
 * JSCONFAR application
 */

var WPCOM = require('wpcom');
var empty = require('component-empty');
var domify = require('domify');
var query = require('component-query');
var domready = require('domready');
var request = require('superagent');

/**
 * pseudo global vars
 */

var wpcom, site;


domready(function(){
  // Start getting token
  request
  .get('/token')
  .end(function(res){
    if (!res.ok) {
      return console.error(res.text);
    }

    ready(res.body);
  });

  /**
   * Form element
   */
  var form = query('#post-comment', document.body);

  /**
   * Ready to start app
   */

  function ready(access){
    wpcom = WPCOM(access.token);
    site = wpcom.site(access.blog_id);

    renderPosts(site);
  }

  function renderPosts(site){
    // get posts list
    site.postsList(function(err, data){
      if (err) {
        return console.error(err);
      }

      var markup = '<ul id="posts">';
      for (var i = 0; i < data.posts.length; i++) {
        var p = data.posts[i];

        markup += '<li id="post-' + p.ID + '">';
        markup += '<div class="general">';
        markup += '<h3>' + p.title + '</h3>';
        markup += '<p>' + p.excerpt + '</p>';
        markup += '</div>';


        markup += '<ul>';
        markup += '<li>Comments: ';
        markup += '<span class="post-comments-count">' + p.comment_count + '</span>';
        markup += '</li>';

        markup += '<li>Views: ';
        markup += '<span class="post-views-count">-</span>';
        markup += '</li>';

        markup += '<li>';
        markup += '<a href="#" class="add-comment">Add comment</a>';
        markup += '</li>';

        markup += '</ul>';

        markup += '</li>';
      }

      markup += '</ul>';

      var postsContainer = query('.posts-list', document.body);
      empty(postsContainer);
      postsContainer.appendChild(domify(markup));

      setEvents(postsContainer);
    });
  }

  function setEvents(posts){
    var links = query.all('a.add-comment',posts);
    for (var i = 0; i < links.length; i++) {
      var l = links[i];
      l.addEventListener('click', addComment);
    }
  }

  /**
   * Add a comment to given post
   *
   * @param {Object} ev
   * @api private
   */

  function addComment(ev){
    var ref = this.parentNode.parentNode.parentNode;
    ref.appendChild(form);

    form.style.display = 'block';

    // focus
    query('textarea', form).focus();
  }

  /**
   * Bind `submit` event
   *
   * @api private
   */

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var text = query('textarea', form).value;
    var post_id = this.parentElement.getAttribute('id').substr(5);

    e.target.children[0].value = '';

    site
    .post(post_id)
    .comment()
    .add(text, function(err, data){
      if (err) {
        return console.error(err);
      }
    });
  });

});
