define [
  'backbone'
  'jquery'
  'models/subreddit'
], (Backbone, $, SubRedditModel) ->
  CUTOFF_TIME = 2 * 60 * 1000 # stale data refresh (2 minutes)

  class SubRedditCollection extends Backbone.Collection
    model: SubRedditModel
    limit: 10

    constructor: (name) ->
      @name = name
      @after = null
      @after_time = null

      super null, {}
      return

    setName: (name) ->
      @name = name
      @after = null
      return

    url: () ->
      url = "http://www.reddit.com/r/#{@name}.json?limit=#{@limit}"
      if @after
        url += "&after=#{@after or ''}"
      return url

    fetch: (options={}) ->
      current_time = new Date()
      reload = false
      if (current_time - @after_time) > CUTOFF_TIME
        @after = null
        options.remove = true
        reload = true

      request = super options
      request.success () =>
        @after_time = new Date()
        if reload
          @trigger 'reload', @
        return

      return request

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
