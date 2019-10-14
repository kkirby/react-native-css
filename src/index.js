const React = require('react');
const {useState,useRef,useEffect} = React;

const cssAdapter = require('./adapter');
const CSSselect = require('css-select');
const parseScss = require('./parser');

const styleFunctions = [];

function getComponentTag(component){
	if(component){
		if(typeof component === 'string'){
			return component.replace(/^RCT/,'');
		}
		else {
			return component.displayName || component.name || component.constructor.name || 'Unknown';
		}
	}
	else {
		return 'Unknown';
	}
}

function isFunctionalComponent(component){
	if(typeof component === 'function' && component instanceof Function && Object.getPrototypeOf(component) === Function.prototype){
		return true;
	}
	else {
		return false;
	}
}

function pushRuleSets(ruleSets){
	styleFunctions.push(
		...Object.entries(ruleSets).map(
			([selector,declarations]) => {
				const styleAndProps = {
					style: {},
					props: {}
				};
				Object.entries(declarations).forEach(([key,value]) => {
					// If the key starts with -- it's a prop.
					if(key.substr(0,2) === '--'){
						styleAndProps.props[key.slice(2)] = value;
					}
					else {
						styleAndProps.style[key] = value;
					}
				});
				const query = CSSselect.compile(selector,{adapter: cssAdapter});
				return (styleInfo) => {
					if(query(styleInfo)){
						return styleAndProps;
					}
					return {
						style: {},
						props: {}
					};
				}
			}
		)
	);
}

function importScss(scss){
	pushRuleSets(
		parseScss(scss)
	);
}

function getStyleAndPropsForStyleInfo(styleInfo){
	const result = {
		style: {},
		props: {}
	};
	
	for(let styleFunction of styleFunctions){
		let styleAndProps = styleFunction(styleInfo);
		Object.assign(
			result.style,
			styleAndProps.style
		);
		Object.assign(
			result.props,
			styleAndProps.props
		);;
	}
	
	return result;
}

function useStyle(name,selector,parent){
	const styleInfoRef = useRef({
		name,
		selector,
		parent,
		children: [],
		renderedStyle: null
	});
	const styleInfo = styleInfoRef.current;
	if(parent != null && parent.children.indexOf(styleInfo) === -1){
		parent.children.push(styleInfo);
	}
	
	const [styleAndProps,setStyleAndProps] = useState({
		style: {},
		props: {}
	});
	
	useEffect(() => {
		setStyleAndProps(
			getStyleAndPropsForStyleInfo(styleInfo)
		);
	},[styleInfo]);
	
	return {
		styleInfo,
		styleAndProps
	};
};

function decorateElementForStyles(component,processChildren = false,elementInheritsStyle = false){
	let name = getComponentTag(component);
	if(isFunctionalComponent(component)){
		let Result = (props) => {
			let {parentStyleInfo,...restProps} = props;
			let {
				styleInfo,
				styleAndProps
			} = useStyle(
				name,
				{
					id: restProps.id,
					className: restProps.className
				},
				parentStyleInfo
			);
			
			let style = {
				...styleAndProps.style,
				...restProps.style
			}
			
			let element = component({
				...styleAndProps.props,
				...restProps,
				style
			});
			
			let nextProps = {
				parentStyleInfo: styleInfo,
				...(
					elementInheritsStyle ? {
						...styleAndProps.props,
						style
					} : {}
				)
			};
			
			if(processChildren){
				let children = React.Children.map(element.props.children,child => {
					if(React.isValidElement(child)){
						return React.cloneElement(child,{
							parentStyleInfo: styleInfo
						});
					}
					else {
						return child;
					}
				});
				
				return React.cloneElement(element,nextProps,children);
				
			}
			else {
				return React.cloneElement(element,nextProps);
			}
		}
		Result.displayName = name + 'Stylized';
		return Result;
	}
	else {
		const ComponentWrapper =  (props) => {
			return React.createElement(
				component,
				props
			);
		};
		ComponentWrapper.displayName = name;
		return decorateElementForStyles(ComponentWrapper,processChildren,elementInheritsStyle);
	}
}

module.exports = {
	decorateElementForStyles,
	useStyle,
	pushRuleSets,
	importScss,
	// backwards compatability
	updateStyles: pushRuleSets,
	styleComponent(component,processChildren = false){
		return decorateElementForStyles(component,processChildren,true);
	}
};