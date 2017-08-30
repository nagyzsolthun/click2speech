const webpack = require('webpack');
const path = require("path");
const search = require('find')

var entries = search.fileSync(/.spec.js$/, __dirname);

//var entries = [ path.resolve(__dirname, 'background', 'js', 'tts', 'TextSplitter.spec.js') ];

const output = {
	path: path.resolve(__dirname, '../build-test')
	,filename: 'test-bundle.js'
}

const babelLoader = {
	test: /\.js$/
	,loader: 'babel-loader'
}

module.exports = {
	entry: entries
	,output: output
	,module: {rules: [ babelLoader ]}
}
