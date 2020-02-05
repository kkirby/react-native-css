const sass = require('sass');
const {SlowBuffer,Buffer} = require('buffer');
const {Volume} = require('memfs');

module.exports = ({configContext,mockFileSystem} = {}) => {
	const context = {
		Buffer,
		SlowBuffer,
		fs: Volume.fromJSON(mockFileSystem)
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