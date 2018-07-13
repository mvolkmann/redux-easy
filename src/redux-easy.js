import {throttle} from 'lodash/function';
import {
  deepFreeze,
  deletePath,
  filterPath,
  getPath as realGetPath,
  mapPath,
  pushPath,
  setPath,
  transformPath
} from 'path-next';
// ESLint says React is never used, but it is needed!
import React from 'react';
import ReactDOM from 'react-dom';
// ESLint says Provide is never used, but it is!
import {connect, Provider} from 'react-redux';
import {createStore} from 'redux';

let dispatchFn,
  initialState = {},
  sessionStorageOptOut,
  silent,
  store,
  usingMockStore;

const ASYNC = '@@async';
const DELETE = '@@delete';
const FILTER = '@@filter';
export const INIT = '@@redux/INIT';
const MAP = '@@map';
const PUSH = '@@push';
const SET = '@@set';
export const STATE_KEY = 'reduxState';
const TRANSFORM = '@@transform';

const reducers = {
  [ASYNC]: (state, payload) => payload, // hard to get test coverage
  [DELETE]: (state, payload) => deletePath(state, payload),
  [FILTER]: (state, {path, value}) => filterPath(state, path, value),
  [INIT]: () => null,
  [MAP]: (state, {path, value}) => mapPath(state, path, value),
  [PUSH]: (state, {path, value}) => pushPath(state, path, ...value),
  [SET]: (state, {path, value}) => setPath(state, path, value),
  [TRANSFORM]: (state, {path, value}) => transformPath(state, path, value)
};

export const addReducer = (type, fn) => (reducers[type] = fn);

export const dispatch = (type, payload) => dispatchFn({type, payload});

/**
 * This deletes the property at path.
 */
export function dispatchDelete(path) {
  dispatch(DELETE + ' ' + path, path);
}

/**
 * This removes elements from the array at path.
 * filterFn must be a function that takes an array element
 * and returns a boolean indicating
 * whether the element should be retained.
 */
export function dispatchFilter(path, filterFn) {
  if (typeof filterFn !== 'function') {
    throw new Error('dispatchFilter must be passed a function');
  }

  dispatch(FILTER + ' ' + path, {path, value: filterFn});
}

/**
 * This updates elements in the array at path.
 * mapFn must be a function that takes an array element
 * and returns new value for the element.
 */
export function dispatchMap(path, mapFn) {
  if (typeof mapFn !== 'function') {
    throw new Error('dispatchMap must be passed a function');
  }

  dispatch(MAP + ' ' + path, {path, value: mapFn});
}

/**
 * This adds elements to the end of the array at path.
 */
export const dispatchPush = (path, ...elements) =>
  dispatch(PUSH + ' ' + path, {path, value: elements});

/**
 * This sets the value found at path to a given value.
 */
export const dispatchSet = (path, value) =>
  dispatch(SET + ' ' + path, {path, value});

export const dispatchTransform = (path, value) => {
  if (typeof value !== 'function') {
    throw new Error('dispatchTransform must be passed a function');
  }
  dispatch(TRANSFORM + ' ' + path, {path, value});
};

export const getState = () => {
  if (!store) throw new Error('store is not set');
  return store.getState();
};

export const getPath = path => realGetPath(getState(), path);

// This is useful in tests.
export const getStore = () => store;

// This is exported to support tests.
// Some tests need this promise to be returned.
export const handleAsyncAction = promise =>
  promise
    .then(newState => dispatch(ASYNC, newState))
    .catch(error => console.trace(error));

/**
 * This is called on app startup and
 * again each time the browser window is refreshed.
 * This function is only exported so it can be accessed from a test.
 */
export function loadState() {
  if (sessionStorageOptOut) return initialState;

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
    // istanbul ignore next
    if (!silent) console.error('redux-util loadState:', e.message);
    return initialState;
  }
}

// exported to support tests
export function reducer(state = initialState, action) {
  let {type} = action;
  if (!type) {
    throw new Error('action object passed to reducer must have type property');
  }

  if (
    type.startsWith(SET) ||
    type.startsWith(TRANSFORM) ||
    type.startsWith(DELETE) ||
    type.startsWith(PUSH) ||
    type.startsWith(FILTER) ||
    type.startsWith(MAP)
  ) {
    const index = type.indexOf(' ');
    type = type.substring(0, index);
  } else if (type.startsWith(INIT) || type === '@@INIT') {
    type = INIT;
  }

  const fn = reducers[type];
  if (!fn) {
    throw new Error(`no reducer found for action type "${type}"`);
  }

  const newState = fn(state, action.payload) || state;

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
 * sessionStorageOptOut: optional boolean
 *   (true to not save state to session storage)
 * silent: optional boolean
 *   (true to silence expected error messages in tests)
 * Returns the render function.
 */
export function reduxSetup(options) {
  const {component} = options;
  ({initialState = {}, sessionStorageOptOut, silent} = options);
  const target = options.target || document.getElementById('root');

  const extension = window.__REDUX_DEVTOOLS_EXTENSION__;
  const enhancer = extension && extension();
  const preloadedState = loadState();

  // store is only already set when a test sets it to mock store.
  if (!store) store = createStore(reducer, preloadedState, enhancer);
  setStore(store);

  if (!usingMockStore) {
    // See the video from Dan Abramov at
    // https://egghead.io/lessons/
    // javascript-redux-persisting-the-state-to-the-local-storage.
    store.subscribe(throttle(() => saveState(store.getState()), 1000));
    if (options.render) store.subscribe(options.render);
  }

  let render;

  if (component && target) {
    render = () => {
      ReactDOM.render(<Provider store={store}>{component}</Provider>, target);
    };

    render(); // initial render
  }

  return render;
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

    if (!sessionStorageOptOut) sessionStorage.setItem(STATE_KEY, json);
  } catch (e) {
    // istanbul ignore next
    if (!silent) console.error('redux-util saveState:', e.message);
    throw e;
  }
}

// usingMock store is set to true only in some tests.
export function setStore(s, usingMock = false) {
  store = s;
  usingMockStore = usingMock;
  if (store) dispatchFn = store.dispatch;
}

export function watch(component, watchMap) {
  function mapState(state, ownProps) {
    if (watchMap) {
      const entries = Object.entries(watchMap);
      return entries.reduce((props, [name, path]) => {
        if (!path) path = name;
        props[name] = realGetPath(state, path);
        return props;
      }, {});
    }

    const {list, path} = ownProps;

    // If no watchMap is passed to the watch function
    // and the component takes a prop named "path",
    // this will pass a prop named "value" to the component
    // whose value is the value of the state at that path.
    if (path) return {value: realGetPath(state, path)};

    // If no watchMap is passed to the watch function
    // and the component takes a prop named "list"
    // whose value is an array of objects that each
    // have a "path" property whose value is a state path,
    // this will pass a prop named "values" to the component
    // whose value is an array of the values at those state paths.
    if (list) {
      return {
        values: list.map(obj => realGetPath(state, obj.path))
      };
    }

    throw new Error(
      'watched components must have a watchMap, path, or list prop'
    );
  }

  return connect(mapState)(component);
}
