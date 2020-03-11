import cloneDeep from 'lodash.clonedeep';
import React from 'react';
import configureStore from 'redux-mock-store';
import {
  addReducer,
  dispatch,
  dispatchDelete,
  dispatchFilter,
  dispatchMap,
  dispatchPush,
  dispatchSet,
  dispatchTransform,
  getPath,
  getState,
  getStore,
  handleAsyncAction,
  INIT,
  loadState,
  reducer,
  reduxSetup,
  saveState,
  setStore,
  STATE_KEY,
  watch
} from './redux-easy';

const INITIAL_STATE = {
  foo: 1,
  bar: {
    baz: 2,
    qux: ['one', 'two', 'three']
  }
};

function mockSessionStorage() {
  const storage = {
    getItem(key) {
      return storage[key];
    },
    removeItem(key) {
      delete storage[key];
    },
    setItem(key, value) {
      storage[key] = value;
    }
  };
  global.sessionStorage = storage;
}

describe('redux-easy with mock store', () => {
  let initialState;
  let version = 0;

  // Mocks sessionStorage.
  beforeEach(() => {
    mockSessionStorage();

    initialState = cloneDeep(INITIAL_STATE);

    // Create and register a mock store which allows
    // retrieving an array of the dispatched actions in a test.
    setStore(configureStore([])(initialState));

    version++;
    reduxSetup({initialState, silent: true, version});
  });

  test('INIT', () => {
    const action = {type: INIT};
    expect(reducer(initialState, action)).toEqual(initialState);
  });

  test('dispatch', () => {
    const type = '@@set';
    const payload = {path: 'some.path', value: 'some value'};
    dispatch(type, payload);
    const actions = getStore().getActions();
    expect(actions.length).toBe(1);
    const [action] = actions;
    expect(action.type).toBe(type);
    expect(action.payload).toEqual(payload);
  });

  test('dispatchSet with mock store', () => {
    // Using mock store so we can retrieve actions.
    //reduxSetup({initialState, mock: true, silent: true});
    const path = 'some.deep.path';
    const value = 'some value';
    dispatchSet(path, value);
    const actions = getStore().getActions();
    expect(actions.length).toBe(1);
    const [action] = actions;
    expect(action.type).toEqual(expect.stringMatching(/^@@set /));
    expect(action.payload).toEqual({path, value});
  });

  test('handleAsyncAction', done => {
    const newState = {foo: 1, bar: true};
    const promise = Promise.resolve(newState);
    handleAsyncAction(promise);
    promise.then(() => {
      const actions = getStore().getActions();
      expect(actions.length).toBe(1);
      const [action] = actions;
      expect(action.type).toBe('@@async');
      expect(action.payload).toEqual(newState);
      done();
    });
  });

  test('handleAsyncAction that throws', async done => {
    const errorMsg = 'some message';

    // Mock the console.trace function.
    const originalTrace = console.trace;
    console.trace = msg => {
      expect(msg).toBe(errorMsg);
    };

    const promise = Promise.reject(errorMsg);
    try {
      await handleAsyncAction(promise);
      done();
    } catch (e) {
      done.fail('never called console.trace');
    } finally {
      // Reset the console.trace function.
      console.trace = originalTrace;
    }
  });
});

