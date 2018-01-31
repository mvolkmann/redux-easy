# redux-easy

This is a set of utility functions that make it easier to use Redux.

## Benefits

* Don't need string constants for action types.
* Don't need to write reducer functions containing switch statements
  that switch on an action type string.
* Don't need to use the `connect` function from react-redux
  just to get access to the one `dispatch` function.
* Actions can be dispatched by passing an action type string
  and a payload to the `dispatch` function
  without creating an action object.
* Each action is handled by a single "reducer" function
  that takes a state object and a payload,
  making them very simple to write.
* Simple actions that merely set a property value in the state
  can be dispatched without writing reducer functions
  (see `dispatchSet`).
* The complexity of nested/combined reducers can be bypassed.
* Automatically freezes all objects in the Redux state
  so any attempts to modify them are caught.
* Automatically saves Redux state to `sessionStorage`
  (on every state change, but limited to once per second).
* Automatically reloads Redux state from `sessionStorage`
  when the browser is refreshed to avoid losing state.
* Handles asynchronous actions in a very simple way
  without requiring middleware configuration or thunks.

## Setup

In the topmost source file, likely named `index.js`,
add the following which assumes the topmost component is `App`:

```js
import {Provider} from 'react-redux';
import {reduxSetup} from 'redux-easy';
import './reducers'; // described next

const initialState = {
  user: {firstName: ''}
};

const store = reduxSetup({initialState, render});

function render() {
  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>,
    document.getElementById('root')
  );
}

render();
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
import {connect} from 'react-redux';
import {dispatch} from 'redux-easy';

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

const mapState = state => {
  const {user} = state;
  return {user};
};

export default connect(mapState)(MyComponent);
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

## Inputs Tied to a State Path

It is common to have `input` elements with `onChange` handlers
that get the value from `event.target.value`
and dispatch an action where the value is the payload.
An alternative is to use the provided `Input` component
as follows:

```js
<Input path="user.firstName" />
``

The `type` property defaults to `'text'`,
but can be set to any valid value including `'checkbox'`.

The value used by the `input` is the state value at the specified path.
When the user changes the value, this component uses
the provided `dispatchSet` function to update the state.

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
