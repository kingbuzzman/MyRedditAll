define [
  'underscore'
  'backbone'
  'collections/image'
  'text!includes/carousel_item.html'
], (_, Backbone, ImageCollection, templateItem) ->
  class CarouselView extends Backbone.View
    tagName: 'ul'

    initialize: (subreddit) ->
      @items = []
      @collection = new ImageCollection(subreddit)
      @listenTo @collection, 'sync', @renderItems
      @listenTo @collection, 'add', @addItem
      @listenTo @collection, 'destroy', @removeItem
      @collection.fetch(silent: true)
      return

    render: () ->
      return @

    removeItem: (model) ->
      items = []
      for item in @items
        if _.isEmpty model or item.model.cid == model.cid
          item.remove()
          continue
        items.push item
      @items = items
      return

    addItem: (model) ->
      item = new CarouselItem(model)
      @items.push item
      @$el.append item.render().el
      return

    renderItems: () ->
      @removeItem()
      for model in @collection.models
        @addItem model
      return


  class CarouselItem extends Backbone.View
    template: _.template templateItem
    tagName: 'li'

    initialize: (model) ->
      @model = model
      return

    render: () ->
      @$el.append @template(@model.attributes)
      @$('img').on 'load', (event) =>
        el = event.target
        if el.height != el.width
          @model.destroy()
        return
      return @

  return CarouselView
