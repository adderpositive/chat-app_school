'use strict';

module.exports = function(grunt){

	require('load-grunt-tasks')(grunt);

	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),

		babel : {

			compile: {

				options : {
			    	sourceMap : false,
			    	minified: false,
			    	comments: false,
			    	presets: ['es2015']
			  	},

		    	files : [{
		      		expand: true,
		      		cwd: 'app/frontend/src/', 
		      		src: ['*.jsx'],
		      		dest: 'app/frontend/build/',
		      		ext: '.js'
		    	}]
			}
		},

		less: {

			devel : {
				options: {
                    
                    cleancss: true
                },

				files: {
					'styles/build/styles.css': ['styles/styles.less' ],
					'styles/build/print.css': ['styles/print.less' ]
		        }
			}
		},

		autoprefixer: {

			devel: {

				options: {
					browsers: ["last 2 versions", "ie 8", "ie 9", "ie 10", "ie 11"]
				},

				files: [
					{
						expand: true,
						cwd: "styles/build/",
						src: [ "*.css" ],
						dest: "styles/build/"
					}
				]
			}
		},

		watch: {

			scripts: {
				options: {	
					spawn: false
				},
				files: [ 'app/frontend/src/*.js', 'app/frontend/src/*.jsx' ],
				tasks: [ 'babel', "concat:plugins", "concat:ready", "concat:devel" ]
			},

			styles: {
				files: [ 'styles/**/*.less' ],
				tasks: [ 'less:devel', 'autoprefixer:devel' ]
			}
		},

		clean: {
			test: ['app/frontend/build/*', 'styles/build/*', 'app/frontend/main.js']
		},

		concat: {

			plugins: {

				files: [
					{
						"app/frontend/build/plugins.js": [
							"app/frontend/plugins/jquery.min.js", //jquery
							"app/frontend/plugins/jquery.min.magnific.popup.js", //jquery
							"app/frontend/plugins/react.min.js", // react
							"app/frontend/plugins/react-dom.min.js"
						]
					}
				]
			},

			ready: {

				options: {
					banner: "$(function() {\n \"use strict\";\n\n",
					footer: "\n\n});",
					separator: "\n\n"
				},

				files: [
					{
						"app/frontend/build/ready.js": [
							"app/frontend/src/*.js"
						]
					}
				]
				
			},

			devel: {

				files: [
					{
						"app/frontend/main.js": [
							"app/frontend/build/Main.js"
						],

						"app/frontend/login.js": [
							"app/frontend/build/Login.js"
						],

						"app/frontend/signup.js": [
							"app/frontend/build/SignUp.js"
						],

						"app/frontend/introduce.js": [
							"app/frontend/build/Introduce.js"
						],

						"app/frontend/chatroom.js": [
							"app/frontend/build/ChatRoom.js"
						],

						"app/frontend/plugins.js": [
							"app/frontend/build/plugins.js",
							"app/frontend/build/ready.js"
						]
					}
				]
			}
		}
	});

  	grunt.registerTask('default', [
  		'clean',
  		'babel',
  		'less:devel',
  		'autoprefixer:devel',
  		'concat:plugins',
  		'concat:ready',
  		'concat:devel',
  		'watch',
  		'cssmin',
  		'copy:prod'
  	]);
}