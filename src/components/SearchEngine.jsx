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
        {!this.state.folded &&
         <div className={styles.body}>
           {this.state.maxPage === 0 && <div>There are no results</div>}
           {this.state.torrents.map((t, i) => <TorrentView
                                                       key={i}
                                                       torrent={t}
                                                       fetchDetails={() => this.fetchDetails.call(this, i)}
                                           />)}
         </div>
        }
      </div>
    );
  }
}

class TorrentView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tabSelected: null
    };
    this.options = [
      "Description",
      "Files",
      "Comments"
    ];
    this.disabled = [];
  }

  tabbarClick(i) {
    if (!this.props.torrent.fetching && !this.props.torrent.hasDetails) {
      this.props.fetchDetails();
    } else if (this.props.torrent.hasDetails && !this.disabled[i]) {
      this.setState(prev => prev.tabSelected === i ? {tabSelected: null} : {tabSelected: i});
    }
  }

  render() {
    // TODO: memoize?
    this.disabled = [
      this.props.torrent.description === null,
      this.props.torrent.files === null,
      this.props.torrent.comments === null
    ];
    const datestring = new Date(this.props.torrent.date).toLocaleDateString("sv-SE");

    let tabbar;
    if (this.props.torrent.fetching) {
      tabbar = <span className={styles.tabbar}>
                 <BeatLoader
                   size={7}
                   loading={this.props.torrent.fetching}
                 />
               </span>;
    } else {
      tabbar = <div className={styles.tabbar}>
                 {this.options.map((s, i) =>
                                   <div
                                     onClick={() => this.tabbarClick(i)}
                                     key={i}
                                     className={[
                                       this.state.tabSelected === i ?
                                         styles.selected : "",
                                       this.disabled[i] ?
                                         styles.disabled : ""
                                     ].join(" ")}>
                                     {s}
                                   </div>)
                 }
               </div>;
    }

    return (
      <div>
        <div className={styles.torrentHead}>
          {tabbar}
          <div className={styles.theadOpen}>
            <a
              href={this.props.torrent.url}
              target="_blank"
              rel="noopener noreferrer">
              link
            </a>
          </div>
          <div className={styles.theadTitle}>{this.props.torrent.name}</div>
          <a href={this.props.torrent.magnet} className={styles.theadMagnet}>magnet</a>
          <div className={styles.theadSeeders}>
            {this.props.torrent.downloads} : {this.props.torrent.seeders}/{this.props.torrent.leachers}
          </div>
          <div className={styles.theadDate}>{datestring}</div>
          <div className={styles.theadCategory}>{this.props.torrent.category}</div>
          <div className={styles.theadSize}>{this.props.torrent.size}</div>
        </div>
        <div>
          {this.props.torrent.description}
        </div>
      </div>
    );
  }
}

export default SearchEngine;
