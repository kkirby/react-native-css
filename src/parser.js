const csstree = require("css-tree");
const sass = require("./sass");

function formatJsInSass(source, theme) {
	let start = 0;
	while (true) {
		let startIndex = source.indexOf("js(", start);
		if (startIndex === -1) {
			break;
		}
		let offset = startIndex + 3;
		let closures = 1;
		let didFind = false;
		while (true) {
			if (offset > source.length) {
				throw new Error("Reached end of document before finding a ;");
			}
			let c = source[offset];
			if (c === "(") {
				closures++;
			} else if (c === ")") {
				closures--;
			} else if (c === ";") {
				if (closures === 0) {
					didFind = true;
					break;
				}
			}
			offset++;
		}
		if (didFind) {
			let cutSource = source.substr(startIndex + 3, offset - 4 - startIndex);
			let section = "";
			if (cutSource.indexOf("theme.") === 0) {
				console.log(cutSource);
				const keys = cutSource.split(".");
				cutSource = theme;

				for (i = 1; i < keys.length; i++) {
					if (cutSource[keys[i]]) {
						cutSource = cutSource[keys[i]];
					} else {
						throw new Error(`Invalid theme path ${keys.join(".")}`);
					}
				}
				section = cutSource;
			} else {
				section = "js:" + cutSource;
			}
			section = JSON.stringify(section).replace(/\\/g, "\\\\");
			source = source.slice(0, startIndex) + section + source.slice(offset);
			start = startIndex + section.length + 1;
		}
	}

	return source;
}

function formatValue(value) {
	if (value.type == "Raw") {
		return value.value;
	} else if (value.type == "Dimension" || value.type == "Number") {
		return parseFloat(value.value);
	} else if (value.type == "Identifier") {
		return value.name;
	} else if (value.type == "Operator") {
		throw new Error(
			"Invalid CSS property value type. Operators are not supported."
		);
	} else if (value.type == "String") {
		if (value.value.indexOf('"js:') === 0) {
			let jsString = JSON.parse(value.value.replace(/\\\\/g, "\\")).slice(3);
			return new Function("", "return " + jsString)();
		} else {
			return JSON.parse(value.value);
		}
	} else {
		return csstree.generate(value);
	}
}

function formatProperty(property) {
	return property.replace(/([a-z])-([a-z])/g, (whole, left, right) => {
		return left + right.toUpperCase();
	});
}

function formatSelector(selector) {
	return csstree.generate(selector);
}

function formatSelectorList(selectorList) {
	return selectorList.children.map(selector => formatSelector(selector));
}

function formatDeclaration(declaration) {
	let property = formatProperty(declaration.property);
	let value = declaration.value;

	if (value.type !== "Raw" && value.children) {
		value = value.children;
		if (value.length > 1) {
			throw new Error("Only 1 property value allowed.");
		}
		value = value[0];
	}

	return {
		[property]: formatValue(value)
	};
}

function formatBlock(block) {
	return block.children.reduce((current, declaration) => {
		return {
			...current,
			...formatDeclaration(declaration)
		};
	}, {});
}

function formatRule(rule) {
	return {
		selectors: formatSelectorList(rule.prelude),
		declarations: formatBlock(rule.block)
	};
}

function formatStyleSheet(stylesheet) {
	let result = {};
	stylesheet.children.forEach(rule => {
		let { selectors, declarations } = formatRule(rule);

		selectors.forEach(selector => {
			result[selector] = {
				...(result[selector] || {}),
				...declarations
			};
		});
	});

	return result;
}

function renderScss(
	styles,
	{ configContext, mockFileSystem, theme, getSassConfig, ...sassConfig } = {}
) {
	const oldConfigContext = configContext;

	configContext = function({ fs, Buffer }) {
		if (typeof oldConfigContext == "function") {
			oldConfigContext.apply(this, arguments);
		}
		const oldReadFile = fs.readFileSync;
		fs.readFileSync = function(pathToFile, options) {
			let result = oldReadFile.apply(this, [pathToFile, options]);
			result = formatJsInSass(result.toString(), theme);

			const encoding =
				options && typeof options === "object" ? options.encoding : options;
			if (encoding) {
				return result;
			} else {
				return Buffer.from(String(result), "utf8");
			}
		};
	};

	styles = formatJsInSass(styles, theme);

	const mergedSassConfig = {
		importer() {
			return "";
		},
		...sassConfig
	};

	const instance = sass({ configContext, mockFileSystem });

	if (typeof getSassConfig === "function") {
		sassConfig = {
			...sassConfig,
			...getSassConfig(instance, styles, {
				configContext,
				mockFileSystem,
				...sassConfig
			})
		};
	}

	return instance.renderSync({ ...sassConfig, data: styles }).css.toString();
}

function parseCss(css) {
	let ast = csstree.toPlainObject(
		csstree.parse(css, {
			parseCustomProperty: true
		})
	);

	return formatStyleSheet(ast);
}

function parseScss(styles, sassConfig) {
	return parseCss(renderScss(styles, sassConfig));
}

module.exports = {
	parseScss,
	parseCss,
	renderScss,
	formatValue
};
