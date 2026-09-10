const path = require("path");

const output = {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].js',
    publicPath: ''
};

const tsLoaderRule = { test: /\.ts$/, loader: 'ts-loader' };
const audioLoaderRule = { test: /\.wav$/, type: 'asset/resource' };

module.exports = {
    entry: {background: './modules/background.ts', host: './modules/host.ts'},
    output: output,
    module: { rules: [tsLoaderRule, audioLoaderRule] },
    resolve: {
        extensions: [ '.ts', '.js' ]   // so imports work without specifying file extension
    },
    mode: "production",
    optimization: {
        minimize: false
    }
}
