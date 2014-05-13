define [
  'backbone'
  'jquery'
  'models/subreddit'
], (Backbone, $, SubRedditModel) ->
  class SubReddit extends Backbone.Collection
    model: SubRedditModel

    constructor: (subreddit) ->
      @subreddit = subreddit
      @last = null

      super null, {}
      return

    url: () ->
      return "http://www.reddit.com/r/#{@subreddit}.json"

    sync: (method, model, options) ->
      options = _.extend
        type: 'GET'
        dataType: 'json'
        data:
          limit: 10
          after: @last or ''
      , options

      return super method, model, options

    parse: (resp, options) ->
      @last = resp.data.after
      return resp.data.children
