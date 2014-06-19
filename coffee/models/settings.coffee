define [
  'backbone'
  'underscore'
  'jquery'
  'cookie'
], (Backbone, _, $) ->
  class Settings extends Backbone.Model
    COOKIE_NAME = 'settings'
    DEFAULT_VALUES =
      imagebar: ['Pics', 'WTF', 'NSFW', 'Funny']
      subreddits: ['Gadgets', 'Funny', 'Reddit.com', 'Javascript', 'WTF', 'Programming', 'Python']

    fetch: () ->
      data = JSON.parse($.cookie(COOKIE_NAME) or "{}")
      @set _.extend data, _.clone(DEFAULT_VALUES)
      @trigger 'sync', @
      return

    save: () ->
      data = JSON.stringify @attributes
      $.cookie COOKIE_NAME, data
      return

  settings = new Settings()

  settings.fetch()
  settings.save()

  return settings
