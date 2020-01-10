import React from 'react';
import { BeatLoader } from 'react-spinners';
import styles from './SearchEngine.module.css';
import deluge from '../torrent_client/deluge.js';
import memoize from 'memoize-one';

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
          style={{background: this.props.engine.getBackground()}}
        >
          <div className={styles.headName}>{this.props.engine.getName()}</div>
          <div className={styles.headSearch}>search: {this.props.engine.getSearch()}</div>
          <div className={styles.headOrdering}>ordering: {this.props.engine.getOrdering()}</div>
          <div className={styles.headPage}>
            {this.state.curPage} / {this.state.maxPage === null ? "?" : this.state.maxPage}
          </div>
        </div>
        <div className={styles.body}
             style={this.state.folded ? {display: "none"} : null}>
          {this.state.maxPage === 0 && <div>There are no results</div>}
          {this.state.torrents.map((t, i) => <TorrentView
                                               key={i}
                                               torrent={t}
                                               fetchDetails={() => this.fetchDetails.call(this, i)}
                                               deluge={this.props.deluge}
                                             />)}
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
    this.descriptionRef = React.createRef();
    this.headerRef = React.createRef();
    this.options = [
      "Description",
      "Files",
      "Comments"
    ];
  }

  tabbarClick(event, i) {
    this.setState(prev => prev.tabSelected === i ? {tabSelected: null} : {tabSelected: i});
  }

  updateDescription() {
    if (this.props.torrent.description !== null) {
      this.descriptionRef.current.innerHTML = null;
      for (const ele of this.props.torrent.description) {
        this.descriptionRef.current.appendChild(ele);
      }
    }
  }

  componentDidMount() {
    this.updateDescription();
    // TODO: do i need to cleanup this?
    this.headerRef.current.addEventListener("contextmenu", e => {
      e.preventDefault();
      this.createContextMenu(
        this.props.torrent.magnet,
        this.props.deluge.latest
      ).popup(window.remote.getCurrentWindow());
    }, false);
  }

  componentDidUpdate() {
    this.updateDescription();
  }

  createContextMenu = memoize((magnet, latest) => {
    const createItem = dir => ({
      label: dir,
      click: () => {
        const newChoice = deluge.download(latest, dir);
        if (newChoice !== null) this.props.deluge.set(newChoice);
        // TODO: mark as seen
      }
    });
    const menuItems = [
      {
        label: "Download (deluge)",
        enabled: magnet !== null,
        submenu: deluge.getChoices(latest)
          .flatMap(l => [{type: "separator"}, ...l.map(createItem)])
          .slice(1)
      },
      {
        label: "Visit in browser",
        click: () => window.remote.openExternal(this.props.torrent.baseUrl + this.props.torrent.url)
      },
      {type: "separator"},
      {
        label: "Mark as seen"
      },
      {
        label: "Mark as unseen"
      }
    ];
    return window.remote.Menu.buildFromTemplate(menuItems);
  });

  date = memoize(date => new Date(date).toLocaleDateString("sv-SE"));

  render() {
    const disabled = [
      this.props.torrent.description === null,
      this.props.torrent.files === null,
      this.props.torrent.comments === null
    ];
    const datestring = this.date(this.props.torrent.date);

    let spinner;
    if (this.props.torrent.fetching) {
      spinner = <span className={styles.titleSpinner}>
                  <BeatLoader
                    size={7}
                    loading={this.props.torrent.fetching}
                  />
                </span>;
    }

    const noDetailsStyle = this.props.torrent.hasDetails ? " " : ` ${styles.noDetails} `;
    const clickableStyle = this.props.torrent.hasDetails ? " " : ` ${styles.titleClickable} `;

    return (
      <div className={styles.torrent}>
        <div className={styles.torrentHead + noDetailsStyle} ref={this.headerRef}>
          <div className={styles.theadTitle + clickableStyle} onClick={this.props.fetchDetails}>
            {spinner}
            {this.props.torrent.name}
          </div>
          <TorrEle className={styles.theadSeeders} label="Seeders">
            {this.props.torrent.seeders}/{this.props.torrent.leachers}
          </TorrEle>
          <TorrEle className={styles.downloads} label="Downloads">
            {this.props.torrent.downloads}
          </TorrEle>
          <TorrEle className={styles.theadUploader} label="Uploader">
            {this.props.torrent.uploader}
          </TorrEle>
          <TorrEle className={styles.theadDate} label="Date">
            {datestring}
          </TorrEle>
          <TorrEle className={styles.theadCategory} label="Category">
            {this.props.torrent.category}
          </TorrEle>
          <TorrEle className={styles.theadSize} label="Size">
            {this.props.torrent.size}
          </TorrEle>
          <div className={styles.tabbar}>
            {this.options.map((s, i) =>
                              <div
                                onClick={e => disabled[i] || this.tabbarClick(e, i)}
                                key={i}
                                className={[
                                  this.state.tabSelected === i ?
                                    styles.selected : "",
                                  disabled[i] ?
                                    styles.disabled : ""
                                ].join(" ")}>
                                {s}
                              </div>)
            }
          </div>
        </div>
        <div className={styles.torrentBody + noDetailsStyle}
             style={this.state.tabSelected === null ? {display: "none"} : null}>
          <div ref={this.descriptionRef}></div>
        </div>
      </div>
    );
  }
}

function TorrEle(props) {
  let spanClasses = [styles.label];
  if (props.children === null) {
    spanClasses.push(styles.labelDisabled);
  }
  return (
    <div className={props.className}>
      <span className={spanClasses.join(" ")}>
        {props.label}{props.label === "" ? "" : ": "}
      </span>
      <span className={styles.property}>
        {props.children}
      </span>
    </div>
  );
}

export default SearchEngine;
