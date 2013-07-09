module.exports = function(grunt) {
  'use strict';

  var src = {
    assets: ['assets/js/**/*.js', '!assets/js/lib/**'],
    app: ['app/**/*.js', '!app/public/**'],
    public: ['app/public/js/**/*.js', '!app/public/js/lib/**', '!app/public/js/main.min.js'],
  };

  var tests = {
    server: ['test/server/**/*Spec.js']
  };

  // Project configuration.
  grunt.initConfig({
    meta: {
      pkg: grunt.file.readJSON('package.json')
    },

    compass: {
      options: {
        require: 'bootstrap-sass',
        sassDir: 'assets/sass',
        cssDir: 'app/public/css',
        relativeAssets: true,
        imagesDir: 'app/public/img',
        javascriptsDir: 'app/public/js'
      },
      dev: {
        options: {
          environment: 'development'
        }
      },
      dist: {
        options: {
          environment: 'production',
          outputStyle: 'compressed',
          noLineComments: true,
          force: true
        }
      }
    },

    mochaTest: {
      test: {
        options: {
          reporter: 'nyan',
          require: 'test/server/runner'
        },
        src: tests.server
      },
      coverage: {
        options: {
          reporter: 'html-cov',
          quiet: true
        },
        src: tests.server,
        dest: 'coverage.html'
      }
    },

    // Build Require.js files (client-side only)
    requirejs: {
      options: {
        baseUrl: 'assets/js',
        name: 'main',
        out: 'app/public/js/main.min.js',
        paths: {
          ace: '../../app/public/js/lib/ace',
          backbone: 'lib/backbone-amd-0.9.10-min',
          bootstrap: 'lib/bootstrap.min',
          domReady: 'lib/domReady',
          jquery: 'lib/require-jquery',
          sockjs: 'lib/sockjs-0.3.min',
          underscore: 'lib/underscore.min',

          // Views
          editorView: 'views/editorView'
        },
        shim: {
          'bootstrap': ['jquery'],
          'underscore': {
            exports: '_'
          }
        }
      },
      dev: {
        options: {
          optimize: 'none'
        }
      },
      dist: {
        options: {
          optimize: 'uglify2',
          mangle: true,
          preserveLicenseComments: false,
          done: function(done, output) {
            var duplicates = require('rjs-build-analysis').duplicates(output);

            if (duplicates.length > 0) {
              grunt.log.subhead('Duplicates found in requirejs build:');
              grunt.log.warn(duplicates);
              done(new Error('r.js built duplicate modules, please check the excludes option.'));
            }

            done();
          }
        }
      }
    },

    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: [
        'Gruntfile.js',
        src.assets,
        src.app,
        src.public,
        tests.server
      ]
    },

    watch: {
      options: {
        livereload: true
      },
      gruntfile: {
        files: 'Gruntfile',
        tasks: ['jshint:all'],
        options: {
          livereload: false
        }
      },
      app: {
        files: src.app,
        tasks: ['mochaTest', 'jshint:all']
      },
      assets: {
        files: src.assets,
        tasks: ['requirejs:dev', 'mochaTest', 'jshint:all']
      },
      tests: {
        files: tests.server,
        tasks: ['mochaTest', 'jshint:all']
      }
    },

    shell: {
      deploy: {
        command: 'echo \'yes\' | jitsu deploy',
        options: {
          failOnError: true,
          callback: function(err, stdout, stderr, cb) {
            console.log('Finished uploading to Nodejitsu.');
            cb();
          }
        }
      }
    }
  });

  // On watch events, configure jshint:all to run only on changed file
  grunt.event.on('watch', function(action, filepath) {
    grunt.config(['jshint', 'all'], filepath);
  });

  // Load third-party modules
  grunt.loadNpmTasks('grunt-contrib-compass');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-notify');
  grunt.loadNpmTasks('grunt-shell');

  // Tasks
  grunt.registerTask('test', ['mochaTest', 'jshint:all']);
  grunt.registerTask('dev', ['requirejs:dev', 'compass:dev', 'test']);
  grunt.registerTask('dist', ['requirejs:dist', 'compass:dist', 'test']);
  grunt.registerTask('deploy', ['dist', 'shell:deploy']);

  // Runs just before a commit. Don't put tasks that generate files here as
  // they won't be included in your commit.
  grunt.registerTask('precommit', ['test']);

  // Default task (runs when running `grunt` without arguments)
  grunt.registerTask('default', ['test']);
};
