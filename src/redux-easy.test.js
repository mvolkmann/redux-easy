const {
  addReducer,
  deepFreeze,
  dispatch,
  dispatchSet,
  getPathValue,
  getState,
  handleAsyncAction,
  loadState,
  reducer,
  reduxSetup,
  saveState,
  setPath
} = require('./redux-easy');

const STATE_KEY = 'reduxState';

describe('redux-easy', () => {
  const initialState = {
    foo: 1,
    bar: {
      baz: 2
    }
  };
  let store;

  // Mocks sessionStorage.
  function getStorage() {
    const storage = {
      getItem(key) {
        return storage[key];
      },
      setItem(key, value) {
        storage[key] = value;
      }
    };
    global.sessionStorage = storage;
    return storage;
  }

  beforeEach(() => {
    getStorage();
    store = reduxSetup({initialState, silent: true});
  });

  test('@@INIT', () => {
    const action = {type: '@@INIT'};
    expect(reducer(initialState, action)).toEqual(initialState);
  });

  test('deepFreeze simple', () => {
    const obj = {foo: 1, bar: true};
    deepFreeze(obj);
    expect(Object.isFrozen(obj)).toBe(true);
  });

  test('deepFreeze nested', () => {
    const obj = {foo: 1, bar: {baz: true}};
    deepFreeze(obj);
    expect(Object.isFrozen(obj)).toBe(true);
    expect(Object.isFrozen(obj.bar)).toBe(true);
  });

  test('deepFreeze cyclic', () => {
    const obj = {foo: 1};
    obj.bar = obj;
    deepFreeze(obj);
    expect(Object.isFrozen(obj)).toBe(true);
    expect(Object.isFrozen(obj.bar)).toBe(true);
  });

  test('dispatch', () => {
    // Using mock store so we can retrieve actions.
    store = reduxSetup({initialState, mock: true, silent: true});
    const type = '@@set';
    const payload = {path: 'some.path', value: 'some value'};
    dispatch(type, payload);
    const actions = store.getActions();
    expect(actions.length).toBe(1);
    const [action] = actions;
    expect(action.type).toBe(type);
    expect(action.payload).toEqual(payload);
  });

  test('dispatchSet with mock store', () => {
    // Using mock store so we can retrieve actions.
    store = reduxSetup({initialState, mock: true, silent: true});
    const path = 'some.deep.path';
    const value = 'some value';
    dispatchSet(path, value);
    const actions = store.getActions();
    expect(actions.length).toBe(1);
    const [action] = actions;
    expect(action.type).toEqual(expect.stringMatching(/^@@set /));
    expect(action.payload).toEqual({path, value});
  });

  test('dispatchSet with real store', () => {
    const path = 'some.deep.path';
    const value = 'some value';
    dispatchSet(path, value);
    const actual = getPathValue(path);
    expect(actual).toEqual(value);
  });

  test('getMockStore', () => {
    store = reduxSetup({initialState, mock: true, silent: true});

    const type = 'setEmail';
    const payload = 'foo@bar.baz';
    dispatch(type, payload);

    const actions = store.getActions();
    expect(actions.length).toBe(1);

    const [action] = actions;
    expect(action.type).toBe(type);
    expect(action.payload).toBe(payload);
  });

  /*
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

    expect(store.getState().email).toBe(payload);
  });
  */

  test('getPathValue', () => {
    let path = 'nothing.found.here';
    let actual = getPathValue(path);
    expect(actual).toBeUndefined();

    path = 'top';
    let value = 7;
    dispatchSet(path, value);
    actual = getPathValue('top');
    expect(actual).toBe(7);

    path = 'foo.bar.baz';
    value = 'some value';
    dispatchSet(path, value);
    actual = getPathValue(path);
    expect(actual).toBe(value);
  });

  test('getState', () => {
    expect(getState()).toEqual(store.getState());
  });

  test('handleAsyncAction', done => {
    // Using mock store so we can retrieve actions.
    store = reduxSetup({initialState, mock: true, silent: true});
    const newState = {foo: 1, bar: true};
    const promise = Promise.resolve(newState);
    handleAsyncAction(promise);
    promise.then(() => {
      const actions = store.getActions();
      expect(actions.length).toBe(1);
      const [action] = actions;
      expect(action.type).toBe('@@async');
      expect(action.payload).toEqual(newState);
      done();
    });
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

  test('saveState', () => {
    const state = {foo: 1, bar: {baz: 2}};
    saveState(state);

    const actual = loadState();
    expect(actual).toEqual(state);
  });

  test('saveState handles bad JSON', () => {
    // Create an object that contains a circular reference.
    // JSON.stringify will throw when passed this.
    const state = {};
    state.circular = state;

    expect(() => saveState(state)).toThrow(
      new TypeError('Converting circular structure to JSON')
    );
  });

  test('setPath', () => {
    const state = {
      foo: {
        bar: {
          baz: 1,
          c3: 3
        },
        c2: 2
      },
      c1: 1
    };
    const path = 'foo.bar.baz';
    const value = 2;
    const newState = setPath(state, {path, value});
    expect(newState.c1).toBe(1);
    expect(newState.foo.c2).toBe(2);
    expect(newState.foo.bar.c3).toBe(3);
    expect(newState.foo.bar.baz).toBe(value);
  });
});
