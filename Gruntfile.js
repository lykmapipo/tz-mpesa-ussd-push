'use strict';

module.exports = function (grunt) {

  // add grunt tasks.
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.initConfig({
    mochaTest: {
      unit: {
        options: {
          reporter: 'spec',
          timeout: 20000
        },
        src: [
          'test/**/*.js',
          'test/unit/**/*.js',
          '!test/integration/**/*.js'
        ]
      },
      integration: {
        options: {
          reporter: 'spec',
          timeout: 20000
        },
        src: [
          'test/**/*.js',
          'test/integration/**/*.js',
          '!test/unit/**/*.js'
        ]
      }
    },
    jshint: {
      options: {
        reporter: require('jshint-stylish'),
        jshintrc: '.jshintrc'
      },
      main: {
        src: [
          'Gruntfile.js',
          'index.js',
          'lib/**/*.js',
        ]
      },
      test: {
        options: {
          jshintrc: 'test/.jshintrc'
        },
        src: [
          'test/**/*.js'
        ]
      }
    },
    watch: {
      all: {
        files: [
          'Gruntfile.js',
          'index.js',
          'lib/**/*.js',
          'test/**/*.js'
        ],
        tasks: ['default']
      }
    }
  });

  //custom tasks
  grunt.registerTask('default', ['jshint', 'mochaTest', 'watch']);
  grunt.registerTask('test', ['jshint', 'mochaTest']);
  grunt.registerTask('integration', ['jshint', 'mochaTest:integration']);
  grunt.registerTask('unit', ['jshint', 'mochaTest:unit']);

};
