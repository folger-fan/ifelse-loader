/**
 * Created by folgerfan on 2017/7/18.
 */
var webpack = require('webpack');
var path = require('path');
var fs = require('fs');


var devConfig = {
    entry: './index.js',
    output: {
        filename: './build.js',
        path: path.resolve(__dirname, '.'),
        publicPath: ''
    },
    module: {
        loaders: [{
            test: /\.js$/,
            use: [
                {
                    loader: '../ifelse-loader',
                    options: {
                        node: false
                    }
                }
            ]
        }]
    }
};

module.exports = devConfig;