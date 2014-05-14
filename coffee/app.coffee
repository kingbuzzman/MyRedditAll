define [
  'jquery'
  'views/carousel'
  'views/navigation'
  'views/subreddit'
], ($, CarouselView, NavigationView, SubRedditView) ->
  c = new CarouselView('pics')
  $('header').append c.render().el

  n = new NavigationView()
  n.setCarousel c
  $('nav').append n.render().el

  dude = new SubRedditView('python')
  $('main').append dude.render().el

  dude = new SubRedditView('politics')
  $('main').append dude.render().el

  dude = new SubRedditView('funny')
  $('main').append dude.render().el
  return