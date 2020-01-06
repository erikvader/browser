import React from 'react';
import { BeatLoader } from 'react-spinners';
import styles from './SearchEngine.module.css';

class SearchEngine extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      torrents: [],
      curPage: props.engine.getPage(),
      maxPage: props.engine.getMaxPage(),
      fetchingPages: false,
      folded: false
    };
  }

  componentDidMount() {
    this.fetchMore();
  }

  async fetchMore(event) {
    event && event.stopPropagation();
    if (this.state.fetchingPages) return;
    this.setState({fetchingPages: true});
    try {
      const n = await this.props.engine.fetchNextPage();
      this.setState(prev => ({
        torrents: [...prev.torrents, ...n],
        curPage: this.props.engine.getPage(),
        maxPage: this.props.engine.getMaxPage()
      }));
    } catch(err) {
      this.props.showError(err);
      console.error(`An engine (${this.props.engine.getName()}) threw:`, err);
    } finally {
      this.setState({
        fetchingPages: false
      });
    }
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
      <div className={styles.engine}>
        <div
          className={styles.head}
          onClick={() => this.setState(prev => ({folded: !prev.folded}))}
        >
          <div className={styles.headName}>{this.props.engine.getName()}</div>
          <div className={styles.headSearch}>search: {this.props.engine.getSearch()}</div>
          <div className={styles.headOrdering}>ordering: {this.props.engine.getOrdering()}</div>
          <div className={styles.headPage}>
            {this.state.curPage} / {this.state.maxPage === null ? "?" : this.state.maxPage}
          </div>
          <div className={styles.headNext}>
            <BeatLoader size={7} loading={this.state.fetchingPages} />
            {!this.state.fetchingPages &&
             <button
               onClick={this.fetchMore.bind(this)}
               disabled={this.state.fetchingPages} >
               next page
             </button>
            }
          </div>
        </div>
        <div>
          {this.state.maxPage === 0 && <div>There are no results</div>}
          {!this.state.folded &&
           this.state.torrents.map((t, i) => <TorrentView
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
  const datestring = new Date(props.torrent.date).toLocaleDateString("sv-SE");
  return (
    <div>
      <div className={styles.torrentHead}>
        <div className={styles.theadOpen}>
          <a
            href={props.torrent.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            link
          </a>
          {(!props.torrent.fetching && !props.torrent.hasDetails) &&
           <button
             onClick={props.fetchDetails}
           >
             more
           </button>}
        </div>
        <BeatLoader size={7} loading={props.torrent.fetching} />
        <div className={styles.theadTitle}>{props.torrent.name}</div>
        <a href={props.torrent.magnet} className={styles.theadMagnet}>magnet</a>
        <div className={styles.theadSeeders}>{props.torrent.seeders}/{props.torrent.leachers}</div>
        <div className={styles.theadDate}>{datestring}</div>
        <div className={styles.theadDownloads}>{props.torrent.downloads}</div>
        <div className={styles.theadCategory}>{props.torrent.category}</div>
        <div className={styles.theadSize}>{props.torrent.size}</div>
      </div>
      <div>
        {props.torrent.description}
      </div>
    </div>
  );
}

export default SearchEngine;
