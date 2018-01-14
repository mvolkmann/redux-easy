import React from 'react';
import {connect} from 'react-redux';
import {dispatch, getPathValue} from 'redux-easy';
import {string} from 'prop-types';

let path;

class Input extends React.Component {
  handleChange(event) {
    const {value} = event.target;
    dispatch('@setPath', {path, value});
  }

  render() {
    ({path} = this.props);
    return (
      <input
        type="text"
        {...this.props}
        onChange={this.handleChange}
        value={this.props.value}
      />
    );
  }
}
Input.propTypes = {
  path: string.isRequired,
  value: string.isRequired
};

const mapState = () => {
  const value = path ? getPathValue(path) : undefined;
  return {value};
};

export default connect(mapState)(Input);
