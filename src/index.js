const React = require("react");
const ReactNative = require("react-native");
const {
	useState,
	useRef,
	useLayoutEffect,
	useMemo,
	useCallback,
	useEffect,
	forwardRef
} = React;
const ReactIs = require("react-is");
const mobx = require('mobx');

const cssAdapter = require("./adapter");
const CSSselect = require("css-select");
const { parseCss, parseScss, renderScss } = require("./parser");
const {
	useObservableCached,
	useCleanup,
	useObservableComputed,
	useConvertObservableComputedToState,
	isFunctionalComponent,
	getComponentTag,
	copyStaticProperties,
	mergeStyles
} = require('./lib');
const Container = require('./Container');
const augmentation = require('./augmentation');
const _ = require('lodash');

const styleFunctions = mobx.observable(new Set());

function pushRuleSets(ruleSets) {
	Object.entries(ruleSets).map(([selector, declarations]) => {
		const styleAndProps = {
			style: {},
			props: {}
		};
		Object.entries(declarations).forEach(([key, value]) => {
			// If the key starts with -- it's a prop.
			if (key.substr(0, 2) === "--") {
				styleAndProps.props[key.slice(2)] = value;
			} else {
				styleAndProps.style[key] = value;
			}
		});

		const query = CSSselect.compile(selector, { adapter: cssAdapter });
		return styleInfo => {
			if (query(styleInfo)) {
				return [styleAndProps,selector];
			}
			return [false, false];
		};
	}).forEach(fn => styleFunctions.add(fn));
}

function importScss(scss, sassConfig, theme) {
	pushRuleSets(parseScss(scss, sassConfig, theme));
}

function importCss(css) {
	pushRuleSets(parseCss(css));
}

function getStyleAndPropsForStyleInfo(styleInfo) {
	const result = {
		style: {},
		props: {},
		debugInfo: []
	};

	for (let styleFunction of styleFunctions) {
		let [styleAndProps,selector] = styleFunction(styleInfo);
		if(styleAndProps !== false){
			Object.assign(result.style, styleAndProps.style);
			Object.assign(result.props, styleAndProps.props);
			result.debugInfo.push({
				selector: selector,
				style: styleAndProps.style,
				props: styleAndProps.props
			});
		}
	}

	return result;
}

