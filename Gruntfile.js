module.exports = function(grunt) {
  var fs = require('fs');

  grunt.loadNpmTasks('grunt-haml');
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');

  function setUpDevelopment() {
    if (grunt.file.exists('dist')) {
      grunt.file.delete('dist');
    }

    grunt.file.mkdir('dist');
    fs.symlinkSync('../images', 'dist/images', 'dir');
    fs.symlinkSync('../.css', 'dist/css', 'dir');
    fs.symlinkSync('../.js', 'dist/js', 'dir');
    fs.symlinkSync('../.html/includes', 'dist/includes', 'dir');
    fs.symlinkSync('../.html/index.html', 'dist/index.html', 'file');
    fs.symlinkSync('../bower_components', 'dist/bower_components', 'dir');
  }

  setUpDevelopment();

  grunt.initConfig({
    pkg: require('./package.json'),

    haml: {
      options: {
        language: 'coffee'
      },

      dist: {
        files: grunt.file.expandMapping(['haml/*.haml'], '.html/', {
          rename: function(base, path) {
            return base + path.replace(/haml\//, '').replace(/\.haml$/, '');
          }
        })
      },

      includes: {
        files: grunt.file.expandMapping(['haml/includes/*.haml'], '.html/', {
          rename: function(base, path) {
            return base + path.replace(/haml\//, '').replace(/\.haml$/, '');
          }
        })
      }
    },

    sass: {
      dist: {
        options: {
          outputStyle: 'nested'
        },

        files: {
          '.css/main.css': 'scss/main.scss'
        }
      }
    },

    coffee: {
      options: {
        bare: true,
      },

      root: {
        expand: true,
        flatten: true,
        cwd: './coffee/',
        src: ['*.coffee'],
        dest: '.js/',
        ext: '.js'
      },

      collections: {
        expand: true,
        flatten: true,
        cwd: './coffee/collections',
        src: ['*.coffee'],
        dest: '.js/collections',
        ext: '.js'
      },

      views: {
        expand: true,
        flatten: true,
        cwd: './coffee/views',
        src: ['*.coffee'],
        dest: '.js/views',
        ext: '.js'
      },

      models: {
        expand: true,
        flatten: true,
        cwd: './coffee/models',
        src: ['*.coffee'],
        dest: '.js/models',
        ext: '.js'
      }
    },

    watch: {
      options: {
        livereload: true,
        atBegin: true
      },

      js: {
        files: ['coffee/*.coffee', 'coffee/collections/*.coffee', 'coffee/models/*.coffee', 'coffee/views/*.coffee'],
        tasks: ['coffee'],
        options: {
          spawn: false,
        }
      },

      css: {
        files: ['scss/*.scss'],
        tasks: ['sass'],
        options: {
          spawn: false,
        }
      },

      html: {
        files: ['haml/*.haml'],
        tasks: ['haml'],
        options: {
          spawn: false,
        }
      }
    },

    connect: {
      server: {
        options: {
          port: 8000,
          debug: true,
          base: 'dist'
        }
      }
    }

  });

  grunt.registerTask('default', ['haml', 'coffee', 'scss']);
  grunt.registerTask('dev', ['connect', 'watch']);
};