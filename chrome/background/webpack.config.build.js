const webpack = require('webpack');
const path = require("path");

const output = {
    path: path.resolve(__dirname, 'build'),
    filename: 'background.js'
};

const tsLoaderRule = { test: /\.ts$/, loader: 'ts-loader' };
const jsLoaderRule = { test: /\.js$/, loader: 'babel-loader' };
const audioLoaderRule = { test: /\.wav$/, loader: 'file-loader' };

module.exports = {
    entry: './modules/background.js',
    output: output,
    module: { rules: [tsLoaderRule, jsLoaderRule, audioLoaderRule] },
    resolve: {
        extensions: [ '.ts', '.js' ]   // so imports work without specifying file extension
    },
    mode: "production"
}
