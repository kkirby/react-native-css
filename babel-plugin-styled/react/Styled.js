const React = require('react');
const {StyleSheet} = require('react-native');

console.log(React);



/*const StyledComponent = React.forwardRef(({children,...rest},parentRefProvider) => {
	let context = {
		props: rest
	};
	
	React.useImperativeHandle(
		parentRefProvider,
		() => ({
			context
		})
	);
	
	let ref = React.useRef(context);
	
	let [styles,setStyles] = React.useState();
	React.useEffect(() => {
		
	},[]);
	
	return React.cloneElement(
		React.Children.only(children),
		{
			ref
		}
	);
	
}*/

const styles = StyleSheet.create({
	'a': {
		backgroundColor: 'red'
	},
	b: {
		textTransform: 'uppercase'
	},
	pushTop: {
		marginTop: 40
	}
});

const x2createElement = (...args) => {
	let element = React.createElement(...args);
	let componentName = element.type.displayName || element.type.name || element.type;
	let props = element.props;
	let style = [];
	if(props.classNames){
		props.classNames.forEach(className => {
			if(styles[className] == null)return;
			style.push(styles[className]);
		});
	}
	if(props.style){
		if(Array.isArray(props.style)){
			style = [
				...style,
				...props.style
			];
		}
		else {
			style = [
				...style,
				props.style
			];
		}
	}
	
	let getElement = () => element;
	
	let children = props.children;
	
	let wrapChild = (child) => {
		if(child && React.isValidElement(child)){
			return React.cloneElement(
				child,
				{
					get parentComponent(){
						return element;
					}
				}
			);
		}
		else {
			return child;
		}
	};
	
	if(children){
		if(Array.isArray(children)){
			let count = React.Children.count(children);
			children = React.Children.map(children,wrapChild);
		}
		else if(typeof children === 'function'){
			children = ((original,getElement) => (...args) => {
				return React.cloneElement(
					original(...args),
					{
						get parentComponent(){
							return getElement();
						}
					}
				);
			})(children,getElement);
		}
		else if(React.isValidElement(children)){
			children = wrapChild(React.Children.only(children));
		}
	}
	
	if(children != props.children){
		element = React.cloneElement(
			element,
			{
				...props,
				style
			},
			children
		);
	}
	else {
		element = React.cloneElement(
			element,
			{
				...props,
				style
			}
		);
	}
	
	return element;
};

const xcreateElement = (...args) => {
	const element = React.createElement(...args);
	
	return React.createElement(
		StyledComponent,
		{},
		element
	);
	
};

const createElement = (...args) => {
	const element = React.createElement(...args);
	return element;
}

module.exports = {
	...React,
	createElement
}