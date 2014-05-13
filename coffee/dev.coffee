requirejs.config
  baseUrl: 'js'

  paths:
    backbone: '/bower_components/backbone/backbone'
    underscore: '/bower_components/lodash/dist/lodash'
    jquery: '/bower_components/jquery/dist/jquery'

    shim:
      'backbone':
        deps: ['underscore', 'jquery']
        exports: 'Backbone'

      'underscore':
        exports: '_'

require ['app']