function useStyle(name, selector, parent) {
	const styleInfo = useMemo(() => {
		return mobx.observable({
			name: null,
			selector: mobx.observable({
				id: null,
				className: null
			},{},{
				deep: false
			}),
			parent: null,
			children: mobx.observable.set(new Set(),{deep: false}),
			get childrenArray(){
				return [...this.children.values()];
			},
			renderedStyle: mobx.observable.map(new Map(),{deep: false}),
			get renderedStyleObject(){
				const parentStyle = this.parent != null ? this.parent.inheritableStyles : {};
				return {
					...parentStyle,
					...(_.fromPairs([...this.renderedStyle.entries()]))
				};
			},
			get inheritableStyles(){
				return _.pick(
					this.renderedStyleObject,
					[
						'textShadowOffset',
						'color',
						'fontSize',
						'fontStyle',
						'fontWeight',
						'lineHeight',
						'textAlign',
						'textDecorationLine',
						'textShadowColor',
						'fontFamily',
						'textShadowRadius',
						'includeFontPadding',
						'textAlignVertical',
						'fontVariant',
						'letterSpacing',
						'textDecorationColor',
						'textDecorationStyle',
						'textTransform',
						'writingDirection'
					]
				);
			}
		},{
			renderedStyleObject: mobx.computed({
				equals: mobx.comparer.structural,
			}),
			inheritableStyles: mobx.computed({
				equals: mobx.comparer.structural
			})
		},{
			deep: false
		});
	},[]);

	styleInfo.name = name;
	styleInfo.selector.id = selector.id;
	styleInfo.selector.className = selector.className;
	styleInfo.parent = parent;

	const styleAndProps = useMemo(() => {
		return mobx.observable({
			style: mobx.observable.map(new Map(),{deep: false}),
			props: mobx.observable.map(new Map(),{deep: false}),
			parent: null,
			get styleObject(){
				return _.fromPairs([...this.style.entries()]);
			},
			get propsObject(){
				return _.fromPairs([...this.props.entries()]);
			},
			get styleWithInheirted(){
				const parentStyle = this.parent != null ? this.parent.inheritableStyles : {};
				return {
					...parentStyle,
					...this.styleObject
				};
			}
			
		},{
			styleObject: mobx.computed({
				equals: mobx.comparer.structural
			}),
			propsObject: mobx.computed({
				equals: mobx.comparer.structural
			}),
			styleWithInheirted: mobx.computed({
				equals: mobx.comparer.structural
			})
		},{
			deep: false
		});
	},[]);
	
	styleAndProps.parent = parent;
	
	if(parent != null && typeof parent.children.has !== 'function'){
		debugger;
	}
	if (parent != null && !parent.children.has(styleInfo)) {
		parent.children.add(styleInfo);
	}
	
	const fetchStylesAndProps = useCallback(() => {
		return getStyleAndPropsForStyleInfo(styleInfo);
	}, [styleInfo]);
	
	const onStylesAndPropsUpdated = useCallback((result) => {
		styleInfo.renderedStyle.replace(result.style);

		styleAndProps.style.replace(result.style);
		styleAndProps.props.replace(result.props);
	},[styleInfo,styleAndProps]);

	useLayoutEffect(() => {
		return mobx.reaction(
			fetchStylesAndProps,
			onStylesAndPropsUpdated,
			{
				fireImmediately: true,
				delay: 1
			}
		);
	}, [fetchStylesAndProps,onStylesAndPropsUpdated]);

	return {
		styleInfo: styleInfo,
		styleAndProps: styleAndProps
	};
}

function processAlwaysContainer(name,component,props,ref){
	const {parentStyleInfo,id,className,style,...restProps} = props;
	
	augmentation.start();
	
	let element = component(
		props,
		ref
	);
	
	augmentation.end(element);

	if(element.type !== Container){
		console.warn(`Element returned from ${name} is not a container!`,new Error().stack);
		return false;
	}
	
	const restPropsObservable = useObservableCached('restProps',restProps);
	const restStyleObservable = useObservableCached('restStyle',style);
	const elementPropsObservable = useObservableComputed('elementProps',() => {
		return _.omit(element.props,'style');
	},[element.props]);
	const elementStyleObservable = useObservableCached('elementStyle',element.props.style);

	const info = {
		id: id != null ? id : (element.props.id != null ? element.props.id : ''),
		className: [
			className,
			element.props.className != null ? element.props.className : ''
		].join(' ').trim()
	};

	let { styleInfo, styleAndProps, debugInfo } = useStyle(
		name,
		info,
		parentStyleInfo
	);
	
	const mergedStyleObservable = useObservableComputed(
		'processAlwaysContainer.mergedStyle',
		() => {
			return mergeStyles(
				styleAndProps.styleWithInheirted,
				elementStyleObservable.get(),
				restStyleObservable.get(),
			);
		},
		[styleAndProps,elementStyleObservable,restStyleObservable]
	);
	
	const componentProps = useConvertObservableComputedToState(
		useObservableComputed(
			'processAlwaysContainer.props',
			() => {
				return {
					parentStyleInfo: styleInfo,
					props: {
						style: mergedStyleObservable.get(),
						...styleAndProps.propsObject,
						...elementPropsObservable.get()
					}
				};
			},
			[styleAndProps,mergedStyleObservable,elementPropsObservable,restPropsObservable]
		)
	);

	return React.cloneElement(
		element,
		componentProps,
		props.children
	);
}

