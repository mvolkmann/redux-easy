import {arrayOf, shape, string} from 'prop-types';
import React, {Component} from 'react';
import {dispatchSet, getPathValue, watch} from './redux-easy';

const getName = index => 'rb' + index;

/**
 * This component renders a set of radio buttons.
 * The `list` prop specifies the text and value
 * for each radio button.
 * The `path` prop specifies the Redux state path
 * where the value will be stored.
 * Specify a `className` prop to enable styling the radioButtons.
 */
class RadioButtons extends Component {

  handleChange = event =>
    dispatchSet(this.props.path, event.target.value);

  render() {
    const {className, list, path} = this.props;

    let {value} = this.props;
    if (!value) value = getPathValue(path);

    const radioButtons = list.map((obj, index) => {
      const name = getName(index);
      return (
        <div key={name}>
          <input
            checked={obj.value === value}
            className={name}
            name={path}
            onChange={this.handleChange}
            type="radio"
            value={obj.value}
          />
          <label>{obj.text}</label>
        </div>
      );
    });

    return (
      <div className={'radioButtons ' + className}>
        {radioButtons}
      </div>
    );
  }
}

RadioButtons.propTypes = {
  className: string,
  list: arrayOf(
    shape({
      text: string.isRequired,
      value: string
    })
  ).isRequired,
  path: string.isRequired,
  value: string
};

export default watch(RadioButtons);
