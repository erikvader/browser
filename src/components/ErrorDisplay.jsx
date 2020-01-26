import React from 'react';
import styles from './ErrorDisplay.module.css';
import 'animate.css';

class ErrorDisplay extends React.Component {
  constructor(props) {
    super(props);
    this.state = {error: null};
  }

  showError(err = null) {
    this.setState({error: err});
  }

  render() {
    const classes = [
      styles.Error,
      "animated",
      "shake"
    ].join(" ");

    return (
      <>
        {this.state.error !== null && <div className={classes}>
                                        <button className={styles.button} onClick={() => this.showError()}>X</button>
                                        {this.state.error.toString()}
                                      </div>}
        {this.props.children(this.showError.bind(this))}
      </>
    );
  }
}

export default ErrorDisplay;
