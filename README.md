### webpack
要剖析webpack的打包原理就要清楚webpack核心的几个部分：
1. entry：定义整个编译过程的起点
2. output：定义整个编译过程的终点
3. module：定义模块module的处理方式
4. pulgin对编译完成后的内容进行二度加工
5. resolve.alias 定义模块的别名

这是一份标准的webpack配置文件的组成部分。
```
modules.export = {
    entry: './index.js',
    output: {
        path: path.resolve(process.cwd(),'dist/'),
        filename: '[name].js'
    },
    resolve:{
        alias:{query:'src/lib/query.js'}
    },
    module: {
        rules: [
          { test: /\.txt$/, use: 'raw-loader' }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({template: './src/index.html'})
    ]
}

module.exports = config;
```


### webpackdemo
从一个webpack应用的最简单的案例来剖析webpack打包过程到底做了哪些事：
1. 新建目录webpackdemo并执行`npm init -y`初始化项目
2. webpackdemo 中安装依赖
`npm install webpack webpack-cli -D`   
3. 新建src/index.js,和src/a.js
```
// a.js
const sayAge = require('./common/util.js')
module.exports=(name)=>{
    console.log('hello world'+name)
    sayAge(18)
}
```
```
// index.js
let sayHi = require('./a.js')
sayHi('webpack')
```
新建webpack.config.js，一份最简单的webpack配置只需要定义入口和出口：
```
module.export = {
    mode: 'development',
    entry: './src/index.js',
    output: {
        filename: 'pack.js'
    }
}
```

### webpack编译后的代码
执行npx webpack 查看打包后的代码，删除一些无用的代码后。大概是个样子
```
(function(modules) { // webpackBootstrap
	// The module cache
	var installedModules = {};
	// The require function
	function __webpack_require__(moduleId) {
		// Check if module is in cache
		if(installedModules[moduleId]) {
			return installedModules[moduleId].exports;
		}
		// Create a new module (and put it into the cache)
		var module = installedModules[moduleId] = {
			i: moduleId,
			l: false,
			exports: {}
		};
		// Execute the module function
		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
		// Return the exports of the module
		return module.exports;
	}
	
	// Load entry module and return exports
	return __webpack_require__(__webpack_require__.s = "./src/index.js");
})
({

"./src/a.js":(function(module, exports) {
eval("module.exports=(name)=>{\n    console.log('hello world'+name)\n}\n\n//# sourceURL=webpack:///./src/a.js?");
}),

"./src/index.js":
(function(module, exports, __webpack_require__) {
eval("let sayHi = __webpack_require__(/*! ./a.js */ \"./src/a.js\")\nsayHi('webpack')\n\n//# sourceURL=webpack:///./src/index.js?");
})

});
```
### webpack打包过程做的几件事
1. 读取webpack.config.js
2. 解析文件的相互依赖关系
3. 替换require 为__webpack_reuqire__
4. 本地使用{}存储所有的文件，然后通过__webpack_reuqire__获取文件内容，执行函数 

加上loader   
加上plugin机制

了解了webpack打包过程，我们可以尝试实现一个简单的webpack打包器。

### mypack
新建文件夹mypack，新建src/template.js以及index.js。

