import {func, string} from 'prop-types';
import React, {Component} from 'react';
import {dispatchSet, getPathValue, watch} from './redux-easy';

const watchMap = {value: ''};

class Select extends Component {

  path = ''
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
    watchMap.value = path;

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
  type: string,
  value: string
};

export default watch(Select, watchMap);
