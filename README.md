# redux-easy

This is a set of utility functions that make it easier to use Redux.

## Benefits

* Don't need string constants for action types.
* Don't need to write reducer functions containing switch statements
  that switch on an action type string.
* Don't need to use the connect function from react-redux
  just to get access to the one `dispatch` function.
* Actions can be dispatched by passing an action type and a payload
  to the `dispatch` function without creating an action object.
* Each action is handled by a single function
  that takes a state object and a payload,
  making them very simple to write.
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

If a function passed to `addReducer` returns a `Promise`
and a matching action is dispatched,
this will wait for that `Promise` to resolve and then
update the state to the resolved value of the `Promise`.

That's everything to you need to know to use redux-easy.
Code simply!

If you like this, also check out
https://www.npmjs.com/package/react-hash-route.
