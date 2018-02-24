# redux-easy

This is a set of utility functions that make it easier to use Redux.

## Benefits

* No string constants are needed for action types.
* A reducer function that switches on action type is not needed.
* The dispatch function is accessed through a simple import rather
  than using react-redux `connect` function and `mapDispatchToProps`.
* Actions can be dispatched by providing just a type and payload
  rather than an action object.
* Each action type is handled by a single reducer function
  that is registered by action type and is simple to write.
* Simple actions that merely set a property value in the state
  (the most common kind) can be dispatched without writing
  reducer functions (see `dispatchSet`).
* Objects in the Redux state are automatically frozen
  to prevent accidental state modification.
* Asynchronous actions are handled in a simple way
  without requiring middleware or thunks.
* The complexity of nested/combined reducers can be bypassed.
* All objects in the Redux state are automatically frozen
  so any attempts to modify them are caught.
* Redux state is automatically saved in `sessionStorage`
  (on every state change, but limited to once per second).
* Redux state is automatically loaded from `sessionStorage`
  when the browser is refreshed to avoid losing state.
* Integration with redux-devtools is automatically provided.

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

reduxSetup({
  component: <App />,
  initialState,
  target: document.getElementById('root')
});
```

Create `reducers.js` containing something like the following:

```js
import {addReducer} from 'redux-easy';

// Call addReducer once for each action type, giving it the
// function to be invoked when that action type is dispatched.
// These functions must return the new state
// and cannot modify the existing state.
addReducer('setFirstName', (state, firstName) => {
  const {user} = state;
  return {...state, user: {...user, firstName}};
});
```

If the application requires a large number of reducer functions
they can be implemented in multiple files,
perhaps grouping related reducer functions together

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
    // There is no need to implement a reducer function.
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
// of property names to state paths.
export default watch(MyComponent, {
  user: 'user'
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

## Form Elements Tied to a State Path

It is common to have `input`, `select`, and `textarea` elements
with `onChange` handlers that get their value from `event.target.value`
and dispatch an action where the value is the payload.
An alternative is to use the provided `Input`, `Select`, and `TextArea` components
as follows:

```js
<Input path="user.firstName" />
```

The `type` property defaults to `'text'`,
but can be set to any valid value including `'checkbox'`.

The value used by the `input` is the state value at the specified path.
When the user changes the value, this component uses
the provided `dispatchSet` function to update the state.

To perform additional processing of changes such as validation,
supply an `onChange` prop that refers to a function.

```js
<TextArea path="feedback.comment" />
```

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

That's everything to you need to know to use redux-easy.
Code simply!

If you like this, also check out
https://www.npmjs.com/package/react-hash-route.
