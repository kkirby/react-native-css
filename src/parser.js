const csstree = require('css-tree');
const sass = require('sass');

function formatValue(value){
	if(value.type == 'Dimension'){
		return parseFloat(value.value);
	}
	else if(value.type == 'Percentage'){
		return value.value;
	}
	else if(value.type == 'Identifier'){
		return value.name;
	}
	else if(value.type == 'Operator'){
		throw new Error('Invalid CSS property value type. Operators are not supported.');
	}
	else {
		return csstree.generate(value);
	}
}

function formatProperty(property){
	return property.replace(
		/([a-z])-([a-z])/g,
		(whole,left,right) => {
			return left + right.toUpperCase()
		}
	);
}


function formatSelector(selector){
	return csstree.generate(selector)
}

function formatSelectorList(selectorList){
	return selectorList.children.map(selector => formatSelector(selector));
}

function formatDeclaration(declaration){
	let property = formatProperty(declaration.property);
	let value = declaration.value.children;
	if(value.length > 1){
		throw new Error('Only 1 property value allowed.');
	}
	
	return {
		[property]: formatValue(value[0])
	};
}

function formatBlock(block){
    return block.children.reduce(
        (current,declaration) => {
			return {
				...current,
				...formatDeclaration(declaration)
			};
		},
		{}
    )
}

function formatRule(rule){
    return {
        selectors: formatSelectorList(rule.prelude),
        declarations: formatBlock(rule.block)
    };
}

function formatStyleSheet(stylesheet){
    let result = {};
    stylesheet.children.forEach(
        (rule) => {
            let {selectors,declarations} = formatRule(rule);
		
            selectors.forEach(selector => {
                result[selector] = {
                    ...(result[selector] || {}),
                    ...declarations
                }
            });
        }
	);
	
	return result;
}

function parseStyles(styles){

	let result = sass.renderSync({data: styles});

    let ast = csstree.toPlainObject(
        csstree.parse(result.css.toString(),{
            parseCustomProperty: true
        })
	);
	
	return formatStyleSheet(ast);
}

module.exports = {
	parseStyles
};