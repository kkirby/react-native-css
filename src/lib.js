const React = require("react");
const {
	useState,
	useRef,
	useCallback,
	useEffect
} = React;
const mobx = require('mobx');
const _ = require('lodash');

function useObservableCached(name,value){
	const observable = useRef(null);
	
	if(observable.current == null){
		observable.current = mobx.observable.box(value,{deep: false, name});
	}

	if(!_.isEqual(observable.current.get(),value)){
		observable.current.set(value);
	}

	return observable.current;
}

function useCleanup(fn){
	const cb = useCallback(fn,[]);
	return useEffect(() => cb,[cb]);
};

function useObservableComputed(name,computedFn,deps,useComparison = true,delay = 0){
	const callback = useCallback(computedFn,deps);
	const observable = useRef(null);
	const reaction = useRef(null);
		
	if(observable.current === null){
		observable.current = mobx.observable.box(null,{deep: false, name});
	}
	
	if(reaction.current === null || reaction.current.callback != callback){
		if(reaction.current != null){
			reaction.current.dispose();
			reaction.current = null;
		}
		const reactionDispose = mobx.reaction(
			callback,
			(value) => {
				observable.current.set(value);
			},
			{
				fireImmediately: true,
				name: `${name}_reaction`,
				equals: useComparison ? mobx.comparer.structural : mobx.comparer.default,
				delay
			}
		);
		reaction.current = {
			callback,
			dispose(){
				reactionDispose()
				reaction.current = null;
			}
		};
	}
	
	useCleanup(() => {
		if(reaction.current != null){
			reaction.current.dispose()
		}
	});
	
	return observable.current;
}

function useConvertObservableComputedToState(observableComputed){
	const [state,setState] = useState(observableComputed.get());
	
	useEffect(() => {
		
		setState((v) => {
			const newValue = observableComputed.get();
			if(!_.isEqual(v,newValue)){
				return newValue;
			}
			else {
				return v;
			}
		});
		
		return observableComputed.observe(({newValue}) => {
			setState(newValue);
		});
	},[observableComputed]);
	
	return state;
}

function getComponentTag(component) {
	if (component) {
		if (typeof component === "string") {
			return component.replace(/^RCT/, "");
		} else {
			return (
				component.displayName ||
				component.name ||
				component.constructor.name ||
				"Unknown"
			);
		}
	} else {
		return "Unknown";
	}
}

function isFunctionalComponent(component) {
	if (
		typeof component === "function" &&
		component instanceof Function &&
		Object.getPrototypeOf(component) === Function.prototype
	) {
		return true;
	} else {
		return false;
	}
}

// based on https://github.com/mridgway/hoist-non-react-statics/blob/master/src/index.js
const hoistBlackList = {
	$$typeof: true,
	render: true,
	compare: true,
	type: true
};

function copyStaticProperties(base, target) {
	Object.keys(base).forEach(key => {
		if (base.hasOwnProperty(key) && !hoistBlackList[key]) {
			Object.defineProperty(
				target,
				key,
				Object.getOwnPropertyDescriptor(base, key)
			);
		}
	});
}

function mergeStyles(...styles){
	return styles.map(style => {
		if(style){
			if(!Array.isArray(style)){
				return [style];
			}
			else {
				return style;
			}
		}
		else {
			return [];
		}
	}).reduce((current,next) => {
		return [
			...current,
			next
		];
	},[]);
}



module.exports = {
	useObservableCached,
	useCleanup,
	useObservableComputed,
	useConvertObservableComputedToState,
	getComponentTag,
	isFunctionalComponent,
	copyStaticProperties,
	mergeStyles
};