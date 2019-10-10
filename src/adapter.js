export default {
	isTag(node){
		return true;
	},
	existsOne(test,elems){
		throw new Error('Unimplemented!');
	},
	getAttributeValue(styleInfo,name){
		if(name === 'class' || name === 'id'){
			if(name === 'class' && styleInfo.selector.className){
				return styleInfo.selector.className;
			}
			else if(name === 'id' && styleInfo.selector.id){
				return styleInfo.selector.id;
			}
		}
		
		return false;
	},
	getChildren(styleInfo){
		if(styleInfo.length > 0){
			return styleInfo[styleInfo.length - 1].children;
		}
		return false;
	},
	getName(styleInfo){
		return styleInfo ? styleInfo.name.toLowerCase() : false;
	},
	getParent(styleInfo){
		return styleInfo && styleInfo.parent ? styleInfo.parent : false;
	},
	getSiblings(styleInfo){
		return styleInfo && styleInfo.parent ? styleInfo.parent.children : false;
	},
	getText(node){
		throw new Error('Unimplemented!');
	},
	hasAttrib(elem,name){
		throw new Error('Unimplemented!');
	},
	removeSubsets(nodes){
		throw new Error('Unimplemented!');
	},
	findAll(test,nodes){
		throw new Error('Unimplemented!');
	},
	findOne(test,elems){
		throw new Error('Unimplemented!');
	},
	equals(a,b){
		return a === b;
	}
};