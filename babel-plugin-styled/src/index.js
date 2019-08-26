import _path from 'path';
import {CodeGenerator} from '@babel/generator';
import {
  isModule,
  rewriteModuleStatementsAndPrepareHeader,
  isSideEffectImport,
  buildNamespaceInitStatements,
  ensureStatementsHoisted,
  wrapInterop,
} from "@babel/helper-module-transforms";
import template from '@babel/template';

export default function (babel) {
	const t = babel.types;
	const plugin = {
		visitor: {
			Program: {
				enter(path, state) {
					const {file} = state;
					// Do nothing if React is already declared
					if (path.scope.hasBinding('Styled')) {
						return;
					}
					
					const ourNode = template('let IMPORT_NAME = require(SOURCE)')({
						IMPORT_NAME: t.identifier('Styled'),
						SOURCE: t.stringLiteral(
							_path.join(__dirname,'..','react','Styled')
						)
					});

					/*const ourNode = t.importDeclaration([
						t.importDefaultSpecifier(t.identifier('Styled')),
					], t.stringLiteral(_path.join(__dirname,'..','react','Styled')));*/

					// Add an import early, so that other plugins get to see it
					file.set('ourPath', path.unshiftContainer('body', ourNode)[0]);
				},

				exit(path, state) {
					const {file} = state;
					// If our import is still intact and we haven't encountered any JSX in
					// the program, then we just remove it. There's an edge case, where
					// some other plugin could add JSX in its `Program.exit`, so our
					// `JSXOpeningElement` will trigger only after this method, but it's
					// likely that said plugin will also add a React import too.
					const ourPath = file.get('ourPath');
					if(state.filename.indexOf('AppContainer') > 0){
						console.log(isModule(path),state.filename,path.node.sourceType);
					}
					if (ourPath && !file.get('hasJSX')) {
						if (!ourPath.removed) {
							ourPath.remove();
						}
						file.set('ourPath', undefined);
					}
				},
			},

			ImportDeclaration(path, { file }) {
				// Return early if this has nothing to do with React
				if (path.node.specifiers.every(x => x.local.name !== 'Styled')) {
					return;
				}

				// If our import is still intact and we encounter some other import
				// which also imports `React`, then we remove ours.
				const ourPath = file.get('ourPath');
				if (ourPath && path !== ourPath) {
					if (!ourPath.removed) {
						ourPath.remove();
					}
					file.set('ourPath', undefined);
				}
			},

			JSXOpeningElement(_, { file }) {
				file.set('hasJSX', true);
			},
		},
	};

	if (t.jSXOpeningFragment) {
		plugin.visitor.JSXOpeningFragment = (_, { file }) => {
			file.set('hasJSX', true);
		};
	}

	return plugin;
}