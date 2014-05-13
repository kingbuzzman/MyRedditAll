define [
  'collections/subreddit'
], (SubReddit) ->
  window.SubReddit = new SubReddit('pics')
  window.SubReddit.fetch()
  return