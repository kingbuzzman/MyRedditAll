define [
  'backbone'
  'jquery'
  'models/subreddit'
], (Backbone, $, SubRedditModel) ->
  class SubRedditCollection extends Backbone.Collection
    model: SubRedditModel
    limit: 10

    constructor: (name) ->
      @name = name
      @after = null

      super null, {}
      return

    url: () ->
      url = "http://www.reddit.com/r/#{@name}.json?limit=#{@limit-1}"
      if @after
        url += "&after=#{@after or ''}"
      return url

    sync: (method, model, options) ->
      options = _.extend
        type: 'GET'
        dataType: 'json'
      , options

      return super method, model, options

    parse: (resp, options) ->
      if @after isnt resp.data.after
        @after = resp.data.after
        @trigger 'change:after', @after, @
      return resp.data.children
