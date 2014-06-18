requirejs.config
  baseUrl: 'js'

  paths:
    backbone: '/bower_components/backbone/backbone'
    underscore: '/bower_components/lodash/dist/lodash'
    jquery: '/bower_components/jquery/dist/jquery'
    text: '/bower_components/requirejs-text/text'

    includes: '/includes'

    shim:
      'backbone':
        deps: ['underscore', 'jquery']
        exports: 'Backbone'

      'underscore':
        exports: '_'

# # debug, logs all events from the app
# require ['backbone'], (Backbone) ->
#   trigger = (event) ->
#     console.log arguments
#     return Backbone.Events.trigger.apply @, arguments
#
#   Backbone.Model.prototype.trigger = trigger
#   Backbone.Collection.prototype.trigger = trigger
#   Backbone.View.prototype.trigger = trigger
#   Backbone.View.prototype.trigger = trigger
#   Backbone.Router.prototype.trigger = trigger
#   Backbone.History.prototype.trigger = trigger
#
#   return

# start app
require ['app']
