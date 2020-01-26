import React from 'react';
import { BeatLoader } from 'react-spinners';
import styles from './SearchEngine.module.css';
import memoize from 'memoize-one';
import 'animate.css';
import closeIcon from '../icons/close.svg';

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
    this.engineRef = React.createRef();
    this.irh = this.indexRebuiltHandler.bind(this);
  }

  indexRebuiltHandler() {
    this.setState(prev => {
      let torr = prev.torrents.slice();
      for (let i = 0; i < torr.length; i++) {
        if (torr[i].files !== null) {
          torr[i] = torr[i].clone();
          torr[i].fillSeenFiles();
        }
        return {torrents: torr};
      }
    });
  }

  componentDidMount() {
    this.fetchMore();
    window.addEventListener("fileIndexRebuilt", this.irh);
  }

  componentWillUnmount() {
    window.removeEventListener("fileIndexRebuilt", this.irh);
  }

  async fetchMore(event) {
    event && event.stopPropagation();
    if (this.state.fetchingPages) return;
    this.setState({fetchingPages: true});
    try {
      const n = await this.props.engine.fetchNextPage();
      n.forEach(t => {
        t.fillSeen();
        t.fillSeenFiles();
      });
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
    torrFilled.fillSeen();
    torrFilled.fillSeenFiles();

    this.setState(prev => {
      let tmp = prev.torrents.slice();
      tmp[i] = torrFilled;
      return {torrents: tmp};
    });
  }

  markAsSeen(i, unmark) {
    this.setState(prev => {
      if (unmark) {
        window.removeSeen(prev.torrents[i]);
      } else {
        window.addSeen(prev.torrents[i]);
      }
      let copy = prev.torrents.slice();
      copy[i] = copy[i].clone();
      copy[i].fillSeen();
      return {torrents: copy};
    });
  }

  fold() {
    this.setState(prev => {
      // if retracting and we have scrolled far enough down
      if (!prev.folded && this.engineRef.current.getBoundingClientRect().y < 0) {
        window.scrollTo(0, this.engineRef.current.offsetTop);
      }
      return {folded: !prev.folded};
    });
  }

  render() {
    const bodyClasses = [
      styles.body,
      this.state.folded ? styles.folded : ""
    ].join(" ");

    return (
      <div className={styles.engine} ref={this.engineRef}>
        <div
          className={styles.head}
          onClick={this.fold.bind(this)}
          style={{background: this.props.engine.getBackground()}}
        >
          <div className={styles.headName}>{this.props.engine.getName()}</div>
          <div className={styles.headSearch}>Search: {this.props.engine.getSearch()}</div>
          <div className={styles.headOrdering}>Ordering: {this.props.engine.getOrdering()}</div>
          <div className={styles.headPage}>
            {this.state.curPage} / {this.state.maxPage === null ? "?" : this.state.maxPage}
          </div>
          <img className={styles.headClose}
               onClick={e => {
                 e.stopPropagation();
                 this.props.remove();
               }}
               src={closeIcon}
               alt="×" />
        </div>
        <div className={bodyClasses}>
          {this.state.maxPage === 0 && <div>There are no results</div>}
          {this.state.torrents.map((t, i) => <TorrentView
                                               key={i}
                                               torrent={t}
                                               fetchDetails={() => this.fetchDetails.call(this, i)}
                                               markAsSeen={(unmark) => this.markAsSeen.call(this, i, unmark)}
                                               deluge={this.props.deluge}
                                               showError={this.props.showError}
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
    this.options = [
      "Description",
      "Files",
      "Comments"
    ];
  }

  tabbarClick(event, i) {
    this.setState(prev => prev.tabSelected === i ? {tabSelected: null} : {tabSelected: i});
  }

  openContextMenu(e) {
    e.preventDefault();
    this.createContextMenu(
      this.props.torrent,
      this.props.deluge.latest
    ).popup(window.remote.getCurrentWindow());
  }

  createContextMenu = memoize((torrent, latest) => {
    const openExternally = "Open Externally";
    const createItem = dir => ({
      label: dir,
      click: async () => {
        if (dir === openExternally) {
          window.remote.openExternal(torrent.magnet);
        } else {
          try {
            await window.delugeDownload(torrent.magnet, dir);
          } catch (err) {
            this.props.showError("Couldn't download, is deluge running?");
            console.error("window.delugeDownload said: ", err);
            return;
          }
          this.props.deluge.set(dir);
        }
        this.props.markAsSeen(false);
      }
    });
    const downloadSubmenu = [];
    if (latest !== null) {
      downloadSubmenu.push([latest]);
    }
    downloadSubmenu.push(window.getGlobal('delugeDirs'));
    downloadSubmenu.push([openExternally]);
    const menuItems = [
      {
        label: "Download (deluge)",
        enabled: torrent.magnet !== null,
        submenu: downloadSubmenu
          .flatMap(l => [{type: "separator"}, ...l.map(createItem)])
          .slice(1)
      },
      {
        label: "Visit in browser",
        click: () => window.remote.openExternal(torrent.baseUrl + torrent.url)
      },
      {type: "separator"},
      {
        label: "Mark as seen",
        enabled: (!torrent.seenMagnet || !torrent.seenUrl) && torrent.magnet !== null,
        click: () => this.props.markAsSeen(false)
      },
      {
        label: "Mark as unseen",
        enabled: torrent.seenMagnet && torrent.seenUrl,
        click: () => this.props.markAsSeen(true)
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

    const torrentClasses = [
      styles.torrent,
      this.props.torrent.seenMagnet ? styles.seenMagnet : "",
      this.props.torrent.seenUrl ? styles.seenUrl : "",
      "animated",
      "fadeIn"
    ];

    let selectedBody = null;
    if (this.state.tabSelected === 0) {
      selectedBody = <HtmlDisplayer tags={this.props.torrent.description} />;
    } else if (this.state.tabSelected === 1) {
      selectedBody = <FileDisplayer
                       files={this.props.torrent.files}
                       marked={this.props.torrent.seenFiles}
                     />;
    } else if (this.state.tabSelected === 2) {
      selectedBody = <CommentsDisplayer comments={this.props.torrent.comments} />;
    }

    const anyFileDownloaded = this.props.torrent.seenFiles !== null && Object.keys(this.props.torrent.seenFiles).length > 0;

    return (
      <div className={torrentClasses.join(" ")}>
        <div className={styles.torrentHead + noDetailsStyle}
             onContextMenu={this.openContextMenu.bind(this)}>
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
          {this.props.torrent.color !== null &&
           <span className={styles.theadCircle} style={{backgroundColor: this.props.torrent.color}}></span>
          }
          <div className={styles.tabbar}>
            {this.options.map((s, i) =>
                              <div
                                onClick={e => disabled[i] || this.tabbarClick(e, i)}
                                key={i}
                                className={[
                                  this.state.tabSelected === i ?
                                    styles.selected : "",
                                  disabled[i] ?
                                    styles.disabled : "",
                                  i === 1 && anyFileDownloaded ?
                                    styles.tabbarFilesDownloaded : "",
                                ].join(" ")}>
                                {s}
                              </div>)
            }
          </div>
        </div>
        <div className={styles.torrentBody + noDetailsStyle}
             style={this.state.tabSelected === null ? {display: "none"} : null}>
          {selectedBody}
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

function HtmlDisplayer(props) {
  const ref = React.useRef(null);
  React.useLayoutEffect(() => {
    ref.current.innerHTML = props.tags;
  }, [props.tags]);
  return (<div ref={ref}></div>);
}

function FileDisplayer(props) {
  const indentAmount = 1;
  let key = 0;

  function stringify(f, indent, path) {
    const indentStyle = {paddingLeft: `${indentAmount*indent}em`};

    if (f.isFolder) {
      const thingy = [
        <div key={key++}
             className={styles.filesFolder}
             style={indentStyle}>
          {f.name}/
        </div>
      ];
      for (const c of f.children.map(c => stringify(c, indent + 1, path + f.name + "/"))) {
        thingy.push(...c);
      }
      return thingy;
    } else {
      const myPath = path + f.name;
      const marked = props.marked !== null && myPath in props.marked;
      let thingy = [
        <div key={key++}
             className={styles.filesFile + " " + (marked ? styles.filesMarked : "")}
             style={indentStyle}>
          {f.name}
          <span className={styles.filesSize}> ({f.size})</span>
        </div>
      ];

      if (marked) {
        thingy.push(
          <div key={key++}
               className={styles.filesLocations}>
            {props.marked[myPath].flatMap((d, i) => [d, <br key={i} />])}
          </div>
        );
      }

      return thingy;
    }
  }

  return (
    <div>
      {props.files.flatMap(f => stringify(f, 0, "/"))}
    </div>
  );
}

function CommentsDisplayer(props) {
  return (
    <div>
      {JSON.stringify(props.comments)}
    </div>
  );
}

export default SearchEngine;
