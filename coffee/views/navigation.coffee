define [
  'backbone'
  'underscore'
  'models/settings'
  'text!includes/navigation_item.html'
], (Backbone, _, settings, templateItem) ->
  class NavigationView extends Backbone.View
    tagName: 'ul'

    events:
      'click li': 'loadCarousel'

    initialize: () ->
      @carousel = null
      return

    setCarousel: (carousel) ->
      @carousel = carousel
      return

    loadCarousel: (event) ->
      event.preventDefault()
      @carousel.setSubreddit Backbone.$(event.currentTarget).text().trim()
      return false

    render: () ->
      template = _.template templateItem
      for item in settings.get 'imagebar'
        @$el.append template({ name: item })
      return @
