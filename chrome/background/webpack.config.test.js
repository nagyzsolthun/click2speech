const path = require("path");
const search = require('find')

const moduleFolder = path.resolve(__dirname, 'modules');
const entries = search.fileSync(/.spec.[jt]s$/, moduleFolder);

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
    resolve: {
        extensions: [ '.ts', '.js' ]   // so imports work without specifying file extension
    },
    mode: "development"
}
