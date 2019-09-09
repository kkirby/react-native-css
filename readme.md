# @gmrmarketing/react-native-css

## Introduction

This library was built to help facitlity styling of react-native components using CSS.

## Usage

    npm install @gmrmarketing/react-native-css --save

In your code:

```javascript

import {styleComponent,updateStyles} from '@gmrmarketing/react-native-css';

let MyComponent = () => {
    // render
}

MyComponent = styleComponent(MyComponent);

updateStyles({
    'MyComponent View': {
        backgroundColor: 'blue'
    }
});
```

## Todo

- [ ] Forward refs
- [ ] Optimize code for re-renders
- [ ] Cache style lookups
- [ ] Create a CSS preprocessor