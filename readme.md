# node前后端同构新思路
## 背景

用node做web可以让部分代码前后端通用。例如一些工具方法、部分业务逻辑、M层数据结构等。用node做web的直出，可以共用V层模版。

## 痛点

但是在前后端代码复用的时候不可避免会碰到一些问题，如：

* **环境不同** 前端有window等浏览器api，node端有node的一些api。前端使用useragent从location取，后端使用useragent从请求request中取

* **逻辑不同**  日志上报、鉴权

* **类库不同**  node端调接口的请求的类库和前端ajax的类库不同

网上看过一些用node做直出，前后端同构的文章，大多介绍的是用react、vue等模版引擎的V层模版的复用。

我们想前后端尽量多的共用代码，但现实情况是，很多功能相同的代码不得不写两份，前后端分开引用。很难做到相同的功能在业务层引用同一份文件。

## 新思路

是否可以在源文件中，包含前后端各自代码，用条件判断语句包裹，在编译的过程中根据配置对源文件中内容进行选择过滤，前端引用为前端生成的文件，
后端可以引用源文件也可以引用为后端编译的文件。虽然也有点麻烦，但能更进一步通用代码，对业务层代码透明。

### 实现
笔者现在用的webpack编译前端文件，在github上搜到了类似功能的loader
 [if-loader](https://github.com/friskfly/if-loader)
[ifdef-loader](https://github.com/nippur72/ifdef-loader)
其中if-loader只能判断if，没有判断else的功能。

ifdef-loader用ts实现的，可能是为webpack1准备的，options只能在loader?后面追加条件。相比if-loader增加了else的判断。如下所示：
```
///#if !node
console.log('if not node ');
///#else
console.log('else not node');
///#endif
```
会被编译成
```
////////////
////////////////////////////
////////
console.log('else not node');
/////////
```
但是在node端如果引用源文件的话，为前端准备的代码会遗留在源文件中造成代码冗余。有些前端文件在es6的标准些会使用import等node不支持的语法，会造成报错。
所以笔者在ifdef-loader的基础上做了完善，新写了[ifelse-loader](./ifelse-loader)：保留ifdef-loader的功能的基础上，options可以在webpack配置文件中用options配置，不用追加在loader?后的参数中。
#### 配置
```
{
   loader: '../ifelse-loader',
     options: {
        node: false
     }
}
```

增加了在///#code 后写代码的功能，
```
///#if node
console.log('if node 2');
///#else
///#code console.log('else node 2')
///#endif
```

会被编译成

```
console.log('if node 2');
```

#### 用法举例
源文件
```
///#if node
console.log('if node 1');
///#endif
///#if !node
console.log('if not node ');
///#else
console.log('else not node');
///#endif

///#if node
console.log('if node 2');
///#else
///#code console.log('else node 2')
///#endif

///#if !node
///#code console.log('if not node ');
///#else
///#code console.log('else not node');
///#endif
```
编译后
```
console.log('if node 1');

console.log('else not node');

console.log('if node 2');

console.log('else not node')
```
如果用 `///#code console.log('else node 2')`这种写法，代码写起来可能会比较痛苦。

笔者尝试过将node端也用webpack编译一份，也走的通，不过感觉用起来很奇怪。
后来想将node中的require改写，可以带上编译的功能或者webpack在编译的时候将源文件a编译一份放到当前目录生成_node_a文件，
其他文件引用a的时候会转而引用_node_a。因为node中每个模块的require都是独立的，没有统一的地方改写，所以另外写了个[ISRequire](https://github.com/folger-fan/ifelse-loader/blob/master/ISRequire.js)包装原require，
[具体用法可参照test下的文件](https://github.com/folger-fan/ifelse-loader/tree/master/test)。
###  实际案例
####  art-template的filter
因为正在做的h5页面主要是内容展示，不涉及数据修改，所以没有采用react、vue，而是选用一个轻量模版引擎[art-template](https://aui.github.io/art-template/)
因为前后端用模版生成html需要注册工具方法，但前后端api不同。前端需要引入一个*art-template/lib/runtime*但后端不需要，前端ua和后端ua取法不一样，取ur参数的方法也不一样，所以用ifelse-loader做适配。如下是选取的部分代码
```
let template;
let runtime = {};
///#if node
template = require('art-template');
let QS = require('querystring');
function getFullUrl(path, params) {
    var basePath = getBasePath();
    var baseQuery = getBaseQuery();
    var params = params || {};
    for (var i = 0; i < keyMap.length; i++) {
        var key = keyMap[i];
        if (baseQuery.hasOwnProperty(key) && !params.hasOwnProperty(key)) {
            params[key] = baseQuery[key];
        }
    }
    var querystring = QS.encode(params);
    return basePath + path.replace(/(\?|#)(.+)/g, '') + (querystring ? '?' : '') + querystring;
}
function getBaseQuery() {
    return template.req.query;
}

function getBasePath() {
    var basePath = '/n';
    if (template.req.query.share == '1' || template.req.url.indexOf('/share') == 0) {
        basePath = '/share';
    }
    if (template.req.query.site == '1' || template.req.url.indexOf('/site') == 0) {
        basePath = '/site';
    }
    return basePath;
}

function getUserAgent() {
    return template.req.headers['user-agent'];
}
///#else
template = require('../views/lib/template.js');
runtime = require('art-template/lib/runtime');
let url = require('../views/lib/url.js')['default'];
function getFullUrl(path, params) {
    var basePath = getBasePath();
    var baseQuery = getBaseQuery();
    var params = params || {};
    for (var i = 0; i < keyMap.length; i++) {
        var key = keyMap[i];
        if (baseQuery.hasOwnProperty(key) && !params.hasOwnProperty(key)) {
            params[key] = baseQuery[key];
        }
    }
    return url.setQuery(url.getBaseUrl(basePath + path), params);
}
function getBaseQuery() {
    return url.getBaseQuery();
}
function getBasePath() {
    var basePath = '/n';
    if (location.pathname.indexOf('/share/') == 0) {
        basePath = '/share';
    }
    if (location.pathname.indexOf('/site/') == 0) {
        basePath = '/site';
    }
    return basePath;
}
function getUserAgent() {
    return window.navigator.userAgent;
}
///#endif
console.log('init template filter');
const keyMap = ['menu'];
let filters = {
    grade(grade) {
        grade = Number(grade);
        // return Math.floor(grade / 10) + 1;
        return (grade / 10).toFixed(1);
    },
    gradeIcon(grade) {
        grade = Number(grade);
        return Math.floor(grade / 10) + 1;
    },
    gradeShort(grade) {
        grade = Number(grade || 0) / 10;
        return grade.toFixed(1)
    }
};
for (var key in filters) {
    template.defaults.imports[key] = runtime[key] = filters[key];
}
module.exports = template;
```
在前端直接引用
```
require('../../util/template.js');
```
在后端用ISRequire引用
```
var ISRequire = require('../util/ISRequire')(require);
var template = ISRequire('../util/template');
```
#### 接口调用
我们目前的项目结构，后台提供http接口供运营平台页面、h5页面和客户端调用，node端调后台接口做直出，
h5首屏不需要的接口通过node转发调后台（因为后台的接口比较零碎，通过node做接口合并），
运营平台页面和h5页面通过webpack编译。通过ifelse-loader可以同构前后端的接口调用代码，
request-promise和request_promise原先是前后端各自调用接口的代码，现在通过BFRequest封装在一起，对业务层透明
```
/**
 * Created by folgerfan on 2017/7/17.
 * backend and frontend request
 */
let BaseReq = require('./BaseReq');

let rp;
///#if node
rp = require('request-promise');
///#else
rp = require('../views/lib/request_promise');
///#endif
let BFRequest = function(params){
    params = BaseReq(params);
    return rp(params)
};
module.exports = BFRequest;
```
前端直接引用
```
import rp from '../../util/BFRequest';
rp({
     //参数
}).then(/*逻辑处理*/)   
```
在后端用ISRequire引用
```
let ISRequire = require('../../util/ISRequire')(require);
let rp = ISRequire('../../util/BFRequest');
rp({
     //参数
}).then(/*逻辑处理*/)
```

### 不足
* 前后端代码写在同一份文件中的时候不能使用 import 等node不支持的语法
* 因为let重复定义会报错，可以直接使用var或用let先定义后赋值
* 一定程度上的代码啰嗦和不好看
### 后记
感谢部门同事的提议和建议，几番折腾，尝试了多种方案踩了一些坑才沉淀出目前写出来的方案。让我们在write less do more的道路上越走越远。