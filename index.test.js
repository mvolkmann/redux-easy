const {
  addReducer,
  dispatch,
  getState,
  loadState,
  reduxSetup,
  saveState
} = require('./index');

const STATE_KEY = 'reduxState';

describe('redux-easy', () => {
  const initialState = {
    foo: 1,
    bar: {
      baz: 2
    }
  };

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

  beforeEach(() => reduxSetup({initialState, silent: true}));

  test('getMockStore', () => {
    const store = reduxSetup({initialState, mock: true, silent: true});

    const type = 'setEmail';
    const payload = 'foo@bar.baz';
    dispatch(type, payload);

    const actions = store.getActions();
    expect(actions.length).toBe(1);

    const [action] = actions;
    expect(action.type).toBe(type);
    expect(action.payload).toBe(payload);
  });

  // We are trusting that Redux works and are
  // just including this test for code coverage.
  test('getState', () => {
    getStorage(); // mocks sessionStorage

    // Create a mock Redux devtools store enhancer
    // to get code coverage.
    window.__REDUX_DEVTOOLS_EXTENSION__ = next => next;

    addReducer('setEmail', (state, value) =>
      ({...state, email: value}));

    const type = 'setEmail';
    const payload = 'foo@bar.baz';
    dispatch(type, payload);

    expect(getState().email).toBe(payload);
  });

  test('loadState handles bad JSON', () => {
    const storage = getStorage(); // mocks sessionStorage
    storage.setItem(STATE_KEY, 'bad json');
    const state = loadState();
    expect(state).toEqual(initialState);
  });

  test('saveState', () => {
    getStorage(); // mocks sessionStorage

    const state = {foo: 1, bar: {baz: 2}};
    saveState(state);

    const actual = loadState();
    expect(actual).toEqual(state);
  });

  test('saveState handles bad JSON', () => {
    getStorage(); // mocks sessionStorage

    // Create an object that contains a circular reference.
    // JSON.stringify will throw when passed this.
    const state = {};
    state.circular = state;

    expect(() => saveState(state))
      .toThrow(new TypeError('Converting circular structure to JSON'));
  });
});
