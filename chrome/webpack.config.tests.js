const path = require("path");
const search = require('find')

const backgroundFolder = path.resolve(__dirname, 'background');
const entries = search.fileSync(/.spec.js$/, backgroundFolder);

const output = {
    path: path.resolve(__dirname, '../build-test'),
    filename: 'test-bundle.js'
}

const babelLoader = {
    test: /\.js$/,
    loader: 'babel-loader'
}

const tsLoader = {
    test: /\.ts$/,
    loader: 'ts-loader'
}

module.exports = {
    entry: entries,
    output: output,
    module: {rules: [ babelLoader, tsLoader ]},
    mode: "development"
}
