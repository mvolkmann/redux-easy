import {throttle} from 'lodash/function';
// ESLint says React is never used, but it is needed!
import React from 'react';
import ReactDOM from 'react-dom';
// ESLint says Provide is never used, but it is!
import {connect, Provider} from 'react-redux';
import {createStore} from 'redux';
import configureStore from 'redux-mock-store';

let dispatchFn,
  initialState = {},
  lastId = 0,
  silent,
  store;

const PATH_DELIMITER = '.';
const STATE_KEY = 'reduxState';

const reducers = {
  '@@INIT': () => null,
  '@@redux/INIT': () => null,
  '@@async': (state, payload) => payload,
  '@@set': setPath
};

export function addReducer(type, fn) {
  reducers[type] = fn;
}

export function deepFreeze(obj, freezing = []) {
  if (Object.isFrozen(obj) || freezing.includes(obj)) return;

  freezing.push(obj);

  const props = Object.getOwnPropertyNames(obj);
  for (const prop of props) {
    const value = obj[prop];
    if (typeof value === 'object' && value !== null) {
      deepFreeze(value, freezing);
    }
  }

  Object.freeze(obj);
}

export function dispatch(type, payload) {
  // dispatchFn is not set in some tests.
  if (dispatchFn) dispatchFn({type, payload});
}

export function dispatchSet(path, value) {
  if (dispatchFn) {
    dispatchFn({
      type: '@@set',
      payload: {path, value}
    });
  }
}

export function getPathValue(path, state) {
  if (!path) return undefined;

  let value = state || store.getState();
  const parts = path.split(PATH_DELIMITER);
  for (const part of parts) {
    value = value[part];
    if (value === undefined) return value;
  }
  return value;
}

export function getState() {
  return store.getState();
}

// exported to support tests
export function handleAsyncAction(promise) {
  promise
    .then(newState => store.dispatch({type: '@@async', payload: newState}))
    .catch(error => console.trace(error));
}

/**
 * This is called on app startup and
 * again each time the browser window is refreshed.
 * This function is only exported so it can be accessed from a test.
 */
export function loadState() {
  const {sessionStorage} = window; // not available in tests

  try {
    const json = sessionStorage ? sessionStorage.getItem(STATE_KEY) : null;
    if (!json) return initialState;

    // When parsing errors Array, change to a Set.
    return JSON.parse(
      json,
      (key, value) => (key === 'errors' ? new Set(value) : value)
    );
  } catch (e) {
    if (!silent) console.error('redux-util loadState:', e.message);
    return initialState;
  }
}

// exported to support tests
export function reducer(state = initialState, action) {
  const {payload, type} = action;
  if (!type) {
    throw new Error('action object passed to reducer must have type property');
  }

  const fn = reducers[type];
  if (!fn) {
    throw new Error(`no reducer found for action type "${type}"`);
  }

  const newState = fn(state, payload) || state;

  if (newState instanceof Promise) {
    handleAsyncAction(newState);
    return state;
  }

  deepFreeze(newState);
  return newState;
}

/**
 * Pass an object with these properties:
 * component: top component to render
 * target: element where component should be rendered
 *   (defaults to element with id "root")
 * initialState: required object
 * mock: optional boolean to use mock Redux store
 * silent: optional boolean
 *   (true to silence expected error messages in tests)
 */
export function reduxSetup(options) {
  const {component, mock} = options;
  ({initialState = {}, silent} = options);
  const target = options.target || document.getElementById('root');

  const extension = window.__REDUX_DEVTOOLS_EXTENSION__;
  const enhancer = extension && extension();
  const preloadedState = loadState();

  store = mock
    ? configureStore([])(initialState)
    : createStore(reducer, preloadedState, enhancer);
  setStore(store);

  if (!mock) {
    // See the video from Dan Abramov at
    // https://egghead.io/lessons/
    // javascript-redux-persisting-the-state-to-the-local-storage.
    store.subscribe(throttle(() => saveState(store.getState()), 1000));
    if (options.render) store.subscribe(options.render);
  }

  if (component && target) {
    function render() {
      ReactDOM.render(<Provider store={store}>{component}</Provider>, target);
    }

    render(); // initial render
  }

  return store; // used in tests
}

/**
 * This function is called by reduxSetup.
 * It is only exported so it can be accessed from a test.
 */
export function saveState(state) {
  try {
    // When stringifying errors Set, change to an Array.
    const json = JSON.stringify(
      state,
      (key, value) => (key === 'errors' ? [...state.errors] : value)
    );

    sessionStorage.setItem(STATE_KEY, json);
  } catch (e) {
    if (!silent) console.error('redux-util saveState:', e.message);
    throw e;
  }
}

// exported to support tests
export function setPath(state, payload) {
  const {path, value} = payload;
  const parts = path.split(PATH_DELIMITER);
  const lastPart = parts.pop();
  const newState = {...state};

  let obj = newState;
  for (const part of parts) {
    const v = obj[part];
    const newV = {...v};
    obj[part] = newV;
    obj = newV;
  }

  obj[lastPart] = value;

  return newState;
}

export function setStore(s) {
  store = s;
  dispatchFn = store.dispatch;
}

export function watch(component, watchMap) {
  function mapState(state, ownProps) {
    const {path, pathList} = ownProps;

    // Components that have path or pathList properties
    // do not use a watchMap.

    if (path) return {value: getPathValue(path, state)};

    if (pathList) {
      return {
        values: pathList.map(path => getPathValue(path, state))
      };
    }

    if (watchMap) {
      const entries = Object.entries(watchMap);
      return entries.reduce((props, [name, path]) => {
        props[name] = getPathValue(path, state);
        return props;
      }, {});
    }

    throw new Error(
      'watched components must have a path, pathList, or watchMap prop'
    );
  }

  return connect(mapState)(component);
}
