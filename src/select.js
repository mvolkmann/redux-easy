import {func, number, oneOfType, string} from 'prop-types';
import React, {Component} from 'react';
import {dispatchSet, getPathValue, watch} from './redux-easy';

class Select extends Component {

  ref = null;

  handleChange = event => {
    const {value} = event.target;
    const {onChange, path: thePath} = this.props;
    this.path = thePath;
    dispatchSet(thePath, value);
    if (onChange) onChange(event);
  };

  render() {
    const {children, path} = this.props;

    let {value} = this.props;
    if (!value) value = getPathValue(path);
    if (value === undefined) value = '';

    const selectProps = {...this.props, value};
    delete selectProps.dispatch;

    return (
      <select
        {...selectProps}
        onChange={this.handleChange}
        ref={select => this.ref = select}
      >
        {children}
      </select>
    );
  }
}

Select.propTypes = {
  onChange: func,
  path: string.isRequired,
  value: oneOfType([number, string])
};

export default watch(Select);
