import React from "react";

import {Component,StyledComponent} from './types';
/**
 * getComponentTag
 *
 * Takes a component and returns the string name for that component.
 */
export function getComponentTag(component: Component): string {
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

export function isStyleizedComponent(component: any): component is StyledComponent {
	if(component != null && typeof component._isStyleized !== 'undefined' && component._isStyleized){
		return true;
	}
	else {
		return false;
	}
}

export function isFunctionalComponent(component: Component): component is React.FunctionComponent<any> {
	if(typeof component === 'function' && component instanceof Function){
		return true;
	}
	else {
		return false;
	}
}

export function isClassComponent(component: Component): component is React.ComponentClass<any,any> {
	if(typeof component === 'function' && typeof component.prototype.render === 'function'){
		return true;
	}
	else {
		return false;
	}
}

type IsExoticComponent_TypeCast = {
	render?: (props: Object) => React.ReactElement | null
};

export function isExoticComponent(component: Component): component is React.NamedExoticComponent {
	if(component instanceof Object && component != null){
		let componentTyped = (component as IsExoticComponent_TypeCast);
	 	return componentTyped.render != null && typeof componentTyped.render === 'function';
	}
	else {
		return false;
	}
}