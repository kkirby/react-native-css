"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _path2 = _interopRequireDefault(require("path"));

var _generator = require("@babel/generator");

var _helperModuleTransforms = require("@babel/helper-module-transforms");

var _template = _interopRequireDefault(require("@babel/template"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _default(babel) {
  const t = babel.types;
  const plugin = {
    visitor: {
      Program: {
        enter(path, state) {
          const {
            file
          } = state; // Do nothing if React is already declared

          if (path.scope.hasBinding('Styled')) {
            return;
          }

          const ourNode = (0, _template.default)('let IMPORT_NAME = require(SOURCE)')({
            IMPORT_NAME: t.identifier('Styled'),
            SOURCE: t.stringLiteral(_path2.default.join(__dirname, '..', 'react', 'Styled'))
          });
          /*const ourNode = t.importDeclaration([
          	t.importDefaultSpecifier(t.identifier('Styled')),
          ], t.stringLiteral(_path.join(__dirname,'..','react','Styled')));*/
          // Add an import early, so that other plugins get to see it

          file.set('ourPath', path.unshiftContainer('body', ourNode)[0]);
        },

        exit(path, state) {
          const {
            file
          } = state; // If our import is still intact and we haven't encountered any JSX in
          // the program, then we just remove it. There's an edge case, where
          // some other plugin could add JSX in its `Program.exit`, so our
          // `JSXOpeningElement` will trigger only after this method, but it's
          // likely that said plugin will also add a React import too.

          const ourPath = file.get('ourPath');

          if (state.filename.indexOf('AppContainer') > 0) {
            console.log((0, _helperModuleTransforms.isModule)(path), state.filename, path.node.sourceType);
          }

          if (ourPath && !file.get('hasJSX')) {
            if (!ourPath.removed) {
              ourPath.remove();
            }

            file.set('ourPath', undefined);
          }
        }

      },

      ImportDeclaration(path, {
        file
      }) {
        // Return early if this has nothing to do with React
        if (path.node.specifiers.every(x => x.local.name !== 'Styled')) {
          return;
        } // If our import is still intact and we encounter some other import
        // which also imports `React`, then we remove ours.


        const ourPath = file.get('ourPath');

        if (ourPath && path !== ourPath) {
          if (!ourPath.removed) {
            ourPath.remove();
          }

          file.set('ourPath', undefined);
        }
      },

      JSXOpeningElement(_, {
        file
      }) {
        file.set('hasJSX', true);
      }

    }
  };

  if (t.jSXOpeningFragment) {
    plugin.visitor.JSXOpeningFragment = (_, {
      file
    }) => {
      file.set('hasJSX', true);
    };
  }

  return plugin;
}