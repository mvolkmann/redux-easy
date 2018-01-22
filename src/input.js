const {string} = require('prop-types');
const React = require('react');
const {dispatchSet, getPathValue} = require('./redux-easy');

class Input extends React.Component {
  handleChange = event => {
    const {checked, value} = event.target;
    const {path, type} = this.props;

    // Horrible Prettier formatting of ternaries!
    const v =
      type === 'checkbox'
        ? checked
        : type === 'number' && value.length ? Number(value) : value;
    dispatchSet(path, v);
  };

  render() {
    const {path, type = 'text'} = this.props;

    const isCheckbox = type === 'checkbox';
    const propName = isCheckbox ? 'checked' : 'value';

    let value = getPathValue(path);
    //const isNumber = type === 'number';
    //if (value === undefined) value = isCheckbox ? false : isNumber ? 0 : '';
    if (value === undefined) value = isCheckbox ? false : '';
    const inputProps = {...this.props, [propName]: value};

    return <input {...inputProps} onChange={this.handleChange} />;
  }
}

Input.propTypes = {
  path: string.isRequired,
  type: string
};

module.exports = Input;
