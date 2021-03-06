import {arrayOf, bool, shape, string} from 'prop-types';
import React, {Component} from 'react';
import {dispatch, dispatchSet, getPath, watch} from './redux-easy';

const getName = index => 'cb' + index;

/**
 * This component renders a set of checkboxes.
 * The `list` prop specifies the text and Redux state path
 * for each checkbox.
 * Specify a `className` prop to enable styling the checkboxes.
 */
class Checkboxes extends Component {
  static propTypes = {
    action: string,
    className: string,
    'data-testid': string,
    list: arrayOf(
      shape({
        text: string.isRequired,
        path: string
      })
    ).isRequired,
    values: arrayOf(bool).isRequired
  };

  handleChange = (text, event) => {
    const {action, list} = this.props;
    const {path} = list.find(obj => obj.text === text);
    const value = event.target.checked;
    if (path) dispatchSet(path, value);
    if (action) dispatch(action, {path, value});
  };

  render() {
    const {className, list, values} = this.props;

    const extraProps = {};
    const testId = this.props['data-testid'];

    const checkboxes = list.map((obj, index) => {
      const {text, path} = obj;
      const checked = Boolean(values ? values[index] : getPath(path));
      const name = getName(index);
      if (testId) extraProps['data-testid'] = testId + '-' + name;
      return (
        <div key={name}>
          <input
            className={name}
            checked={checked}
            id={name}
            onChange={e => this.handleChange(text, e)}
            type="checkbox"
            {...extraProps}
          />
          <label htmlFor={name}>{text}</label>
        </div>
      );
    });

    return <div className={'checkboxes ' + className}>{checkboxes}</div>;
  }
}

export default watch(Checkboxes);
