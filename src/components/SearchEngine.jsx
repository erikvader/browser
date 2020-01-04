import React from 'react';
import { BeatLoader } from 'react-spinners';
const electron = window.require("electron");

class SearchEngine extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      torrents: [],
      curPage: props.engine.getPage(),
      fetchingPages: false
    };
  }

  async fetchMore(event) {
    if (this.state.fetchingPages) return;
    this.setState({fetchingPages: true});
    const n = await this.props.engine.fetchNextPage();
    this.setState(prev => ({
      torrents: [...prev.torrents, ...n],
      fetchingPages: false
    }));
  }

  async fetchDetails(i) {
    let torr = this.state.torrents[i];
    if (torr.fetching || torr.hasDetails) return;

    let torrCopy = torr.clone();
    torrCopy.fetching = true;
    this.setState(prev => {
      let tmp = prev.torrents.slice();
      tmp[i] = torrCopy;
      return {torrents: tmp};
    });

    let torrFilled = await this.props.engine.fetchDetails(torrCopy.clone());
    torrFilled.fetching = false;

    this.setState(prev => {
      let tmp = prev.torrents.slice();
      tmp[i] = torrFilled;
      return {torrents: tmp};
    });
  }

  render() {
    return (
      <div>
        <div>
          <div>{this.props.engine.getName()}</div>
          <div>{this.props.engine.getSearch()}</div>
          <div>{this.props.engine.getOrdering()}</div>
          <div>{this.state.curPage} / {this.props.engine.getMaxPage()}</div>
          <BeatLoader size={7} loading={this.state.fetchingPages} />
          <button onClick={this.fetchMore.bind(this)} disabled={this.state.fetchingPages}>next page</button>
        </div>
        <div>
          {this.state.torrents.map((t, i) => <TorrentView
                                               key={i}
                                               torrent={t}
                                               fetchDetails={() => this.fetchDetails.call(this, i)}
                                             />)}
        </div>
      </div>
    );
  }
}

function TorrentView(props) {
  return (
    <div>
      <button onClick={() => electron.shell.openExternal(props.torrent.url)}>open in browser</button>
      {(!props.torrent.fetching && !props.torrent.hasDetails) && <button onClick={props.fetchDetails}>more</button>}
      <BeatLoader size={7} loading={props.torrent.fetching} />
      {JSON.stringify(props.torrent)}
    </div>
  );
}

export default SearchEngine;
