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

const DEBUG_CSS_ADAPTER = false;


let cssAdapter = {
	isTag(node){
		DEBUG_CSS_ADAPTER && console.log('isTag',node);
		return true;
	},
	existsOne(test,elems){
		DEBUG_CSS_ADAPTER && console.log('existsOne',{test,elems});
	},
	getAttributeValue(stylePath,name){
		DEBUG_CSS_ADAPTER && console.log('getAttributeValue',{stylePath,name});
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
	getChildren(node){
		DEBUG_CSS_ADAPTER && console.log('getChildren',{node});
	},
	getName(stylePath){
		DEBUG_CSS_ADAPTER && console.log('getName',{stylePath});
		let current = stylePath[stylePath.length - 1];
		return current.tag.toLowerCase();
	},
	getParent(stylePath){
		DEBUG_CSS_ADAPTER && console.log('getParent',{stylePath});
		if(stylePath.length > 1){
			return stylePath.slice(0,-1);
		}
		else {
			return false;
		}
	},
	getSiblings(stylePath){
		DEBUG_CSS_ADAPTER && console.log('getSiblings',{stylePath});
		if(stylePath.length > 0){
			return stylePath[stylePath.length - 1].siblings;
		}
		else {
			return false;
		}
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
		
		
		function formatArg(arg){
			if(Array.isArray(arg)){
				arg = arg[arg.length - 1]
			}
			
			if(typeof arg !== 'object'){
				throw new Error('Unsupported equals operation. Arg is of unknown type.');
			}
			
			return arg;
		}
		
		let left = formatArg(a);
		let right = formatArg(b);
		
		DEBUG_CSS_ADAPTER && console.log('equals',{a,b},{left,right},left === right);
		
		return left === right;
	}
};

let styles = {
	'View.testNth:nth-child(2) View:nth-child(1)': {
		backgroundColor: 'red',
		width: 100,
		height: 100
	},
	'View.testNth:nth-child(3) View:nth-child(2)': {
		backgroundColor: 'blue',
		width: 100,
		height: 100
	},
	'Text:not(.errorMessages)': {
		fontSize: 30
	},
	'.errorMessages': {
		marginTop: 35
	},
	'.error': {
		margin: 15
	},
	'.errorMessages ErrorMessage .message': {
		marginTop: 15
	},
	'.errorMessages ErrorMessage:nth-child(1)': {
		backgroundColor: 'pink'
	},
	'.errorMessages ErrorMessage:nth-child(2)': {
		backgroundColor: 'yellow'
	},
	'.errorMessages .error .message': {
		fontSize: 15,
		color: 'red'
	},
	'.errorMessages ErrorMessage:nth-child(2) .message': {
		fontSize: 15,
		color: 'blue'
	},
	'.stuff Text': {
		color: 'purple'
	}
};

let styleFunctions = Object.entries(styles).map(
	([selector,style]) => {
		let query = CSSselect.compile(selector,{adapter: cssAdapter});
		return (...args) => {
			if(query(...args)){
				return style;
			}
			return false;
		}
	}
);

function applyStyle(stylePath,existingStyles,debug){
	let style = [];
	for(let styleFunction of styleFunctions){
		let s = styleFunction(stylePath);
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
	
	return style;
}

function getComponentTag(component){
	if(component){
		return component.displayName || component.name || component.constructor.name || 'Unknown';
	}
	else {
		return 'Unknown';
	}
}

function generateContextFromProps(component,props,mutateProps = false){
	let {inheritStyleContext,styleContext,children,className,siblings,id} = props;
	
	if(!styleContext){
		styleContext = {};
	}
	
	if(mutateProps){
		delete props.styleContext;
		delete props.stylePath;
		delete props.className;
		delete props.siblings;
		delete props.id;
	}
	
	// Each tag needs a unique ID. We either use one that was passed in or generate on.
	// The reason we need a unique ID is to be able to compare components.
	if(!id){
		id = 'ID' + uuidv1().toUpperCase().replace(/\-/g,'');
	}
	
	Object.assign(styleContext,{
		tag: getComponentTag(component),
		id,
		className,
		children: [],
		siblings: [],
		...(inheritStyleContext || {})
	});
	
	return styleContext;
}

function styleComponent(Component){
	let tag = getComponentTag(Component);
	let res = ({stylePath,debug,...props}) => {
		if(stylePath == null){
			stylePath = [];
		}
		
		let styleContext = generateContextFromProps(Component,props,true);
		/**
		 * The style path is an array of parents to self. Each component will have a style path.
		 * When a component is wrapped, we take the input style path, and generate a new one, appending
		 * a styleContext to the path. This new path is passed to children.
		 **/
		let nextStylePath = [...stylePath,styleContext];
		
		/**
		 * Each child must inherit some basic info that is shared among children. Specifically the
		 * parent and their siblings. Everything else the child will derive themselves.
		 **/
		let inheritChildStyleContext = {
			siblings: [],
			parent: styleContext
		};
		
		let cloneElement = (child) => {
			/**
			 * Create an object for the child to store context info in.
			 * We do this so the parent will know of information about the child.
			 **/
			let childStyleContext = {};
			inheritChildStyleContext.siblings.push(childStyleContext);
			// Add this child to the style context
			styleContext.children.push(childStyleContext);
			// Clone the child, giving it all the info it needs to succeed.
			return React.cloneElement(
				child,
				{
					id: child.props.id || 'ID' + uuidv1().toUpperCase().replace(/-/g,''),
					inheritStyleContext: inheritChildStyleContext,
					styleContext: childStyleContext,
					stylePath: [...nextStylePath]
				}
			);
		}
		
		if(typeof Component === 'function'){
			let result = Component({
				stylePath: nextStylePath,
				...props
			});
			
			let childrenMutable = result.props.children;
			if(!Array.isArray(childrenMutable)){
				childrenMutable = [childrenMutable];
			}
			childrenMutable = React.Children.map(
				childrenMutable,
				child => {
					if(React.isValidElement(child)){
						return cloneElement(child);
					}
					else {
						return child;
					}
				}
			);

			return React.cloneElement(
				result,
				{
					stylePath: nextStylePath,
					style: applyStyle(nextStylePath,props.style,debug)
				},
				childrenMutable
			);
		}
		else {
			/**
			 * This is not the correct way to handle class components. The children being passed in aren't guranteed
			 * to be the same as the output.
			 * We need to extend the previous component and override render, grabbing the children and wrapping them.
			 **/
			
			let childrenMutable = props.children;
			if(!Array.isArray(childrenMutable)){
				childrenMutable = [childrenMutable];
			}
			childrenMutable = React.Children.map(
				childrenMutable,
				child => {
					if(React.isValidElement(child)){
						return cloneElement(child);
					}
					else {
						return child;
					}
				}
			);
			return <Component {...props} stylePath={nextStylePath} style={applyStyle(nextStylePath,props.style,debug)}>
				{childrenMutable}
			</Component>
		}
	};
	
	res.displayName = tag;
	
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
	let stuff = [];
	for(let i = 0; i < 10; i++){
		stuff.push(children('This is a message (' + i + ').' + "\n",i));
	}
	return <View className="stuff">{stuff}</View>;
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
	return <>
		<View id="A">
			<FnTest>{(message,i) => <Text key={i}>Before{message}After</Text>}</FnTest>
			<View className="errorMessages">
				<ErrorMessage header="Error!" message="This is only a test."/>
				<ErrorMessage header="Error (2)!" message="This is only a test (2)."/>
			</View>
			<View id="A.B" className="testNth">
				<View id="A.B.A">
					<Text>A.B.A</Text>
				</View>
				<View id="A.B.B">
					<Text>A.B.B</Text>
				</View>
			</View>
			<View id="B.B" className="testNth">
				<View id="B.B.A">
					<Text>B.B.A</Text>
				</View>
				<View id="B.B.B">
					<Text>B.B.B</Text>
				</View>
			</View>
		</View>
	</>;
}


export default App;
