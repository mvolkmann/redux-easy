const {string} = require('prop-types');
const React = require('react');
const {dispatchSet, getPathValue} = require('./redux-easy');

class Input extends React.Component {
  handleChange = event => {
    const {checked, value} = event.target;
    const {path, type} = this.props;
    dispatchSet(path, type === 'checkbox' ? checked : value);
  };

  render() {
    const {path, type = 'text'} = this.props;

    const isCheckbox = type === 'checkbox';
    const propName = isCheckbox ? 'checked' : 'value';

    let value = getPathValue(path);
    if (!value) value = isCheckbox ? false : '';
    const inputProps = {...this.props, [propName]: value};

    return <input {...inputProps} onChange={this.handleChange} />;
  }
}

Input.propTypes = {
  path: string.isRequired,
  type: string.isRequired
};

module.exports = Input;
