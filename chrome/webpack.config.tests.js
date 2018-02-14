const webpack = require('webpack');
const path = require("path");
const search = require('find')

const entries = search.fileSync(/.spec.js$/, __dirname);

const output = {
    path: path.resolve(__dirname, '../build-test'),
    filename: 'test-bundle.js'
}

const babelLoader = {
    test: /\.js$/,
    loader: 'babel-loader'
}

module.exports = {
    entry: entries,
    output: output,
    module: {rules: [ babelLoader ]}
}
