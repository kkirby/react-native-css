const TestRenderer = require('react-test-renderer');
const React = require('react');

function render(elm){
	return TestRenderer.create(elm).toJSON();
}

/**
 * Things to test:
 * forwardRef
 * class components
 * function components
 * container components
 **/