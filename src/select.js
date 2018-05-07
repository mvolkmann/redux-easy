import {func, node, number, oneOfType, string} from 'prop-types';
import React, {Component} from 'react';
import {dispatch, dispatchSet, getPathValue, watch} from './redux-easy';

class Select extends Component {
  ref = null;

  handleChange = event => {
    const {action, onChange, path} = this.props;
    const {value} = event.target;
    if (path) dispatchSet(path, value);
    if (action) dispatch(action, {path, value});
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
        ref={select => (this.ref = select)}
      >
        {children}
      </select>
    );
  }
}

Select.propTypes = {
  action: string,
  children: node,
  onChange: func,
  path: string,
  value: oneOfType([number, string])
};

export default watch(Select);
