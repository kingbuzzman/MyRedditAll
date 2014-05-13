define [
  'backbone'
  'underscore'
  'text!includes/item.html'
], (Backbone, _, template, SubRedditCollection) ->
  class SubRedditItemView extends Backbone.View
    template: _.template(template)
    tagName: 'li'

    initialize: (model) ->
      @model = model
      return

    render: () ->
      data = @model.attributes
      @$el.append @template(data)
      return @
    