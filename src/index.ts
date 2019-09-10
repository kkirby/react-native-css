import React, { ReactElement } from "react";
import cssAdapter from './adapter';
const CSSselect = require('../css-select');

import {
	StylePath,
	ExistingStyles,
	StyleFunction,
	InheritChildStyleContext,
	StyleContext,
	StyleInfoKey,
	Component,
	StyleProps,
	StyledComponent
} from './types';



import {
	getComponentTag,
	isStyleizedComponent,
	isFunctionalComponent,
	isClassComponent,
	isExoticComponent
} from './lib';

let styleFunctions: StyleFunction[] = [];

/**
 * applyStyle 
 */

interface ApplyStyleArgs {
	stylePath: StylePath;
	existingStyles: ExistingStyles;
}

function applyStyle({stylePath,existingStyles}: ApplyStyleArgs){
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

/**
 * mutateChild
 */

interface MutateChildArgs {
	child: React.ReactElement<StyleProps,StyledComponent>;
	styleContext: StyleContext;
	inheritChildStyleContext: InheritChildStyleContext;
	nextStylePath: StylePath;
}

/**
 * mutateChild
 * 
 * Takes a react element and creates a new one
 */
function mutateChild({child,styleContext,inheritChildStyleContext,nextStylePath}: MutateChildArgs): React.ReactElement {
	if(React.isValidElement(child)){
		if(!isStyleizedComponent(child.type)){
			console.warn('A child is not stylized (%s), cascading is broken.',getComponentTag(child.type));
		}
		/**
		 * Create an object for the child to store context info in.
		 * We do this so the parent will know of information about the child.
		 **/
		// @ts-ignore
		let childStyleContext: StyleContext = {};
		inheritChildStyleContext.siblings.push(childStyleContext);
		// Add this child to the style context
		styleContext.children.push(childStyleContext);
		// Clone the child, giving it all the info it needs to succeed.
		return React.cloneElement(
			child,
			{
				[StyleInfoKey]: {
					inheritStyleContext: inheritChildStyleContext,
					styleContext: childStyleContext,
					stylePath: [...nextStylePath]
				}
			}
		);
	}
	else {
		return child;
	}
}

/**
 * applyStyleAndAugmentChildren
 */

interface ApplyStyleAndAugmentChildrenArgs {
	element: React.ReactElement;
	styleContext: StyleContext;
	inheritChildStyleContext: InheritChildStyleContext;
	nextStylePath: StylePath;
}

function applyStyleAndAugmentChildren({element,styleContext,inheritChildStyleContext,nextStylePath}: ApplyStyleAndAugmentChildrenArgs): React.ReactElement {
	let childrenMutable = element.props.children;
	
	// @ts-ignore
	if(childrenMutable != null && !element.type._isStyleized){
		if(!Array.isArray(childrenMutable)){
			childrenMutable = mutateChild({
				child: childrenMutable,
				styleContext,
				inheritChildStyleContext,
				nextStylePath
			});
		}
		else {
			childrenMutable = React.Children.map(
				childrenMutable,
				child => mutateChild({child,styleContext,inheritChildStyleContext,nextStylePath})
			);
		}
	}
	
	return React.cloneElement(
		element,
		{
			style: applyStyle({
				stylePath: nextStylePath,
				existingStyles: element.props.style
			}),
			[StyleInfoKey]: {
				stylePath: nextStylePath,
				inheritChildStyleContext
			}
		},
		childrenMutable
	);
}

/**
 * getContextVariables
 */

interface GetContextVariablesArgProps {
	component: Component;
	props: StyleProps;
}

interface GetContextVariablesReturn {
	stylePath: StylePath;
	styleContext: StyleContext;
	nextStylePath: StylePath;
	inheritChildStyleContext: InheritChildStyleContext;
}

function getContextVariables({component,props}: GetContextVariablesArgProps): GetContextVariablesReturn {
	let stylePath: StylePath = [];
	if(props[StyleInfoKey] != null && props[StyleInfoKey].stylePath != null){
		stylePath = props[StyleInfoKey].stylePath;
	}

	let {className,id} = props;
	let {inheritStyleContext,styleContext} = (props[StyleInfoKey] || {})

	if(styleContext == null){
		// @ts-ignore
		styleContext = {};
	}

	Object.assign(
		styleContext,
		{
			tag: getComponentTag(component),
			className,
			id,
			children: [],
			siblings: [],
			...(inheritStyleContext || {})
		}
	);
	
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
	let inheritChildStyleContext: InheritChildStyleContext = {
		siblings: [],
		parent: styleContext
	};
	
	return {stylePath,styleContext,nextStylePath,inheritChildStyleContext};
}

/**
 * styleComponent
 */
export function styleComponent(component: Component): StyledComponent {
	let tag = getComponentTag(component);
	let res: StyledComponent | null = null;
	
	// Basic functional component, or a react native component (ala RCTView, or View)
	if(
		typeof component === 'function' && Object.getPrototypeOf(component) == Function.prototype ||
		typeof component === 'string' || isExoticComponent(component)
	){
		res = (props: StyleProps) => {
			let {
				styleContext,
				nextStylePath,
				inheritChildStyleContext
			} = getContextVariables({component,props});
			
			let element: React.ReactElement | null = null;
			let nextProps = {
				...props,
				[StyleInfoKey]: {
					stylePath: nextStylePath,
					inheritChildStyleContext
				}
			};
			// Function component
			if(isFunctionalComponent(component)){
				element = (component(nextProps) as React.ReactElement);
			}
			// RCTView, or View, etc
			else {
				element = React.createElement(
					(component as React.ExoticComponent),
					nextProps
				);
			}

			if(element == null){
				throw new Error('wtf');
			}
			
			return applyStyleAndAugmentChildren({
				element,
				styleContext,
				inheritChildStyleContext,
				nextStylePath
			});
		};
	}
	// Class-style component
	else if(isClassComponent(component)){
		class WrappedComponent extends component {
			render(){
				return applyStyleAndAugmentChildren({
					element: (super.render() as ReactElement),
					styleContext: this.props[StyleInfoKey].styleContext,
					inheritChildStyleContext: this.props[StyleInfoKey].inheritChildStyleContext,
					nextStylePath: this.props[StyleInfoKey].stylePath
				});
			}
		}
		
		res = (props: StyleProps) => {
			let {
				styleContext,
				nextStylePath,
				inheritChildStyleContext
			} = getContextVariables({component: component,props});
	
			return React.createElement(
				WrappedComponent,
				{
					...props,
					[StyleInfoKey]: {
						...(props[StyleInfoKey] || {}),
						stylePath: nextStylePath,
						inheritChildStyleContext,
						styleContext
					}
				}
			);
		};
	
	}
	else {
		throw new Error('Invalid component passed to stylizer.');
	}
		
	res.displayName = 'Styled' + tag;
	res._isStyleized = true;

	return res;
}

/**
 * updateStyles
 */

export function updateStyles(styles: {[key: string]: {[key: string]: any}}){
	styleFunctions = Object.entries(styles).map(
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
}