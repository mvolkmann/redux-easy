import {arrayOf, func, node, number, oneOfType, string} from 'prop-types';
import React, {Component} from 'react';
import {dispatch, dispatchSet, getPath, watch} from './redux-easy';

class MultiSelect extends Component {
  ref = null;

  handleChange = event => {
    const {action, onChange, path} = this.props;

    const select = event.target;
    const options = select.selectedOptions;
    const value = [...options].map(option => option.value);
    if (path) dispatchSet(path, value);
    if (action) dispatch(action, {path, value});
    if (onChange) onChange(event);
  };

  componentDidMount() {
    let {path, value} = this.props;
    if (!value) value = getPath(path);
    if (value === undefined) value = [];

    const select = this.ref;
    const options = select.querySelectorAll('option');
    for (const option of options) {
      if (value.includes(option.value)) {
        option.setAttribute('selected', 'selected');
      } else {
        option.removeAttribute('selected');
      }
    }
  }

  render() {
    const selectProps = {...this.props};
    delete selectProps.children;
    delete selectProps.dispatch;

    return (
      <select
        multiple
        onChange={this.handleChange}
        ref={select => (this.ref = select)}
        {...selectProps}
      >
        {this.props.children}
      </select>
    );
  }
}

MultiSelect.propTypes = {
  action: string,
  children: node,
  onChange: func,
  path: string,
  value: oneOfType([arrayOf(number), arrayOf(string)])
};

export default watch(MultiSelect);
