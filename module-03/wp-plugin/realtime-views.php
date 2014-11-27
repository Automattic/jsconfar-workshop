<?php
/**
 * Plugin Name: Realtime Views
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

  public function when_post_possibly_viewed() {
    if ( is_singular() ) {
      $id = get_the_ID();

      $meta = get_post_meta($id, 'real_time_views');
      $count = !empty($meta) ? (int) $meta[0] : 0;
      $count++;

      update_post_meta($id, 'real_time_views', $count);
      $this->emitter->emit('post view', array('id' => $id, 'count' => $count));
    }
  }
}

$connection = new SocketConnection();
add_action('publish_post', array($connection, 'when_post_published'), 10, 2);
add_action('wp_insert_comment', array($connection, 'when_post_commented'), 10, 2);
add_action('template_redirect', array($connection, 'when_post_possibly_viewed'), 10, 0);

?>

