const through = require('through');
const browserify = require('browserify');
const path = require('path');
const fs = require('fs');
const escapeStringRegexp = require('escape-string-regexp');

const b = browserify(
	path.join(__dirname,'..','src','sassWrapper.js'),
	{
		
		standalone: 'sass'
	}
);
const sassPath = require.resolve('sass');
b.ignore('chokidar');
b.ignore('fs');
b.ignore('readline');
let files = [];
b.transform(function(file){
	let data = '';
    return through(
		buf => data += buf,
		function(){
			if(file === sassPath){
				data = data.replace(
					'var self = Object.create(dartNodePreambleSelf);',
					fs.readFileSync(path.join(__dirname,'clone-object.txt'))
				);
				
				data = data.replace(
					/self\.Buffer/g,
					'Buffer'
				);
			
				data = data.replace(
					new RegExp(
						escapeStringRegexp('("undefined" !== typeof __webpack_require__ ? __non_webpack_require__ : require)'),
						'g'
					),
					'require'
				);
			}
	        this.queue(data);
	        this.queue(null);
	    }
	);
},{global:true});
b.bundle().pipe(fs.createWriteStream(path.join(__dirname,'..','src','sass.js')));