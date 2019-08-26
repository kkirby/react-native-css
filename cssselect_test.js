const CSSselect = require("css-select");
let c = CSSselect.compile('a #hello:nth-child(2)',{
	adapter: {
		isTag(node){
			console.log('isTag',node);
			return true;
		},
		existsOne(test,elems){
			console.log('existsOne',{test,elems});
		},
		getAttributeValue(elem,name){
			console.log('getAttributeValue',{elem,name});
			if(name === 'class' || name === 'id'){
				let current = elem[elem.length - 1];
				let [whole,tag,id,classes] = /^([^#\.]+)(#[^\.$]+)?((?:\.[^\.$]+)*)$/.exec(current);
				if(name === 'class'){
					if(classes){
						return classes.replace(/\./g,' ').trim().split(' ')
					}
				}
				else if(name === 'id'){
					return id.slice(1);
				}
			}
			
			return false;
		},
		getChildren(node){
			console.log('getChildren',{node});
		},
		getName(elem){
			console.log('getName',{elem});
			let current = elem[elem.length - 1];
			let [whole,tag,id,classes] = /^([^#\.]+)(#[^\.$]+)?((?:\.[^\.$]+)*)$/.exec(current);
			
			return tag;
		},
		getParent(node){
			console.log('getParent',{node});
			if(node.length > 1){
				return [...node].slice(0,-1);
			}
			else {
				return false;
			}
		},
		getSiblings(node){
			console.log('getSiblings',{node});
		},
		getText(node){
			console.log('getText',{node});
		},
		hasAttrib(elem,name){
			console.log('hasAttrib',{elem,name});
		},
		removeSubsets(nodes){
			console.log('removeSubsets',{nodes});
		},
		findAll(test,nodes){
			console.log('findAll',{test,nodes});
		},
		findOne(test,elems){
			console.log('findOne',{test,elems});
		},
		equals(a,b){
			console.log('equals',{a,b});
		}
	}
});
console.log('matches: ',c('a c b d abc#hello.enabled'.split(' ')));