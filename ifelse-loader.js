let loaderUtils = require('loader-utils');
let parse = require('./lib/parse');

module.exports = function (source) {
    this.cacheable && this.cacheable();
    let options = loaderUtils.getOptions(this);

    let resource = this._module.resource;

    const verboseFlag = "_debug";
    const verbose = options[verboseFlag];
    if (verbose !== undefined) {
        delete options[verboseFlag];
    }

    try {
        source = parse(source, options, verbose);
        this.callback(null, source);
    }
    catch (err) {
        const errorMessage = `ifdef-loader error: ${err},file:${resource}`;
        this.callback(new Error(errorMessage));
    }
};

