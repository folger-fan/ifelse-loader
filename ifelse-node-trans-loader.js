/**
 * Created by folgerfan on 2017/6/30.
 */
let path = require('path');
let fs = require('fs');
let loaderUtils = require('loader-utils');
let ISRequire = require('./ISRequire');
let parse = require('./lib/parse');
let mkdir = require('make-dir');
let _node_pre = ISRequire._node_pre;
module.exports = function (source) {
    if (source.startsWith('//ifelse-loader build')) {
        let resourcePath = this.resource, context = this.context;
        let fileName = path.relative(context, resourcePath);
        let distPath = path.join(context, _node_pre + fileName);
        let resourceCode = fs.readFileSync(resourcePath, 'utf8');
        let options = loaderUtils.getOptions(this);
        let putCode = parse(resourceCode, options);
        mkdir(path.dirname(distPath)).then(function () {
            fs.writeFile(distPath, putCode);
        });
    }
    return source
};