# redux-easy

This is a set of utility functions that make it easier to use Redux.

## Benefits

* No string constants are needed for action types.
* A reducer function that switches on action type is not needed.
* The dispatch function is accessed through a simple import rather than
  using the react-redux `connect` and `mapDispatchToProps` functions.
* Actions can be dispatched by providing just a type and payload
  rather than an action object.
* Each action type is handled by a single reducer function
  that is registered by action type and is simple to write.
* Simple actions that merely set a property value in the state
  (the most common kind) can be dispatched without writing
  reducer functions (see `dispatchSet`).
* All objects in the Redux state are automatically frozen
  to prevent accidental state modification.
* Asynchronous actions are handled in a simple way
  without requiring middleware or thunks.
* The complexity of nested/combined reducers can be bypassed.
* Redux state is automatically saved in `sessionStorage`
  (on every state change, but limited to once per second).
* Redux state is automatically loaded from `sessionStorage`
  when the browser is refreshed to avoid losing state.
* Integration with redux-devtools is automatically configured.

## Example app

See https://github.com/mvolkmann/redux-easy-greeting-card.
For comparison, the same app using standard Redux is at
https://github.com/mvolkmann/redux-greeting-card.

## Setup

In the topmost source file, likely named `index.js`,
add the following which assumes the topmost component is `App`:

```js
import React from 'react';
import {reduxSetup} from 'redux-easy';
import App from './App';
import './reducers'; // described next

const initialState = {
  user: {firstName: ''}
};

// The specified component is rendered in the element with id "root"
// unles the "target" option is specified.
reduxSetup({component: <App />, initialState});
```

Create `reducers.js` containing something like the following:

```js
import {addReducer} from 'redux-easy';

// Call addReducer once for each action type, giving it the
// function to be invoked when that action type is dispatched.
// These functions must return the new state
// and cannot modify the existing state.
addReducer('addToAge', (state, years) => {
  const {user} = state;
  return {
    ...state,
    user: {
      ...user,
      age: user.age + years
    }
  };
});
```

If the application requires a large number of reducer functions,
they can be implemented in multiple files,
perhaps grouping related reducer functions together.

In components that need to dispatch actions,
do something like the following:

```js
import React, {Component} from 'react';
import {dispatch, watch} from 'redux-easy';

class MyComponent extends Component {

  onFirstNameChange = event => {
    // assumes value comes from an input
    const {value} = event.target;
    dispatch('setFirstName', value);

    // If the setFirstName action just sets a value in the state,
    // perhaps user.firstName, the following can be used instead.
    // There is no need to implement simple reducer functions.
    dispatchSet('user.firstName', value);
  }

  render() {
    const {user} = this.props;
    return (
      <div className="my-component">
        <label>First Name</label>
        <input
          onChange={this.onFirstNameChange}
          type="text"
          value={user.firstName}
        />
      </div>
    );
  }
}

// The second argument to watch is a map
// of property names to state paths
// where path parts are separated by periods.
export default watch(MyComponent, {
  user: 'user'
});
```

## Form Elements Tied to a State Path

It is common to have `input`, `select`, and `textarea` elements
with `onChange` handlers that get their value from `event.target.value`
and dispatch an action where the value is the payload.
An alternative is to use the provided `Input`, `Select`, and `TextArea` components
as follows:

HTML `input` elements can be replaced by the `Input` component.
For example,
```js
<Input path="user.firstName" />
```

The `type` property defaults to `'text'`,
but can be set to any valid value including `'checkbox'`.

The value used by the `input` is the state value at the specified path.
When the user changes the value, this component
updates the value at that path in the state.

To perform additional processing of changes such as validation,
supply an `onChange` prop that refers to a function.

HTML `textarea` elements can be replaced by the `TextArea` component.
For example,
```js
<TextArea path="feedback.comment" />
```

HTML `select` elements can be replaced by the `Select` component.
For example,
```js
<Select path="user.favoriteColor">
  <option>red</option>
  <option>green</option>
  <option>blue</option>
</Select>
```

## Asynchronous Actions

If a function passed to `addReducer` returns a `Promise`
and a matching action is dispatched,
it will wait for that `Promise` to resolve and then
update the state to the resolved value of the `Promise`.

Here's an example of such a reducer function:
```js
addReducer('myAsyncThing', (state, payload) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Data in payload would typically be used
      // in the following call to an asynchronous function.
      const result = await fetch('some-url');

      // Build the new state using the current state
      // obtained by calling getState() rather than
      // the state passed to the reducer function
      // because it may have changed
      // since the asynchronous activity began.
      const newState = {...getState(), someKey: result};

      resolve(newState);
    } catch (e) {
      reject(e);
    }
  });
});
```

## Tests

In Jest tests, do something like the following:

```js
import {reduxSetup} from 'redux-easy';

const initialState = {
  user: {firstName: ''}
};

describe('MyComponent', () => {
  test('handle firstName change', () => {
    const store = reduxSetup({initialState, mock: true});
    const jsx = (
      <Provider store={store}>
        <Login />
      </Provider>
    );
    const wrapper = mount(jsx);
    const firstNameInput = wrapper.find('.first-name-input');

    const firstName = 'Joe';
    firstNameInput.simulate('change', {target: {value: firstName}});

    const actions = store.getActions();
    expect(actions.length).toBe(1);

    const [action] = actions;
    expect(action.type).toBe('setFirstName');
    expect(action.payload).toBe(firstName);
  });
});

```

That's everything to you need to know to use redux-easy.
Code simply!

If you like this, also check out
https://www.npmjs.com/package/react-hash-route.
