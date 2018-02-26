import {arrayOf, shape, string} from 'prop-types';
import React, {Component} from 'react';
import {dispatchSet, getPathValue, watch} from './redux-easy';

const getName = index => 'cb' + index;

/**
 * This component renders a set of checkboxes.
 * The `pathList` prop specifies the text and Redux state path
 * for each checkbox.
 * Specify a `className` prop to enable styling the checkboxes.
 */
class Checkboxes extends Component {

  handleChange = (name, event) =>
    dispatchSet(this.watchMap[name], event.target.checked);

  render() {
    const {className, pathList, values} = this.props;

    const checkboxes = pathList.map((obj, index) => {
      const {text, path} = obj;
      const checked = values ? values[index] : getPathValue(path);
      const name = getName(index);
      return (
        <div key={name}>
          <input
            className={name}
            checked={checked}
            onChange={e => this.handleChange(name, e)}
            type="checkbox"
          />
          <label>{text}</label>
        </div>
      );
    });

    return (
      <div className={'checkboxes ' + className}>
        {checkboxes}
      </div>
    );
  }
}

Checkboxes.propTypes = {
  className: string,
  pathList: arrayOf(
    shape({
      text: string.isRequired,
      path: string.isRequired
    })
  ).isRequired
};

export default watch(Checkboxes);
