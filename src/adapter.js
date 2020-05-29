module.exports = {
	isTag(node){
		return true;
	},
	existsOne(test,elems){
		return elems.some(test);
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
		if(Array.isArray(styleInfo)){
			if(styleInfo.length > 0){
				styleInfo = styleInfo[styleInfo.length - 1];
			}
			else {
				styleInfo = null;
			}
		}
		if(styleInfo != null){
			return styleInfo.childrenArray;
		}
		return [];
	},
	getName(styleInfo){
		return styleInfo ? styleInfo.name.toLowerCase() : false;
	},
	getParent(styleInfo){
		return styleInfo && styleInfo.parent ? styleInfo.parent : false;
	},
	getSiblings(styleInfo){
		return styleInfo && styleInfo.parent ? styleInfo.parent.childrenArray : false;
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
		return nodes.filter(test);
	},
	findOne(test,elems){
		return nodes.find(test);
	},
	equals(a,b){
		return a === b;
	}
};