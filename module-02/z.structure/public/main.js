
// post comment element
var postComment = document.getElementById('post-comment');

// get token and blog ig from body attribute
var token = document.body.dataset.token;
var blog_id = document.body.dataset.id;

// Create wpcom instance
var wpcom = WPCOM(token);

// site instance
var site = wpcom.site(blog_id);

// get posts list
site.postsList(function(err, data){
  if (err) {
    return console.error(err);
  }

  var markup = '<ul>';
  for (var i = 0; i < data.posts.length; i++) {
    var p = data.posts[i];

    markup += '<li id="post-' + p.ID + '">';
    markup += '<h3><a href="#" onclick="loadPost(' + p.ID + ');">' + p.title + '</a></h3>';
    markup += '<p>' + p.excerpt + '</p>';


    markup += '<ul>';
    markup += '<li>Comments: ';
    markup += '<span id="post-comments-count">' + p.comment_count + '</span>';
    markup += '</li>';

    markup += '<li>Views: ';
    markup += '<span id="post-views-count">-</span>';
    markup += '</li>';

    markup += '<li>';
    markup += '<a href="#" onclick="addComment(' + p.ID + ');">Add comment</a>';
    markup += '</li>';

    markup += '</ul>';

    markup += '</li>';
  }

  markup += '</ul>';

  var postsContainer = document.getElementById('posts-list');
  postsContainer.innerHTML = markup;
});

/**
 * Add a comment to given post
 *
 * @api private
 */

function addComment(post_id){
  var el = document.getElementById('post-' + post_id);
  el.appendChild(postComment);
  postComment.style.display = 'block';

  // focus
  postComment.children[0].children[0].focus();
}

/**
 * Bind `submit` event
 *
 * @api private
 */

postComment.addEventListener('submit', function(e){
  e.preventDefault();
  var text = e.target.children[0].value;
  var post_id = this.parentElement.getAttribute('id').substr(5);

  postComment.style.display = 'none';
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

/**
 * Load post using given post ID
 *
 * @param {String} post_id
 * @api private
 */

function loadPost(post_id){
  site
  .post(post_id)
  .get(function(err, post){
    console.log('-> post -> ', post);
  });
}
