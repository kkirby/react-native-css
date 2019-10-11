const sass = require('sass');
const Buffer = require('buffer');

if(window != null){
	window.Buffer = Buffer;
}
if(global != null){
	global.Buffer = Buffer;
}

module.exports = sass;