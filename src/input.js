import {bool, func, number, oneOfType, string} from 'prop-types';
import React, {Component} from 'react';
import {dispatch, dispatchSet, getPath, watch} from './redux-easy';

class Input extends Component {
  ref = null;

  handleChange = event => {
    const {checked, value} = event.target;
    const {action, onChange, path, type} = this.props;

    let v = value;
    if (type === 'checkbox') {
      v = checked;
    } else if (type === 'number' || type === 'range') {
      if (value.length) v = Number(value);
    }

    if (path) dispatchSet(path, v);
    if (action) dispatch(action, {path, value: v});

    if (onChange) onChange(event);
  };

  render() {
    const {autoFocus, onEnter, path, type} = this.props;

    let {value} = this.props;
    if (!value) value = getPath(path);

    const isCheckbox = type === 'checkbox';
    if (value === undefined) value = isCheckbox ? false : '';

    const propName = isCheckbox ? 'checked' : 'value';
    const inputProps = {
      autoFocus,
      type: 'text',
      ...this.props,
      [propName]: value
    };
    delete inputProps.dispatch;

    if (onEnter) {
      inputProps.onKeyPress = event => {
        if (event.key === 'Enter') onEnter();
      };
      delete inputProps.onEnter;
    }

    return (
      <input
        {...inputProps}
        onChange={this.handleChange}
        ref={input => (this.ref = input)}
      />
    );
  }
}

Input.propTypes = {
  action: string, // action to be dispatched on change
  autoFocus: bool,
  onChange: func, // called on every change to value
  onEnter: func, // called if user presses enter key
  path: string, // state path that is updated
  type: string, // type of the HTML input
  // optional current value (obtained from state at path if not specified)
  value: oneOfType([string, number, bool])
};

export default watch(Input);
