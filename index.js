const {createStore} = require('redux');
const {default: configureStore} = require('redux-mock-store');

let dispatchFn, initialState;

const STATE_KEY = 'reduxState';

const reducers = {
  '@@INIT': () => null,
  '@@redux/INIT': () => null
};

function addReducer(type, fn) {
  reducers[type] = fn;
}

function deepFreeze(obj) {
  const props = Object.getOwnPropertyNames(obj);
  for (const prop of props) {
    const value = obj[prop];
    if (typeof value === 'object' && value !== null) deepFreeze(value);
  }
  Object.freeze(obj);
}

function dispatch(type, payload) {
  // dispatchFn is not set in some tests.
  if (dispatchFn) dispatchFn({type, payload});
}

function getMockStore(state = initialState) {
  const mockStore = configureStore([]);
  const store = mockStore(state);
  dispatchFn = store.dispatch;
  return store;
}

function getStore() {
  const extension = window.__REDUX_DEVTOOLS_EXTENSION__;
  const enhancer = extension && extension();
  const preloadedState = loadState();
  const store = createStore(reducer, preloadedState, enhancer);
  dispatchFn = store.dispatch;
  return store;
}

/**
 * This is called on app startup and
 * again each time the browser window is refreshed.
 * This function is only exported so it can be accessed from a test.
 */
function loadState(silent) {
  const {sessionStorage} = window; // not available in tests

  try {
    const json = sessionStorage ? sessionStorage.getItem(STATE_KEY) : null;
    if (!json) return initialState;

    // When parsing errors Array, change to a Set.
    return JSON.parse(json, (key, value) =>
      key === 'errors' ? new Set(value) : value);
  } catch (e) {
    // istanbul ignore next
    if (!silent) console.error('redux-util loadState:', e.message);
    return initialState;
  }
}

function reducer(state = initialState, action) {
  const {payload, type} = action;
  const fn = reducers[type];
  if (fn) {
    const newState = fn(state, payload) || state;
    deepFreeze(newState);
    return newState;
  }

  throw new Error(`no reducer found for action type "${type}"`);
}

function saveState(state, silent) {
  try {
    // When stringifying errors Set, change to an Array.
    const json = JSON.stringify(state, (key, value) =>
      key === 'errors' ? [...state.errors] : value);

    sessionStorage.setItem(STATE_KEY, json);
  } catch (e) {
    // istanbul ignore next
    if (!silent) console.error('redux-util saveState:', e.message);
    throw e;
  }
}

function setInitialState(state) {
  initialState = state;
}

module.exports = {
  addReducer,
  dispatch,
  getMockStore,
  getStore,
  loadState,
  reducer, // exported to support tests
  saveState,
  setInitialState
};
