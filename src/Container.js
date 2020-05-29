const React = require("react");
const ReactNative = require("react-native");

const Container = ({parentStyleInfo,props,component}) => {
	if(component == null){
		component = ReactNative.View;
	}
	return React.createElement(
		component,
		props,
		props != null ? React.Children.map(props.children, child => {
			if (React.isValidElement(child)) {
				return React.cloneElement(child, {
					parentStyleInfo
				});
			} else {
				return child;
			}
		}) : null
	);
}

module.exports = Container;