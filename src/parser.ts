import csstree from 'css-tree';
import sass from 'sass';

function ensureType<T extends csstree.CssNodePlain>(node: csstree.CssNodePlain,type:string): node is T {
    if(node.type === type){
        return true;
    }
    throw new Error(`Expected node to be of type '${type}', instead got '${node.type}`);
}

type Value = csstree.Dimension | csstree.Percentage | csstree.Identifier | csstree.Operator | csstree.CssNodePlain;

function formatValue(value: Value){
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

function formatProperty(property: string){
	return property.replace(
		/([a-z])-([a-z])/g,
		(whole,left,right) => {
			return left + right.toUpperCase()
		}
	);
}


function formatSelector(selector: csstree.SelectorPlain){
	return csstree.generate(selector)
}

function formatSelectorList(selectorList: csstree.SelectorListPlain){
	return selectorList.children.map(selector => {
		if(ensureType<csstree.SelectorPlain>(selector,"Selector")){
			return formatSelector(selector);
		}
		throw new Error('UGH');
	});
}

function formatDeclaration(declaration: csstree.DeclarationPlain){
	if(ensureType<csstree.ValuePlain>(declaration.value,"Value")){
		let property = formatProperty(declaration.property);
		let value = declaration.value.children;
		if(value.length > 1){
			throw new Error('Only 1 property value allowed.');
		}
		
		return {
			[property]: formatValue(value[0])
		};
	}
	throw new Error('UGH!');
}

function formatBlock(block: csstree.BlockPlain){
    return block.children.reduce(
        (current,declaration) => {
            if(
				ensureType<csstree.DeclarationPlain>(declaration,"Declaration")
			){
				return {
					...current,
					...formatDeclaration(declaration)
				};
			}
			throw new Error('UGH!');
		},
		{}
    )
}

function formatRule(rule: csstree.RulePlain){
    if(ensureType<csstree.SelectorListPlain>(rule.prelude,"SelectorList")){
        return {
            selectors: formatSelectorList(rule.prelude),
            declarations: formatBlock(rule.block)
        };
	}
	throw new Error('UGH!');
}

function formatStyleSheet(stylesheet: csstree.StyleSheetPlain){
    let result: {
		[key: string]: {
			[key: string]: any
		}
	} = {};
    stylesheet.children.forEach(
        (rule) => {
            if(ensureType<csstree.RulePlain>(rule,"Rule")){
                let {selectors,declarations} = formatRule(rule);
			
                selectors.forEach(selector => {
                    result[selector] = {
                        ...(result[selector] || {}),
                        ...declarations
                    }
                });
            }
        }
	);
	
	return result;
}

export default function parseStyles(styles: string){

	let result = sass.renderSync({data: styles});

    let ast = csstree.toPlainObject(
        csstree.parse(result.css.toString(),{
            parseCustomProperty: true
        })
	);
	
    if(ensureType<csstree.StyleSheetPlain>(ast,"StyleSheet")){
        return formatStyleSheet(ast);
	}
	throw new Error('UGH!');
}