define [
  'backbone'
  'underscore'
  'views/item'
  'text!includes/subreddit.html'
  'collections/subreddit'
], (Backbone, _, Item, template, SubRedditCollection) ->
  class SubRedditView extends Backbone.View
    template: _.template(template)
    tagName: 'article'

    events:
      'click footer a': 'loadMore'

    initialize: (name) ->
      @items = []
      @collection = new SubRedditCollection(name)
      @listenTo @collection, 'sync', @renderItems
      @listenTo @collection, 'change:after', @updateAfter
      @collection.fetch()
      return

    renderItems: () ->
      list = @$('ul')

      for model in @collection.models
        item = new Item(model)
        list.append item.render().el
        @items.push item

      return

    render: () ->
      @$el.append @template(
        name: @collection.name
        url: @collection.url()
      )
      return @

    loadMore: (event) ->
      event.preventDefault()
      @collection.fetch()
      return

    updateAfter: (event, after) ->
      @$('footer a').attr 'href', @collection.url()
      return