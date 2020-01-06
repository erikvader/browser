import React from 'react';
import styles from './ErrorDisplay.module.css';

class ErrorDisplay extends React.Component {
  constructor(props) {
    super(props);
    this.state = {error: null};
  }

  showError(err = null) {
    this.setState({error: err});
  }

  render() {
    return (
      <div>
        {this.state.error !== null && <div className={styles.Error}>
                                        <button className={styles.button} onClick={() => this.showError()}>X</button>
                                        {this.state.error.toString()}
                                      </div>}
        {this.props.children(this.showError.bind(this))}
      </div>
    );
  }
}

export default ErrorDisplay;
