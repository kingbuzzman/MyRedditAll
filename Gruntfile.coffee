module.exports = (grunt) ->
  grunt.loadNpmTasks 'grunt-haml'
  grunt.loadNpmTasks 'grunt-sass'
  grunt.loadNpmTasks 'grunt-localhosts'
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-connect'
  grunt.loadNpmTasks 'grunt-contrib-watch'

  grunt.initConfig
    pkg: require './package.json'

    haml:
      options:
        language: 'coffee'
        uglify: false
      haml:
        files: grunt.file.expandMapping([
            'haml/*.haml'
            'haml/includes/*.haml'
          ],
          '.html/',
          rename: (base, path) ->
            return base + path.replace(/haml\//, '').replace(/\.haml$/, '')
        )

    sass:
      sass:
        options:
          outputStyle: 'nested'
        files:
          '.css/main.css': 'scss/main.scss'

    coffee:
      options:
        sourceMap: false
        bare: true
      coffee:
        expand: true
        flatten: true
        cwd: './coffee/'
        src: ['*.coffee']
        dest: '.js/'
        ext: '.js'
      collections:
        expand: true
        flatten: true
        cwd: './coffee/collections'
        src: ['*.coffee']
        dest: '.js/collections'
        ext: '.js'
      views:
        expand: true
        flatten: true
        cwd: './coffee/views'
        src: ['*.coffee']
        dest: '.js/views'
        ext: '.js'
      models:
        expand: true
        flatten: true
        cwd: './coffee/models'
        src: ['*.coffee']
        dest: '.js/models'
        ext: '.js'

    watch:
      options:
        livereload: true
        atBegin: true
      coffee:
        files: [
          'coffee/*.coffee'
          'coffee/collections/*.coffee'
          'coffee/models/*.coffee'
          'coffee/views/*.coffee'
        ]
        tasks: ['coffee']
        options:
          spawn: false
      sass:
        files: ['scss/*.scss']
        tasks: ['sass']
        options:
          spawn: false
      haml:
        files: [
          'haml/*.haml'
          'haml/includes/*.haml'
        ]
        tasks: ['haml']
        options:
          spawn: false

    localhosts:
      activate:
        options:
          rules: [
            type: 'set'
            ip: '127.0.0.1'
            hostname: 'dev.myredditall.com'
          ]
      deactivate:
        options:
          rules: [
            type: 'remove'
            ip: '127.0.0.1'
            hostname: 'dev.myredditall.com'
          ]

    connect:
      server:
        options:
          port: 8002
          debug: true
          base: 'dist'

  grunt.registerTask 'development', 'Generates development environment', () ->
    fs = require('fs')

    grunt.file.delete('.css') if fs.existsSync('.css')
    grunt.file.delete('.html') if fs.existsSync('.html')
    grunt.file.delete('.js') if fs.existsSync('.js')
    grunt.file.delete('dist') if fs.existsSync('dist')

    grunt.file.mkdir('dist')
    fs.symlinkSync('../images', 'dist/images', 'dir')
    fs.symlinkSync('../.css', 'dist/css', 'dir')
    fs.symlinkSync('../.js', 'dist/js', 'dir')
    fs.symlinkSync('../.html/includes', 'dist/includes', 'dir')
    fs.symlinkSync('../.html/index.html', 'dist/index.html', 'file')
    fs.symlinkSync('../bower_components', 'dist/bower_components', 'dir')
    fs.symlinkSync('../coffee', 'dist/coffee', 'dir')

    return

  grunt.registerTask 'default', ['development', 'connect', 'watch']
  grunt.registerTask 'activate', ['localhosts:activate'] # needs to be 'sudo'
  grunt.registerTask 'deactivate', ['localhosts:deactivate'] # needs to be 'sudo'
  # TODO: add grunt task to create a production worthy build
