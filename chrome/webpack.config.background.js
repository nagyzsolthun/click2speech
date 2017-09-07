const webpack = require('webpack');
const path = require("path");

const output = {
	path: path.resolve(__dirname, '../build-extension/background')
	,filename: 'background.js'
};
const jsLoaderRule = {test: /\.js$/,loader: 'babel-loader'};
const audioLoaderRule = {test: /\.wav$/,loader: 'file-loader'};

module.exports = {
	entry: './background/background.js'
	,output: output
	,module: {rules: [jsLoaderRule,audioLoaderRule]}
}
