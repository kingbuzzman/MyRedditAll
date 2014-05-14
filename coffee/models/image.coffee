define [
  'models/subreddit'
], (SubRedditModel) ->
  class ImageModel extends SubRedditModel
    parse: (resp, options) ->
      data = resp.data
      data.permalink = 'http://www.reddit.com' + data.permalink
      data.score = parseInt((data.ups / (data.downs + data.ups)) * 100, 10) + '%'
      data.scoreTitle = data.score + ' of People Like It'
      return data