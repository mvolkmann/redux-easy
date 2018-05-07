import {func, string} from 'prop-types';
import React, {Component} from 'react';
import {dispatch, dispatchSet, getPathValue, watch} from './redux-easy';

class TextArea extends Component {
  ref = null;

  handleChange = event => {
    const {action, onChange, path} = this.props;
    const {value} = event.target;
    if (path) dispatchSet(path, value);
    if (action) dispatch(action, {path, value});
    if (onChange) onChange(event);
  };

  render() {
    const {path} = this.props;

    let {value} = this.props;
    if (!value) value = getPathValue(path);

    const textAreaProps = {...this.props, value};
    delete textAreaProps.dispatch;

    return (
      <textarea
        {...textAreaProps}
        onChange={this.handleChange}
        ref={textArea => (this.ref = textArea)}
      />
    );
  }
}

TextArea.propTypes = {
  action: string,
  onChange: func,
  path: string,
  value: string
};

export default watch(TextArea);
