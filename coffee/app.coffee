define [
  'jquery'
  'views/subreddit'
], ($, SubRedditView) ->
  dude = new SubRedditView('pics')
  $('main').append dude.render().el

  dude = new SubRedditView('politics')
  $('main').append dude.render().el

  dude = new SubRedditView('funny')
  $('main').append dude.render().el
  return