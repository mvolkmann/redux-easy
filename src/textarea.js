import {func, string} from 'prop-types';
import React, {Component} from 'react';
import {dispatchSet, getPathValue, watch} from './redux-easy';

const watchMap = {value: ''};

class TextArea extends Component {

  ref = null;

  componentWillMount() {
    watchMap.value = this.props.path;
  }

  handleChange = event => {
    const {value} = event.target;
    const {onChange, path} = this.props;
    dispatchSet(path, value);
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
        ref={textArea => this.ref = textArea}
      />
    );
  }
}

TextArea.propTypes = {
  onChange: func,
  path: string.isRequired,
  value: string
};

export default watch(TextArea, watchMap);
