const sass = require('sass');
const {SlowBuffer,Buffer} = require('buffer');
const {Volume} = require('memfs');

class LineBuffer {
	constructor(printFn){
		this.current = '';
		this.printFn = printFn;
	}
	
	write(text){
		this.current += text;
		this.flush();
		
	}
	
	writeln(text){
		this.write(text + '\n');
	}
	
	flush(){
		if(this.current.indexOf('\n') !== -1){
			const lines = this.current.split('\n');
			this.current = lines.pop();
			lines.forEach((line) => this.printFn(line));
		}
	}
}

module.exports = ({configContext,mockFileSystem} = {}) => {
	const context = {
		Buffer,
		SlowBuffer,
		fs: Volume.fromJSON(mockFileSystem),
		process: {
			env: {},
			argv: [],
			cwd(){
				return '/';
			},
			stderr: new LineBuffer(console.warn.bind(console)),
			stdout: new LineBuffer(console.log.bind(console))
		}
	};
	
	if(configContext != null){
		configContext(context);
	}
	
	
	const settable = {};
	
	let proxy = new Proxy(global,{
		set(obj, prop, value){
			settable[prop] = value;
			
			return true;
		},
		get(obj, prop){
			if(prop === 'window'){
				return undefined;
			}
			if(context[prop] != null){
				return context[prop];
			}
			else if(settable[prop] !== undefined){
				return settable[prop];
			}
			else if(obj[prop] != null){
				return obj[prop];
			}
		}
	});
	
	return sass(proxy);
};