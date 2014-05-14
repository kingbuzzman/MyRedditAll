define [
  'backbone'
  'underscore'
  'text!includes/navigation_item.html'
], (Backbone, _, templateItem) ->
  class NavigationView extends Backbone.View
    tagName: 'ul'

    initialize: () ->
      @items = ['pics', 'funny', 'wtf']
      @carousel = null
      return

    setCarousel: (carousel) ->
      @carousel = carousel
      return

    render: () ->
      template = _.template templateItem
      for item in @items
        @$el.append template({ name: item })
      return @
