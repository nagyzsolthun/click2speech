const path = require("path");
const search = require('find')

const moduleFolder = path.resolve(__dirname, 'modules');
const entries = search.fileSync(/.spec.js$/, moduleFolder);

const output = {
    path: path.resolve(__dirname, 'build'),
    filename: 'background.spec.js'
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
