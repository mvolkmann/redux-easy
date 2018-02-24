import {func, string} from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {dispatchSet, getPathValue} from './redux-easy';

let thePath;

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
    const {path, type = 'text'} = this.props;
    thePath = path; // used by mapState below

    let {value} = this.props;
    if (!value) value = getPathValue(path);
    const isCheckbox = type === 'checkbox';
    if (value === undefined) value = isCheckbox ? false : '';

    const propName = isCheckbox ? 'checked' : 'value';
    const inputProps = {...this.props, [propName]: value};
    delete inputProps.dispatch;

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
  onChange: func,
  path: string.isRequired,
  type: string,
  value: string
};

function mapState(state) {
  return thePath ? {value: getPathValue(thePath)} : {};
}

export default connect(mapState)(Input);
