
// get token and blog ig from body attribute
var token = document.body.dataset.token;
var blog_id = document.body.dataset.id;

// Create wpcom instance
var wpcom = WPCOM(token);

// get posts list
wpcom
.site(blog_id)
.postsList(function(err, data){
  if (err) {
    return console.error(err);
  }

  var markup = '<ul>';
  for (var i = 0; i < data.posts.length; i++) {
    var p = data.posts[i];
    console.log('-> p -> ', p);

    markup += '<li>';
    markup += '<h3>' + p.title + '</h3>';
    markup += '<p>' + p.excerpt + '</p>';


    markup += '<ul>';
    markup += '<li>Comments: ';
    markup += '<span id="post-comments-count">' + p.comment_count + '</span>';
    markup += '</li>';

    markup += '<li>Views: ';
    markup += '<span id="post-views-count">-</span>';
    markup += '</li>';

    markup += '</ul>';

    markup += '</li>';
  }

  markup += '</ul>';

  var postsContainer = document.getElementById('posts-list');
  postsContainer.innerHTML = markup;
});