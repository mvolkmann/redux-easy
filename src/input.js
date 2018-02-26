import {bool, func, number, oneOfType, string} from 'prop-types';
import React, {Component} from 'react';
import {addWatchMap, dispatchSet, getPathValue, watch} from './redux-easy';

class Input extends Component {

  ref = null;

  //componentWillReceiveProps(nextProps) {
  //  const {id, path} = nextProps;
  componentWillMount() {
    const {id, path} = this.props;
    addWatchMap(id, {value: path});
  }

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
  value: oneOfType([string, number, bool])
};

export default watch(Input);
