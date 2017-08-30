const webpack = require('webpack');
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const output = {
	path: path.resolve(__dirname, '../build-extension/options')
	,filename: 'options.js'
}

const jsLoaderRule = {test: /\.js$/,loader: 'babel-loader'}
const vueLoaderRule = {test: /\.vue$/, loader: 'vue-loader'}
const imgLoaderRule = {test: /\.(png|svg)$/, loader: 'file-loader'}

const optionsHtmlPlugin = new HtmlWebpackPlugin({title: "click2speech", filename: "options.html"});

module.exports = {
	entry: './options/app.js'
	,output: output
	,module: {rules: [ vueLoaderRule, imgLoaderRule ]}
	,plugins: [ optionsHtmlPlugin ]
}
