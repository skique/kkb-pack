!function(modules) { // webpackBootstrap
	// The module cache
	var installedModules = {};
	// The require function
	function __kkb_require__(moduleId) {
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
		modules[moduleId].call(module.exports, module, module.exports, __kkb_require__); // 执行传入的模块
		// Return the exports of the module
		return module.exports;
	}
	
	// Load entry module and return exports
	return __kkb_require__("./src/index.js");
}({"./src/index.js":function(module, exports, __kkb_require__){
            eval("let sayHi = __kkb_require__('./src/a.js')
sayHi('webpack')")
        },"./src/a.js":function(module, exports, __kkb_require__){
            eval("const sayAge = __kkb_require__('./src/common/util.js')
module.exports=(name)=>{
    console.log('hello world'+name)
    sayAge(18)
}")
        },"./src/common/util.js":function(module, exports, __kkb_require__){
            eval("module.exports=(age)=>{
    console.log('你今年'+age+'岁了')
}")
        },})