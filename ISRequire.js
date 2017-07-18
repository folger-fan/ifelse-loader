/**
 * Created by folgerfan on 2017/7/4.
 *
 * 用于node端加载资源，配合ifelse-loader
 */
let path = require('path');
let fs = require('fs');
let cache = {};
let replaceReg = /(\/)([^/]+)$/;

let ISRequire = function (currentRequire) {
    if (!currentRequire) {
        throw new Error('请传入调用时的require')
    }
    let currentModule = currentRequire.main;
    let currentFile = currentModule.filename;//调用方文件绝对路径
    let currentDir = path.dirname(currentFile);//调用方文件所在目录
    return function (filePath) {//引用的相对路径
        let fileAbsolutePath = path.join(currentDir, filePath);//引用的文件绝对路径

        let reResult = filePath.match(replaceReg);
        if (!reResult) {
            return currentRequire(filePath)
        }
        if (cache[fileAbsolutePath]) {
            return cache[fileAbsolutePath]
        }
        let requireModule;
        try {
            let newFilePath = filePath.replace(replaceReg, `${reResult[1]}${ISRequire._node_pre}${reResult[2]}`);
            requireModule = currentRequire(newFilePath);
        } catch (e) {
            requireModule = currentRequire(filePath)
        }
        cache[fileAbsolutePath] = requireModule;
        return requireModule
    }
};
ISRequire._node_pre = '_node_';
module.exports = ISRequire;