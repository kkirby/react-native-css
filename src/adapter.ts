export default {
	isTag(node: any){
		return true;
	},
	existsOne(test: any,elems: any){
		throw new Error('Unimplemented!');
	},
	getAttributeValue(stylePath: any,name: any){
		if(name === 'class' || name === 'id'){
			let current = stylePath[stylePath.length - 1];
			if(name === 'class' && current.className){
				return current.className;
			}
			else if(name === 'id' && current.id){
				return current.id;
			}
		}
		
		return false;
	},
	getChildren(stylePath: any){
		if(stylePath.length > 0){
			return stylePath[stylePath.length - 1].children;
		}
		return false;
	},
	getName(stylePath: any){
		if(stylePath.length > 0){
			return stylePath[stylePath.length - 1].tag.toLowerCase();
		}
	},
	getParent(stylePath: any){
		if(stylePath.length > 1){
			return stylePath.slice(0,-1);
		}
		else {
			return false;
		}
	},
	getSiblings(stylePath: any){
		if(stylePath.length > 0){
			return stylePath[stylePath.length - 2].children;
		}
		else {
			return false;
		}
	},
	getText(node: any){
		throw new Error('Unimplemented!');
	},
	hasAttrib(elem: any,name: any){
		throw new Error('Unimplemented!');
	},
	removeSubsets(nodes: any){
		throw new Error('Unimplemented!');
	},
	findAll(test: any,nodes: any){
		throw new Error('Unimplemented!');
	},
	findOne(test: any,elems: any){
		throw new Error('Unimplemented!');
	},
	equals(a: any,b: any){
		function formatArg(arg: any){
			if(Array.isArray(arg)){
				arg = arg[arg.length - 1]
			}
			
			if(typeof arg !== 'object'){
				throw new Error('Unsupported equals operation. Arg is of unknown type.');
			}
			
			return arg;
		}
		
		return formatArg(a) === formatArg(b);
	}
};