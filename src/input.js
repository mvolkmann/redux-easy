import {bool, func, number, oneOfType, string} from 'prop-types';
import React, {Component} from 'react';
import {dispatchSet, getPathValue, watch} from './redux-easy';

class Input extends Component {

  ref = null;

  handleChange = event => {
    const {checked, value} = event.target;
    const {onChange, path, type} = this.props;

    let v = value;
    if (type === 'checkbox') {
      v = checked;
    } else if (type === 'number' || type === 'range') {
      if (value.length) v = Number(value);
    }

    dispatchSet(path, v);

    if (onChange) onChange(event);
  };

  render() {
    const {onEnter, path, type} = this.props;

    let {value} = this.props;
    if (!value) value = getPathValue(path);

    const isCheckbox = type === 'checkbox';
    if (value === undefined) value = isCheckbox ? false : '';

    const propName = isCheckbox ? 'checked' : 'value';
    const inputProps = {type: 'text', ...this.props, [propName]: value};
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
        ref={input => this.ref = input}
      />
    );
  }
}

Input.propTypes = {
  onChange: func, // called on every change to value
  onEnter: func, // called if user presses enter key
  path: string.isRequired, // state path that is updated
  type: string, // type of the HTML input
  // optional current value (obtained from state at path if not specified)
  value: oneOfType([string, number, bool])
};

export default watch(Input);
