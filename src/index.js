const React = require('react');
const {useState,useRef,useLayoutEffect,useMemo,useCallback,useEffect,forwardRef} = React;
const ReactIs = require('react-is');

const cssAdapter = require('./adapter');
const CSSselect = require('css-select');
const {parseCss,parseScss,renderScss} = require('./parser');

const styleFunctions = [];


const styleListeners = new Set();

let styleUpdateTimeout = null;

function emitStyleUpdate(){
	styleUpdateTimeout = null;
	styleListeners.forEach(listener => listener());
}
function onStyleUpdate(){
	if(styleUpdateTimeout != null){
		clearTimeout(styleUpdateTimeout);
	}
	styleUpdateTimeout = setTimeout(emitStyleUpdate,1);
}

function addStyleListener(listener){
	styleListeners.add(listener);

	return () => {
		styleListeners.delete(listener);
	}
}

// based on https://github.com/mridgway/hoist-non-react-statics/blob/master/src/index.js
const hoistBlackList = {
    $$typeof: true,
    render: true,
    compare: true,
    type: true
}

function copyStaticProperties(base,target){
	Object.keys(base).forEach(key => {
		if(base.hasOwnProperty(key) && !hoistBlackList[key]){
			Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(base, key));
		}
	});
}

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
	onStyleUpdate();
}

function importScss(scss,sassConfig){
	pushRuleSets(
		parseScss(scss,sassConfig)
	);
}

function importCss(css){
	pushRuleSets(
		parseCss(css)
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
	const refValue = {
		name,
		selector,
		parent,
		children: [],
		renderedStyle: null
	};
	const styleInfo = useMemo(() => ({
		name,
		selector,
		parent,
		children: [],
		renderedStyle: null
	}),[name,selector.id,selector.className,parent]);

	if(parent != null && parent.children.indexOf(styleInfo) === -1){
		parent.children.push(styleInfo);
	}

	const [styleAndProps,setStyleAndProps] = useState({
		style: {},
		props: {}
	});

	const onUpdate = useCallback(() => {
		setStyleAndProps(
			getStyleAndPropsForStyleInfo(styleInfo)
		);
	},[styleInfo]);

	useLayoutEffect(() => {
		onUpdate();
		return addStyleListener(onUpdate);
	},[onUpdate]);

	return {
		styleInfo,
		styleAndProps
	};
};

function decorateElementForStyles(component,processChildren = false,elementInheritsStyle = false){
	let name = getComponentTag(component);
	if(isFunctionalComponent(component)){
		let Result = (props,ref) => {
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
			
			if(styleAndProps.props.disableRender){
				return null;
			}

			let element = component({
				...styleAndProps.props,
				...restProps,
				__StyleInfo__: styleInfo,
				style
			},ref);

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
		};
		Result.displayName = name + 'Stylized';
		return Result;
	}
	else {
		if(ReactIs.isForwardRef(React.createElement(component))){
			// RenderFn is the inner component of the forwardRef.
			const renderFn = component.render;
			if(typeof renderFn !== 'function'){
				throw new Error('forwardRef render property is not a function.');
			}
			
			// Unwrap the forwardRef
			const wrapperComponent = (props,ref) => renderFn(props,ref);
			wrapperComponent.displayName = getComponentTag(renderFn);
			
			const decoratedComponent = decorateElementForStyles(wrapperComponent,processChildren,elementInheritsStyle);
			
			// Rewrap into forwardRef
			return React.forwardRef(decoratedComponent);;
		}
		else {
			const wrapperComponent = (props) => {
				return React.createElement(
					component,
					props
				);
			}
			wrapperComponent.displayName = name;
			return decorateElementForStyles(wrapperComponent,processChildren,elementInheritsStyle);
		}
	}
}

function resetStyles(){
	styleFunctions.splice(0,styleFunctions.length);
	onStyleUpdate();
}

module.exports = {
	decorateElementForStyles,
	useStyle,
	pushRuleSets,
	importScss,
	importCss,
	renderScss,
	resetStyles,
	// backwards compatability
	updateStyles: pushRuleSets,
	styleComponent(component,processChildren = false){
		return decorateElementForStyles(component,processChildren,true);
	}
};
