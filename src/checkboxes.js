import {arrayOf, shape, string} from 'prop-types';
import React, {Component} from 'react';
import {dispatchSet, getPathValue, watch} from 'redux-easy';

const watchMap = {};

const getName = index => 'cb' + index;

/**
 * This component renders a set of checkboxes.
 * The `list` prop specifies the text and Redux state path
 * for each checkbox.
 * Specify a `className` prop to enable styling the checkboxes.
 */
class Checkboxes extends Component {

  componentWillMount() {
    this.props.list.forEach((obj, index) => {
      watchMap[getName(index)] = obj.path;
    });
  }

  handleChange = (name, event) =>
    dispatchSet(watchMap[name], event.target.checked);

  render() {
    const {className, list} = this.props;

    const checkboxes = list.map((obj, index) => {
      const checked = getPathValue(obj.path);
      const name = getName(index);
      return (
        <div key={name}>
          <input
            className={name}
            checked={checked}
            onChange={e => this.handleChange(name, e)}
            type="checkbox"
          />
          <label>{obj.text}</label>
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
  list: arrayOf(
    shape({
      text: string.isRequired,
      path: string.isRequired
    })
  ).isRequired
};

export default watch(Checkboxes, watchMap);
