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
	return __kkb_require__("__entry__");
}({__modules_content__})