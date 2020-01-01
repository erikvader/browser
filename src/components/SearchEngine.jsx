import React from 'react';

class SearchEngine extends React.Component {
  constructor(props) {
    super(props);
    this.setState({
      torrents: []
    });
  }
  render() {
    return (
      <div>
        {this.props.engine}
      </div>);
  }
}

function Torrent(props) {
  return (
    <div>
      
    </div>
  );
}

export default SearchEngine;
