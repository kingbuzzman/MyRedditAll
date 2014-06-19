define [
  'backbone'
  'underscore'
], (Backbone, _) ->
  class SubRedditModel extends Backbone.Model
    parse: (resp, options) ->
      data = resp.data
      data.permalink = 'http://www.reddit.com' + data.permalink
      if data.ups == 0 and data.downs == 0
        data.score = '100%'
      else
        data.score = parseInt((data.ups / (data.downs + data.ups)) * 100, 10) + '%'
      data.scoreTitle = data.score + ' of People Like It'
      return data

    destroy: (options) ->
      @trigger('destroy', @, @collection, options);
      return
