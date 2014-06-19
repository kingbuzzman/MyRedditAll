define [
  'backbone'
  'underscore'
  'collections/subreddit'
  'text!includes/subreddit.html'
  'text!includes/subreddit_item.html'
], (Backbone, _, SubRedditCollection, templateView, templateItem) ->
  class SubRedditView extends Backbone.View
    template: _.template(templateView)
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

    removeItems: () ->
      for item in @items
        item.remove()
      @items = []
      return

    renderItems: () ->
      list = @$('ul')
      @removeItems()

      for model in @collection.models
        item = new SubRedditItemView(model)
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
      @collection.fetch remove: false
      return

    updateAfter: (event, after) ->
      @$('footer a').attr 'href', @collection.url()
      return


  class SubRedditItemView extends Backbone.View
    template: _.template(templateItem)
    tagName: 'li'

    initialize: (model) ->
      @model = model
      return

    render: () ->
      data = @model.attributes
      @$el.append @template(data)
      return @


  return SubRedditView
