/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */


import React from 'react';

import * as ReactNative from 'react-native';

import CSSselect from "css-select";

import uuidv1 from 'uuid/v4';

const DEBUG_CSS_ADAPTER = true;


let cssAdapter = {
	isTag(node){
		DEBUG_CSS_ADAPTER && console.log('isTag',node);
		return true;
	},
	existsOne(test,elems){
		DEBUG_CSS_ADAPTER && console.log('existsOne',{test,elems});
	},
	getAttributeValue({stylePath},name){
		DEBUG_CSS_ADAPTER && console.log('getAttributeValue',{stylePath,name});
		if(name === 'class' || name === 'id'){
			let current = stylePath[stylePath.length - 1];
			let [whole,tag,id,classes] = /^([^#\.]+)(#[^\.$]+)?((?:\.[^\.$]+)*)$/.exec(current);
			if(name === 'class' && classes){
				return classes.replace(/\./g,' ').trim().split(' ')
			}
			else if(name === 'id' && id){
				return id.slice(1);
			}
		}
		
		return false;
	},
	getChildren(node){
		DEBUG_CSS_ADAPTER && console.log('getChildren',{node});
	},
	getName({stylePath}){
		DEBUG_CSS_ADAPTER && console.log('getName',{stylePath});
		let current = stylePath[stylePath.length - 1];
		let [whole,tag,id,classes] = /^([^#\.]+)(#[^\.$]+)?((?:\.[^\.$]+)*)$/.exec(current);
		return tag.toLowerCase();
	},
	getParent({stylePath}){
		DEBUG_CSS_ADAPTER && console.log('getParent',{stylePath});
		if(stylePath.length > 1){
			return {
				stylePath: [...stylePath].slice(0,-1),
				siblings: []
			};
		}
		else {
			return false;
		}
	},
	getSiblings({stylePath,siblings}){
		DEBUG_CSS_ADAPTER && console.log('getSiblings',{stylePath,siblings});
		return siblings || [];
	},
	getText(node){
		DEBUG_CSS_ADAPTER && console.log('getText',{node});
	},
	hasAttrib(elem,name){
		DEBUG_CSS_ADAPTER && console.log('hasAttrib',{elem,name});
	},
	removeSubsets(nodes){
		DEBUG_CSS_ADAPTER && console.log('removeSubsets',{nodes});
	},
	findAll(test,nodes){
		DEBUG_CSS_ADAPTER && console.log('findAll',{test,nodes});
	},
	findOne(test,elems){
		DEBUG_CSS_ADAPTER && console.log('findOne',{test,elems});
	},
	equals(a,b){
		DEBUG_CSS_ADAPTER && console.log('equals',{a,b});
		
		function formatArg(arg){
			if(typeof arg === 'object' && arg.stylePath){
				arg = arg.stylePath;
			}
		
			if(Array.isArray(arg)){
				arg = arg.join(' ');
			}
			
			if(typeof arg !== 'string'){
				throw new Error('Unsupported equals operation. Arg is of unknown type.');
			}
			
			return arg;
		}
		
		let left = formatArg(a);
		let right = formatArg(b);
		
		console.log({left,right});
		
		return left === right;
	}
};

let styles = {
	//'#A': {
	//	margin: 40
	//},
	//'ErrorMessage:nth-child(1)': {
	//	padding: 15
	//},
	'ErrorMessage:nth-child(1) .header': {
		fontSize: 30,
		color: 'red'
	},
	//'ErrorMessage:nth-child(1) .message': {
	//	marginTop: 15
	//},
	//'ErrorMessage:nth-child(1)': {
	//	backgroundColor: 'pink'
	//},
	/*'.error .message': {
		fontSize: 15,
		color: 'red'
	},
	'Text': {
		fontSize: 15
	},
	'#A Abc Text': {
		color: 'purple'
	},
	'View': {
		margin: 15
	},
	'#B .enabled Text': {
		color: 'red'
	},
	'#A #B .disabled Text': {
		color: 'blue'
	},
	'.enabled FnTest View.stuff Text': {
		textTransform: 'uppercase'
	},
	'View:last-child': {
		backgroundColor: 'pink'
	},
	'Text:nth-child(2)': {
		fontSize: 50
	}*/
};

let styleFunctions = Object.entries(styles).map(
	([selector,style]) => {
		let query = CSSselect.compile(selector,{adapter:cssAdapter});
		return (...args) => {
			
			
			if(query(...args)){
				//console.log('Query: "%s" Against: "%s" passed',args[0].join(' '),selector);
				return style;
			}
			else {
				//console.log('Query: "%s" Against: "%s" failed',selector,args[0].join(' '));
				return false;
			}
		}
	}
);

function applyStyle(stylePath,siblings,existingStyles,debug){
	let style = [];
	for(let styleFunction of styleFunctions){
		if(debug){
			debugger;
		}
		let s = styleFunction({stylePath,siblings});
		if(s !== false){
			style.push(s);
		}
	}
	
	if(existingStyles){
		if(!Array.isArray(existingStyles)){
			existingStyles = [existingStyles];
		}
		style = [
			...style,
			...existingStyles
		];
	}
	
	if(style.length > 0){
		console.log('applyStyle:',stylePath,style);
	}
	else {
		console.log(stylePath);
	}
	
	return style;
}

function styleComponent(Component){
	let componentName = Component.displayName || Component.name || Component.constructor.name || 'Unknown';
	let res = ({children,stylePath,className,siblings,id,debug,...props}) => {
		if(!id){
			id = 'ID' + uuidv1().toUpperCase().replace(/\-/g,'');
		}
		if(!stylePath){
			stylePath = [];
		}
		let styleSpec = [];
		styleSpec.push(componentName);
		if(id){
			styleSpec.push('#' + id);
		}
		if(Array.isArray(className)){
			styleSpec = [...styleSpec,className.map(c => '.' + c)];
		}
		else if(typeof className === 'string'){
			styleSpec = [...styleSpec,'.' + className];
		}
		let nextStylePath = [...stylePath,styleSpec.join('')];
		if(!Array.isArray(children)){
			if(children){
				children = [children];
			}
			else {
				children = [];
			}
		}
		
		let childSiblings = [];
		
		let cloneElement = (child) => {
			let childId = 'ID' + uuidv1().toUpperCase().replace(/-/g,'');
			return React.cloneElement(
				child,
				{
					id: child.props.id || childId,
					stylePath: [...nextStylePath],
					siblings: childSiblings
				}
			);
		}
		
		function generateStylePathForChild(child){
			if(typeof child === 'string'){
				return [...nextStylePath].join(' ');
			}
			else {
				let type = child.type;
				if(type){
					type = type.displayName || type.name || type.constructor.name || 'Unknown';
				}
				else {
					type = 'Unknown';
				}
				type = [type,'#' + child.props.id];
				if(child.props.className){
					if(Array.isArray(child.props.className)){
						type = [...type,child.props.className.map(c => '.' + c)];
					}
				}
				return [...nextStylePath,type.join('')].join(' ');
			}
		}
		
		let childrenMutable = children;
		if(Array.isArray(childrenMutable)){
			childrenMutable = React.Children.map(
				children,
				child => {
					if(React.isValidElement(child)){
						return cloneElement(child);
					}
					else {
						return child;
					}
				}
			);
			if(childrenMutable.length != children.length){
				childrenMutable = children;
				childSiblings.push('Idunno2');
			}
			else {
				childrenMutable.forEach(child => {
					childSiblings.push(generateStylePathForChild(child));
				});
			}
		}
		else if(React.isValidElement(childrenMutable)){
			childrenMutable = cloneElement(childrenMutable);
			let stylePath = generateStylePathForChild(childrenMutable);
			childSiblings.push(stylePath);
		}
		else {
			childSiblings.push('Idunno');
		}
		
		if(typeof Component === 'function'){
			let result = Component({
				children: childrenMutable,
				siblings: siblings,
				stylePath: nextStylePath,
				...props
			});
			
			let res = React.cloneElement(
				result,
				{
					stylePath: nextStylePath,
					siblings: siblings,
					style: applyStyle(nextStylePath,siblings,props.style,debug)
				}
			);
			
			return res;
		}
		
		return <Component {...props} siblings={siblings} stylePath={nextStylePath} style={applyStyle(nextStylePath,siblings,props.style,debug)}>
			{childrenMutable}
		</Component>
	};
	
	res.displayName = componentName;
	
	return res;
}

let View = styleComponent(ReactNative.View);
let Text = styleComponent(ReactNative.Text);

let Abc = ({...props}) => {
	return <View>
		<Text>Abc</Text>
	</View>;
};

let ChildTest = ({...props}) => {
	return <View className="ChildTestStuff">
		<Text>This is a test</Text>
		<Text>This is a test2</Text>
		<Abc/>
	</View>
};

let FnTest = ({children,...props}) => {
	return <View className="stuff">{children[0]('This is a message.')}</View>;
}

Abc = styleComponent(Abc);
ChildTest = styleComponent(ChildTest);
FnTest = styleComponent(FnTest);

let ErrorMessage = ({header,message}) => (
	<View className="error">
		<Text className="header">
			{header}
		</Text>
		<Text className="message">
			{message}
		</Text>
	</View>
);
ErrorMessage = styleComponent(ErrorMessage);

const App = () => {
	/*			*/
	return <>
		<View id="A">
			<ErrorMessage header="Error!" message="This is only a test."/>
			<ErrorMessage header="Error 2!" message="This is only a test 2."/>
		</View>
	</>;
}


export default App;
