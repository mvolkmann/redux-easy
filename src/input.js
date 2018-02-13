const {func, string} = require('prop-types');
const React = require('react');
const {dispatchSet, getPathValue} = require('./redux-easy');

class Input extends React.Component {
  handleChange = event => {
    const {checked, value} = event.target;
    const {onChange, path, type} = this.props;

    let v = value;
    if (type === 'checkbox') {
      v = checked;
    } else if (type === 'number' || type === 'range') {
      if (value.length) v = Number(value);
    }

    dispatchSet(path, v);

    if (onChange) onChange(event);
  };

  render() {
    const {path, type = 'text'} = this.props;

    const isCheckbox = type === 'checkbox';
    const propName = isCheckbox ? 'checked' : 'value';

    let value = getPathValue(path);
    if (value === undefined) value = isCheckbox ? false : '';
    const inputProps = {...this.props, [propName]: value};

    return <input {...inputProps} onChange={this.handleChange} />;
  }
}

Input.propTypes = {
  onChange: func,
  path: string.isRequired,
  type: string
};

module.exports = Input;
