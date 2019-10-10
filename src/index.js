import React, {useEffect,useState,useMemo,useRef} from 'react';
import cssAdapter from './adapter';
import CSSselect from './css-select';

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
	if(typeof component === 'function' && component instanceof Function){
		return true;
	}
	else {
		return false;
	}
}

function getStyleForStyleInfo(styleInfo){
	let declarations = {};
	for(let styleFunction of styleFunctions){
		styleFunction(styleInfo,declarations);
	}
	
	return declarations;
}

function pushRuleSets(ruleSets){
	styleFunctions.push(
		...Object.entries(ruleSets).map(
			([selector,declarations]) => {
				let query = CSSselect.compile(selector,{adapter: cssAdapter});
				return (styleInfo,destDeclarations) => {
					if(query(styleInfo)){
						Object.assign(
							destDeclarations,
							declarations
						);
					}
				}
			}
		)
	);
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
	
	const [style,setStyle] = useState({});
	
	useEffect(() => {
		setStyle(
			getStyleForStyleInfo(styleInfo)
		);
	},[styleInfo]);
	
	return {styleInfo,style};
};

function decorateElementForStyles(component,processChildren = false,elementInheritsStyle = false){
	let name = getComponentTag(component);
	if(isFunctionalComponent(component)){
		let Result = (props) => {
			let {parentStyleInfo,...rest} = props;
			let {style,styleInfo} = useStyle(
				name,
				{
					id: rest.id,
					className: rest.className
				},
				parentStyleInfo
			);
			
			style = {
				...style,
				...(rest.style || {})
			};
			
			let element = component({
				...rest,
				style,
				styleInfo
			});
			
			let nextProps = {
				parentStyleInfo: styleInfo,
				...(
					elementInheritsStyle ? {
						style
					} : {}
				)
			}
			
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
		throw new Error('decorateElementForStyles does not support non-functional components.');
	}
}

module.exports = {
	decorateElementForStyles,
	useStyle,
	pushRuleSets
};