#### template.js
```
!function(modules) { // webpackBootstrap
	// The module cache
	var installedModules = {};
	// The require function
	function __my_require__(moduleId) {
		// Check if module is in cache
		if(installedModules[moduleId]) {
			return installedModules[moduleId].exports;
		}
		// Create a new module (and put it into the cache)
		var module = installedModules[moduleId] = {
			i: moduleId,
			l: false,
			exports: {}
		};
		// Execute the module function
		modules[moduleId].call(module.exports, module, module.exports, __my_require__); // 执行传入的模块
		// Return the exports of the module
		return module.exports;
	}
	
	// Load entry module and return exports
	return __my_require__("__entry__");
}({__modules_content__})
```
一个自执行的函数，传入参数为__modules_content__（这个要替换为模块对象），函数体内实现了一个模块缓存队列，定义并返回函数__my_require__，在这个函数内部将模块装入缓存队列。
#### index.js
```
#! /usr/bin/env node
const path = require('path')
const fs = require('fs')
// 默认的配置
const defaultConfig={
    entry:'./src/index.js',
    output:{
        filename:'bundle.js'
    }
}
// 拿到最终配置
const config = {...defaultConfig, ...require(path.resolve('./mypack.config.js'))}

class MyPack{
    constructor(config){
        this.config = config
        this.entry = config.entry
        this.root = process.cwd()
        this.modules={}
        this.template = ''
    }
    parse(code, parent){
        //  能够解析文件内容中的require(xxx.js)这种格式的,并且替换为__my_require__
        let deps=[]
        let r = /require\('(.*)'\)/g
        code = code.replace(r, function(match, arg){
            const retPath = path.join(parent, arg.replace(/'|"/g), '')
            deps.push(retPath)
            return `__my_require__('./${retPath}')`
        })
        return {code, deps}
    }
    createModule(modulePath, name){
        const fileContent = fs.readFileSync(modulePath, 'utf-8')
        // 替换后的代码和依赖数组
        const {code, deps} = this.parse(fileContent, path.dirname(name))
        // console.log(code, deps)
        this.modules[name] = `function(module, exports, __my_require__){
            eval(\"${code}\")
        }`
        // 循环获取所有依赖数组的内容
        deps.forEach((dep)=>{
            this.createModule(path.join(this.root, dep), './'+dep)
        })
    }
    generateModuleStr(){
        let fnTemp = ''
        Object.keys(this.modules).forEach(name => {
            fnTemp += `"${name}":${this.modules[name]},`
        })
        return fnTemp
    }
    generateFiles(){
        let template = fs.readFileSync(path.resolve(__dirname, './template.js'), 'utf8')
        this.template = template.replace('__entry__', this.entry)
            .replace('__modules_content__', this.generateModuleStr())
        fs.writeFileSync('./dist/'+this.config.output.filename, this.template)
        console.log('写入文件完毕')
    }
    start(){
        console.log('开始解析依赖')
        const entryPath = path.resolve(this.root, this.entry)
        this.createModule(entryPath, this.entry)
        console.log(this.modules)
        // 生成文件
        this.generateFiles()
    }
}

const mypack=new MyPack(config)
mypack.start()
```

主要做了这几件事：
1. 读取配置文件，与默认的配置进行合并，并拿到最终的配置
2. parse，解析文件内容中的require(xxx.js)这种格式的,并且替换为___require__，生成替换后代码和依赖数组。
3. createModule，从入口文件开始解析依赖，生成模块对象。
4. generateFiles，生成文件，根据模版文件，替换entry和modules_content。生成最终的打包文件。



### npm link

如何在在工程下应用mypack命令？
在本地开发npm模块的时候，我们可以使用npm link命令，将npm模块链接到对应的运行项目中去，方便地对模块进行调试和测试。
1. 在my-pack文件夹下的package.json中加入bin命令
```
"bin":{
    "my-pack": "./src/index.js"
}
```
2. 在my-pack下运行`npm link`, 即将本地的当前的命令安装到了本地的全局。
3. 在任意文件下执行my-pack，即能执行对应的命令。
4. 在webpack-demo文件夹下加入scripts
```
scripts:{
    ...
    "build:my-pack":"my-pack",
}
```
5. 执行`npm run build:my-pack`。生成最终的打包文件在dist目录下

至此，一个手写的简易打包器已经实现，webpack的本质就是一个js模块打包器，理解了这个过程，能更好的理解官网对webpack的描述：
> 本质上，webpack 是一个现代 JavaScript 应用程序的静态模块打包器(module bundler)。当 webpack 处理应用程序时，它会递归地构建一个依赖关系图(dependency graph)，其中包含应用程序需要的每个模块，然后将所有这些模块打包成一个或多个 bundle。

在webpack中一切皆是模块，webpack能处理样式文件，图片资源以及其他一切非javascript模块的能力是通过loader实现的。所以在一个完整的webpack打包器的源码里还需要加上loader和plugin的实现。本文只为理解webpack提供一个基本的框架和思路。