function decorateElementForStyles(
	component,
	processChildren = false,
	elementInheritsStyle = false,
	alwaysContainer = false
) {
	let name = getComponentTag(component);
	if (isFunctionalComponent(component)) {
		let Result = (props, ref) => {
			const mobxNameArr = [name];
			if(props.id != null){
				mobxNameArr.push(props.id);
			}
			const mobxName = (() => (n) => mobxNameArr.join('_') + '_' + n)();
				
			if(alwaysContainer){
				const res = processAlwaysContainer(name,component,props,ref);
				if(res !== false){
					return res;
				}
			}

			let { parentStyleInfo, ...restProps } = props;
			let { styleInfo, styleAndProps, debugInfo } = useStyle(
				name,
				{
					id: restProps.id,
					className: restProps.className
				},
				parentStyleInfo
			);
			
			const restPropsObservable = useObservableCached('restProps',restProps);
			const restStyle = useObservableCached('restStyle',restProps.style);

			const mergedStyle = useObservableComputed(
				mobxName('mergedStyle'),
				() => {
					return mergeStyles(
						styleAndProps.styleWithInheirted,
						restStyle.get()
					);
				},
				[styleAndProps,restStyle]
			);
			
			const componentProps = useConvertObservableComputedToState(
				useObservableComputed(
					mobxName('props'),
					() => {
						return {
							...styleAndProps.propsObject,
							...restPropsObservable.get(),
							style: mergedStyle.get(),
							__StyleInfo__: styleInfo
						};
					},
					[styleAndProps,restPropsObservable,mergedStyle,styleInfo]
				)
			);
			
			augmentation.start();
			
			const element = component(
				componentProps,
				ref
			);
			
			augmentation.end(element);

			const inheritedProps = useConvertObservableComputedToState(
				useObservableComputed(
					mobxName('inheritedProps'),
					() => {
						return {
							parentStyleInfo: styleInfo,
							...(
								elementInheritsStyle ? {
									...styleAndProps.propsObject,
									style: mergedStyle.get()
								} : {}
							)
						};
					},
					[
						styleInfo,
						elementInheritsStyle,
						styleAndProps,
						mergedStyle
					]
				)
			);

			if (processChildren) {
				let children = React.Children.map(element.props.children, child => {
					if (React.isValidElement(child)) {
						return React.cloneElement(child, {
							parentStyleInfo: styleInfo
						});
					} else {
						return child;
					}
				});

				return React.cloneElement(element, inheritedProps, children);
			} else {
				return React.cloneElement(element, inheritedProps);
			}
			
			return result;
		};
		
		copyStaticProperties(component,Result);
		
		Result.displayName = name + "Stylized";
		
		return Result;
	} else {
		if (ReactIs.isForwardRef(React.createElement(component))) {
			// RenderFn is the inner component of the forwardRef.
			const renderFn = component.render;
			if (typeof renderFn !== "function") {
				throw new Error("forwardRef render property is not a function.");
			}

			// Unwrap the forwardRef
			const wrapperComponent = (props, ref) => renderFn(props, ref);
			wrapperComponent.displayName = getComponentTag(renderFn);

			const decoratedComponent = decorateElementForStyles(
				wrapperComponent,
				processChildren,
				elementInheritsStyle
			);

			// Rewrap into forwardRef
			return React.forwardRef(decoratedComponent);
		} else {
			const wrapperComponent = props => {
				return React.createElement(component, props);
			};
			copyStaticProperties(component,wrapperComponent);
			return decorateElementForStyles(
				wrapperComponent,
				processChildren,
				elementInheritsStyle
			);
		}
	}
}

const styleContainer = (component) => {
	return decorateElementForStyles(component,false,false,true);
}

function resetStyles() {
	styleFunctions.clear();
}

module.exports = {
	Container,
	decorateElementForStyles,
	useStyle,
	pushRuleSets,
	importScss,
	importCss,
	renderScss,
	resetStyles,
	styleContainer,
	// backwards compatability
	updateStyles: pushRuleSets,
	styleComponent(component, processChildren = false) {
		return decorateElementForStyles(component, processChildren, true);
	},
	setAugmentationStatus: augmentation.setAugmentationStatus.bind(augmentation),
	addAugmentation: augmentation.addAugmentation.bind(augmentation)
};
