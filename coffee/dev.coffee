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

require ['app']