describe('redux-easy with real store', () => {
  let initialState;
  let version = 0;

  beforeEach(() => {
    mockSessionStorage();

    initialState = cloneDeep(INITIAL_STATE);

    // Clear any previously registered store.
    setStore(null);

    // Use real store.
    version++;
    reduxSetup({initialState, silent: true, version});
  });

  test('dispatchDelete with real store', () => {
    const path = 'bar.baz';

    dispatchDelete(path);

    const actual = getPath(path);
    expect(actual).toBeUndefined();
  });

  test('dispatchFilter with real store', () => {
    const path = 'bar.qux';

    // Remove all elements that contain the letter "t".
    const filterFn = element => !/t/.test(element);
    dispatchFilter(path, filterFn);

    const actual = getPath(path);
    expect(actual).toEqual(['one']);
  });

  test('dispatchFilter passing non-function', () => {
    const filterFn = 'This is not a function.';
    const msg = 'dispatchFilter must be passed a function';
    expect(() => dispatchFilter('some.path', filterFn)).toThrow(new Error(msg));
  });

  test('dispatchFilter with path to non-array', () => {
    const path = 'bar.baz';
    const filterFn = value => value;
    const msg = `filterPath can only be used on arrays and ${path} is not`;
    expect(() => dispatchFilter(path, filterFn)).toThrow(new Error(msg));
  });

  test('dispatchMap with real store', () => {
    const path = 'bar.qux';

    // Uppercase all elements.
    const mapFn = element => element.toUpperCase();
    dispatchMap(path, mapFn);

    const actual = getPath(path);
    expect(actual).toEqual(['ONE', 'TWO', 'THREE']);
  });

  test('dispatchMap passing non-function', () => {
    const filterFn = 'This is not a function.';
    const msg = 'dispatchMap must be passed a function';
    expect(() => dispatchMap('some.path', filterFn)).toThrow(new Error(msg));
  });

  test('dispatchMap with path to non-array', () => {
    const path = 'bar.baz';
    const filterFn = value => value;
    const msg = `mapPath can only be used on arrays and ${path} is not`;
    expect(() => dispatchMap(path, filterFn)).toThrow(new Error(msg));
  });

  test('dispatchPush with real store', () => {
    const path = 'bar.qux';

    // Remove all elements that contain the letter "t".
    dispatchPush(path, 'four', 'five');

    const actual = getPath(path);
    expect(actual).toEqual(['one', 'two', 'three', 'four', 'five']);
  });

  test('dispatchPush with path to non-array', () => {
    const path = 'bar.baz';
    const filterFn = value => value;
    const msg = `pushPath can only be used on arrays and ${path} is not`;
    expect(() => dispatchPush(path, filterFn)).toThrow(new Error(msg));
  });

  test('dispatchSet with real store', () => {
    const path = 'some.deep.path';
    const value = 'some value';
    dispatchSet(path, value);
    const actual = getPath(path);
    expect(actual).toEqual(value);
  });

  test('dispatchTransform with real store', () => {
    const path = 'bar.baz';
    const initialValue = getPath(path);
    dispatchTransform(path, v => v + 1);
    const newValue = getPath(path);
    expect(newValue).toEqual(initialValue + 1);
  });

  test('dispatchTransform passing non-function', () => {
    const filterFn = 'This is not a function.';
    const msg = 'dispatchTransform must be passed a function';
    expect(() => dispatchTransform('some.path', filterFn)).toThrow(
      new Error(msg)
    );
  });

  // We are trusting that Redux works and are
  // just including this test for code coverage.
  test('getState', () => {
    // Create a mock Redux devtools store enhancer
    // to get code coverage.
    window.__REDUX_DEVTOOLS_EXTENSION__ = next => next;

    addReducer('setEmail', (state, value) => ({...state, email: value}));

    const type = 'setEmail';
    const payload = 'foo@bar.baz';
    dispatch(type, payload);

    const state = getStore().getState();
    expect(state.email).toBe(payload);
  });

  test('getState', () => {
    const state = getStore().getState();
    expect(getState()).toEqual(state);
  });

  test('invalid action type', () => {
    const action = {type: 'invalid'};
    expect(() => reducer(undefined, action)).toThrowError(
      `no reducer found for action type "${action.type}"`
    );
  });

  test('loadState handles bad JSON', () => {
    global.sessionStorage.setItem(STATE_KEY, 'bad json');
    const state = loadState();
    expect(state).toEqual(initialState);
  });

  test('loadState handles state not in sessionStorage', () => {
    global.sessionStorage.removeItem(STATE_KEY);
    const state = loadState();
    expect(state).toEqual(initialState);
  });

  test('missing action type', () => {
    const action = {wrong: 'some-action'};
    expect(() => reducer(undefined, action)).toThrowError(
      'action object passed to reducer must have type property'
    );
  });

  test('reducer with no state', () => {
    addReducer('noOp', state => state);
    const action = {type: 'noOp'};
    const state = reducer(undefined, action);
    expect(state).toEqual(initialState);
  });

  test('reduxSetup with no initialState', () => {
    setStore(null); // clears store created in beforeEach
    reduxSetup({}); // not specifying initial state
    const state = getState();
    expect(state).toEqual({});
  });

  test('saveState', () => {
    const state = {foo: 2, bar: {baz: 3}};
    saveState(state);

    const actual = loadState();
    expect(actual).toEqual(state);
  });

  // This verifies that the watch function works with a watchMap
  // which means it passes the correct state path values
  // as a props to a React component.
  test('watch with a watchMap', done => {
    const TestComponent = props => {
      expect(props.baz).toBe(initialState.bar.baz);

      return null; // don't need to actually return JSX in test
    };
    const watchMap = {baz: 'bar.baz'};
    const HOComponent = watch(TestComponent, watchMap);

    const target = document.createElement('div');
    reduxSetup({
      component: <HOComponent />,
      initialState,
      silent: true,
      target
    });

    setTimeout(done, 100);
  });

  // This verifies that the watch function works with a path.
  test('watch with a path', done => {
    const path = 'bar.baz';

    const TestComponent = props => {
      expect(props.path).toBe(path);
      expect(props.value).toBe(initialState.bar.baz);

      return null; // don't need to actually return JSX in test
    };
    const HOComponent = watch(TestComponent);

    const target = document.createElement('div');
    reduxSetup({
      component: <HOComponent path={path} />,
      initialState,
      silent: true,
      target
    });

    // Wait for the component to be rendered.
    setTimeout(done, 100);
  });

  // This verifies that the watch function works with a list.
  test('watch with a list', done => {
    const list = [{path: 'foo'}, {path: 'bar.baz'}, {path: 'bar.qux'}];

    const TestComponent = props => {
      expect(props.list).toEqual(list);
      expect(props.values.length).toBe(3);
      const [v1, v2, v3] = props.values;
      expect(v1).toBe(initialState.foo);
      expect(v2).toBe(initialState.bar.baz);
      expect(v3).toEqual(initialState.bar.qux);

      return null; // don't need to actually return JSX in test
    };
    const HOComponent = watch(TestComponent);

    const target = document.createElement('div');
    reduxSetup({
      component: <HOComponent list={list} />,
      initialState,
      silent: true,
      target
    });

    // Wait for the component to be rendered.
    setTimeout(done, 100);
  });

  // This verifies that the watch function throws when not used correctly.
  test('watch used incorrectly', done => {
    // Suppress output from console.error.
    const originalError = console.error;
    console.error = () => undefined;

    const TestComponent = () => null;
    const HOComponent = watch(TestComponent);
    const target = document.createElement('div');
    try {
      reduxSetup({
        component: <HOComponent />,
        initialState,
        silent: true,
        target
      });

      // Trigger a state change so mapState in the watch function will be called.
      dispatchSet('foo', 2);

      // Wait for the component to be rendered.
      setTimeout(() =>
        done.fail('expected error when watch is used incorrectly', 100)
      );
    } catch (e) {
      const expectedErrorMsg =
        'watched components must have a watchMap, path, or list prop';
      expect(e.message).toBe(expectedErrorMsg);
      done();
    } finally {
      // Reset the console.trace function.
      console.error = originalError;
    }
  });
});

describe('redux-easy with sensitive data', () => {
  beforeEach(() => {
    mockSessionStorage();

    // Clear any previously registered store.
    setStore(null);
  });

  test('replacer and reviver', () => {
    const initialState = {password: 'secret'};
    const replacerFn = state => {
      const copy = cloneDeep(state);
      delete copy.password;
      return copy;
    };
    const safePassword = 'not-secret';
    const reviverFn = state => {
      const copy = cloneDeep(state);
      copy.password = safePassword;
      return copy;
    };
    reduxSetup({initialState, replacerFn, reviverFn});
    const state = getState();
    expect(state.password).toBe(safePassword);
  });
});
