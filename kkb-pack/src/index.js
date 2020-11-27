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
const config = {...defaultConfig, ...require(path.resolve('./kkb.config.js'))}

class KkbPack{
    constructor(config){
        this.config = config
        this.entry = config.entry
        this.root = process.cwd()
        this.modules={}
        this.template = ''
    }
    parse(code, parent){
        //  能够解析文件内容中的require(xxx.js)这种格式的,并且替换为__kkb_require__
        let deps=[]
        let r = /require\('(.*)'\)/g
        code = code.replace(r, function(match, arg){
            const retPath = path.join(parent, arg.replace(/'|"/g), '')
            deps.push(retPath)
            return `__kkb_require__('./${retPath}')`
        })
        return {code, deps}
    }
    createModule(modulePath, name){
        const fileContent = fs.readFileSync(modulePath, 'utf-8')
        // 替换后的代码和依赖数组
        const {code, deps} = this.parse(fileContent, path.dirname(name))
        // console.log(code, deps)
        this.modules[name] = `function(module, exports, __kkb_require__){
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
        // console.log(this.modules)
        // 生成文件
        this.generateFiles()
    }
}

const kkb=new KkbPack(config)
kkb.start()