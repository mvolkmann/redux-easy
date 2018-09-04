import {arrayOf, shape, string} from 'prop-types';
import React, {Component} from 'react';
import {dispatch, dispatchSet, getPath, watch} from './redux-easy';

/**
 * This component renders a set of radio buttons.
 * The `list` prop specifies the text and value
 * for each radio button.
 * The `path` prop specifies the Redux state path
 * where the value will be stored.
 * Specify a `className` prop to enable styling the radio-buttons.
 */
class RadioButtons extends Component {
  static propTypes = {
    'data-testid': string,
    action: string,
    className: string,
    list: arrayOf(
      shape({
        text: string.isRequired,
        value: string
      })
    ).isRequired,
    path: string,
    value: string
  };

  handleChange = event => {
    const {action, path} = this.props;
    const {value} = event.target;
    if (path) dispatchSet(path, value);
    if (action) dispatch(action, {path, value});
  };

  render() {
    const {className, list, path} = this.props;

    const extraProps = {};
    const testId = this.props['data-testid'];

    let {value} = this.props;
    if (!value) value = getPath(path);

    const radioButtons = list.map(obj => {
      if (testId) extraProps['data-testid'] = testId + '-' + obj.value;
      return (
        <div key={obj.value}>
          <input
            checked={obj.value === value}
            className={obj.value}
            name={path}
            onChange={this.handleChange}
            type="radio"
            value={obj.value}
            {...extraProps}
          />
          <label>{obj.text}</label>
        </div>
      );
    });

    return <div className={'radio-buttons ' + className}>{radioButtons}</div>;
  }
}

export default watch(RadioButtons);
