// webpack lostofs bundle for jquery.lostofsfileman to use

const path = require("path");

module.exports = {
	entry: "./lostofs_webpack_entry.js",
	output: {
		filename: "./demo/lostofs_webpack_bundle.js",
	},
	module: {
		rules: [{
			test: require.resolve('lostofs'),
			use: [{
				loader: 'expose-loader',
				options: 'lostofs'
			}],
		}],
	},
	resolve: {
		modules: [
			path.resolve(__dirname, "./node_modules"),
			],
	},
};
