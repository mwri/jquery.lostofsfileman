var path = require('path');

module.exports = function(grunt) {

	require('load-grunt-tasks')(grunt);

	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),

		concat: {
			es6: {
				src:  ['lib/*.js'],
				dest: 'dist/<%= pkg.name %>.js',
				options: {
					separator: '\n\n',
					stripBanners: { line: true },
					banner: '// Package: <%= pkg.name %> v<%= pkg.version %> (built <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %>)\n// Copyright: (C) 2017 <%= pkg.author.name %> <<%= pkg.author.email %>>\n// License: <%= pkg.license %>\n\n\n',
				},
			},
			es5min: {
				src:  ['lib/*.js'],
				dest: 'dist/<%= pkg.name %>.min.js',
				options: {
					separator: '\n\n',
					stripBanners: { line: true },
					banner: '// Package: <%= pkg.name %> v<%= pkg.version %> (built <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %>)\n// Copyright: (C) 2017 <%= pkg.author.name %> <<%= pkg.author.email %>>\n// License: <%= pkg.license %>\n\n\n',
				},
			},
			css: {
				src: ['lib/*.css'],
				dest: 'dist/<%= pkg.name %>.css',
			},
		},

		uglify: {
			options: {
				banner: '// Package: <%= pkg.name %> v<%= pkg.version %> (built <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %>)\n// Copyright: (C) 2017 <%= pkg.author.name %> <<%= pkg.author.email %>>\n// License: <%= pkg.license %>\n',
			},
			build: {
				files: {
					'dist/<%= pkg.name %>.min.js': ['dist/<%= pkg.name %>.min.js']
				},
			},
		},

		jshint: {
			files: ['gruntfile.js', 'lib/*.js'],
			options: {
				esversion: 6,
				laxbreak:  true,
				validthis: true,
			},
		},

		babel: {
			options: {
				presets: ['es2015'],
			},
			build: {
				files: {
					'dist/jquery.lostofsfileman.min.js': 'dist/jquery.lostofsfileman.min.js',
				},
			},
		},

		watch: {
			full: {
				options: {
					spawn: true,
				},
				files: [
					'lib/*.js',
					'lib/*.css',
				],
				tasks: ['build'],
			},
			dev: {
				options: {
					spawn: true,
				},
				files: [
					'lib/*.js',
					'lib/*.css',
				],
				tasks: ['dev'],
			},
		},

		clean: [
			'node_modules',
		],

		gitstatus: {
			publish: {
				options: {
					callback: function (r) {
						if (r.length > 0)
							throw new Error('git status unclean');
					},
				},
			},
		},

		eslint: {
			target: ['lib'],
		},

	});

	grunt.registerTask('build', [
		'jshint',
		'eslint',
		'concat',
		'babel',
		'uglify',
		]);

	grunt.registerTask('default', ['build']);

	grunt.registerTask('prepublish', [
		'clean',
		'gitstatus:publish',
	]);


};
