import {func, string} from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {dispatchSet, getPathValue} from './redux-easy';

let thePath;

class TextArea extends Component {

  ref = null;

  handleChange = event => {
    const {value} = event.target;
    const {onChange, path} = this.props;
    dispatchSet(path, value);
    if (onChange) onChange(event);
  };

  render() {
    const {path} = this.props;
    thePath = path; // used by mapState below

    let {value} = this.props;
    if (!value) value = getPathValue(path);
    if (value === undefined) value = '';

    const textAreaProps = {...this.props, value};
    delete textAreaProps.dispatch;

    return (
      <textarea
        {...textAreaProps}
        onChange={this.handleChange}
        ref={textArea => this.ref = textArea}
      />
    );
  }
}

TextArea.propTypes = {
  onChange: func,
  path: string.isRequired,
  type: string,
  value: string
};

function mapState(state) {
  return thePath ? {value: getPathValue(thePath)} : {};
}

export default connect(mapState)(TextArea);
